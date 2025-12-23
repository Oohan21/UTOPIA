'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { subscriptionApi } from '@/lib/api/subscriptions';
import { listingsApi } from '@/lib/api/listings';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import {
    Loader2,
    CheckCircle,
    XCircle,
    AlertCircle,
    Home,
    Calendar,
    DollarSign,
    ArrowRight,
    ExternalLink
} from 'lucide-react';

export default function PaymentCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
    const [paymentData, setPaymentData] = useState<any>(null);
    const [propertyData, setPropertyData] = useState<any>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                setStatus('loading');

                // Get parameters from URL (what Chapa sends back)
                const txRef = searchParams.get('tx_ref');
                const promotionId = searchParams.get('promotion_id');
                const paymentId = searchParams.get('payment_id');
                const propertyId = searchParams.get('property_id');
                const paymentStatus = searchParams.get('status');

                console.log('Payment callback params:', {
                    txRef,
                    promotionId,
                    paymentId,
                    propertyId,
                    paymentStatus
                });

                // If payment failed or was cancelled by user
                if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
                    setStatus('failed');
                    setError('Payment was cancelled or failed. Please try again.');
                    return;
                }

                // We need at least tx_ref or promotion_id to verify
                if (!txRef && !promotionId && !paymentId) {
                    setStatus('failed');
                    setError('Missing payment reference. Please contact support.');
                    return;
                }

                const verifyParams: Record<string, string> = {};

                if (txRef && txRef.trim() !== '') verifyParams.tx_ref = txRef;
                if (promotionId && promotionId.trim() !== '') verifyParams.promotion_id = promotionId;
                if (paymentId && paymentId.trim() !== '') verifyParams.payment_id = paymentId;
                if (propertyId && propertyId.trim() !== '') verifyParams.property_id = propertyId;

                console.log('Sending verification with params:', verifyParams);

                // Verify payment with backend
                const verification = await subscriptionApi.verifyPayment(verifyParams);

                console.log('Payment verification result:', verification);

                if (verification.payment?.status === 'completed') {
                    setStatus('success');
                    setPaymentData(verification);

                    // Fetch property details if we have property_id
                    if (verification.promotion?.property_id) {
                        try {
                            const property = await listingsApi.getPropertyById(
                                verification.promotion.property_id
                            );
                            setPropertyData(property);
                        } catch (err) {
                            console.warn('Could not fetch property details:', err);
                        }
                    } else if (propertyId) {
                        // Fallback to URL parameter
                        try {
                            const property = await listingsApi.getPropertyById(parseInt(propertyId));
                            setPropertyData(property);
                        } catch (err) {
                            console.warn('Could not fetch property details:', err);
                        }
                    }

                    // Clean up any temporary storage
                    localStorage.removeItem('pending_payment');
                    if (propertyId) {
                        localStorage.removeItem(`temp_property_${propertyId}`);
                    }

                } else if (verification.payment?.status === 'pending') {
                    setStatus('pending');
                    setError('Payment is still pending. Please wait a moment and refresh.');
                } else {
                    setStatus('failed');
                    setError('Payment verification failed. Please contact support.');
                }

            } catch (err: any) {
                console.error('Payment verification error:', err);
                setStatus('failed');
                setError(err.response?.data?.error || 'An error occurred during payment verification.');
            }
        };

        verifyPayment();
    }, [searchParams]);

    const getStatusConfig = () => {
        switch (status) {
            case 'loading':
                return {
                    icon: <Loader2 className="h-8 w-8 animate-spin text-blue-500" />,
                    title: 'Verifying Payment',
                    description: 'Please wait while we verify your payment...',
                    color: 'blue'
                };
            case 'success':
                return {
                    icon: <CheckCircle className="h-8 w-8 text-green-500" />,
                    title: 'Payment Successful!',
                    description: 'Your property promotion has been activated successfully.',
                    color: 'green'
                };
            case 'failed':
                return {
                    icon: <XCircle className="h-8 w-8 text-red-500" />,
                    title: 'Payment Failed',
                    description: 'There was an issue with your payment.',
                    color: 'red'
                };
            case 'pending':
                return {
                    icon: <AlertCircle className="h-8 w-8 text-yellow-500" />,
                    title: 'Payment Pending',
                    description: 'Your payment is being processed.',
                    color: 'yellow'
                };
        }
    };

    const statusConfig = getStatusConfig();

    const formatDuration = (days: number): string => {
        if (days === 7) return '1 Week';
        if (days === 30) return '1 Month';
        if (days === 60) return '2 Months';
        if (days === 90) return '3 Months';
        return `${days} days`;
    };

    const getTierDisplayName = (tierType: string): string => {
        const tierMap: Record<string, string> = {
            'basic': 'Basic',
            'standard': 'Standard',
            'premium': 'Premium'
        };
        return tierMap[tierType] || tierType;
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-xl">
                <CardHeader className="text-center space-y-4">
                    {statusConfig.icon}
                    <div>
                        <CardTitle className="text-2xl">{statusConfig.title}</CardTitle>
                        <CardDescription className="text-base mt-2">
                            {statusConfig.description}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Payment Details */}
                    {paymentData && (
                        <div className="rounded-lg border border-border p-4 bg-muted/30">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                Payment Details
                            </h3>
                            <div className="space-y-2">
                                {paymentData.payment && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Amount:</span>
                                            <span className="font-bold text-lg text-green-600">
                                                {paymentData.payment.amount?.toLocaleString() || '0'} ETB
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Status:</span>
                                            <Badge variant={
                                                paymentData.payment.status === 'completed' ? 'default' :
                                                    paymentData.payment.status === 'pending' ? 'secondary' :
                                                        'destructive'
                                            }>
                                                {paymentData.payment.status}
                                            </Badge>
                                        </div>
                                        {paymentData.payment.paid_at && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Paid at:</span>
                                                <span className="font-medium">
                                                    {new Date(paymentData.payment.paid_at).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {paymentData.promotion && (
                                    <>
                                        <Separator className="my-2" />
                                        <h4 className="font-medium mb-2">Promotion Details</h4>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tier:</span>
                                            <Badge variant="outline" className="capitalize">
                                                {getTierDisplayName(paymentData.promotion.tier)}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Duration:</span>
                                            <span className="font-medium flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {formatDuration(paymentData.promotion.duration_days || 30)}
                                            </span>
                                        </div>
                                        {paymentData.promotion.end_date && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Valid until:</span>
                                                <span className="font-medium">
                                                    {new Date(paymentData.promotion.end_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Property Details */}
                    {propertyData && (
                        <div className="rounded-lg border border-border p-4">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                Property Details
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Title:</span>
                                    <span className="font-medium truncate max-w-[200px]">
                                        {propertyData.title}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Location:</span>
                                    <span className="font-medium">
                                        {propertyData.city?.name}, {propertyData.sub_city?.name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge variant={propertyData.is_promoted ? 'default' : 'secondary'}>
                                        {propertyData.is_promoted ? 'Promoted' : 'Standard'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && status === 'failed' && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {status === 'pending' && (
                        <Alert className="bg-yellow-50 border-yellow-200">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertTitle className="text-yellow-800">Payment Processing</AlertTitle>
                            <AlertDescription className="text-yellow-700">
                                Your payment is being processed. This may take a few minutes.
                                You can refresh this page in a moment to check the status.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                    {status === 'success' && paymentData?.promotion?.property_id && (
                        <>
                            <Button
                                className="w-full gap-2"
                                onClick={() => router.push(`/listings/${paymentData.promotion.property_id}`)}
                            >
                                <ExternalLink className="h-4 w-4" />
                                View Property
                            </Button>
                        </>
                    )}

                    {status === 'failed' && (
                        <>
                            <Button
                                className="w-full"
                                onClick={() => {
                                    const propertyId = searchParams.get('property_id');
                                    if (propertyId) {
                                        router.push(`/listings/${propertyId}/promote`);
                                    } else {
                                        router.push('/dashboard/promotions');
                                    }
                                }}
                            >
                                Try Again
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push('/listings')}
                            >
                                Browse Properties
                            </Button>
                        </>
                    )}

                    {status === 'pending' && (
                        <div className="space-y-3 w-full">
                            <Button
                                className="w-full"
                                onClick={() => window.location.reload()}
                            >
                                Refresh Status
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push('/dashboard')}
                            >
                                Return to Dashboard
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}