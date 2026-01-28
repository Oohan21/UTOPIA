'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/lib/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { validatePhone, sanitizeInput } from '@/lib/utils/validation';

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().optional().refine(val => !val || validatePhone(val), 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const { register, handleSubmit, setError, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setGlobalError(null);
    try {
      await registerUser({
        first_name: sanitizeInput(data.first_name),
        last_name: sanitizeInput(data.last_name),
        email: sanitizeInput(data.email).toLowerCase(),
        phone_number: data.phone_number ? sanitizeInput(data.phone_number) : undefined,
        password: data.password,
        password2: data.confirm_password,
      });
      toast.success('Registration successful! Please check your email to verify your account.');
      router.push('/auth/login');
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData) {
        // Handle field-specific errors
        Object.keys(errorData).forEach((key) => {
          if (['email', 'password', 'phone_number', 'first_name', 'last_name'].includes(key)) {
            // DRF returns arrays of strings for errors
            const message = Array.isArray(errorData[key]) ? errorData[key][0] : errorData[key];
            // @ts-ignore
            setError(key as any, { type: 'manual', message });
          }
        });

        // Set global error if it's a general non-field error or fallback
        if (!Object.keys(errorData).some(k => ['email', 'password', 'phone_number', 'first_name', 'last_name'].includes(k))) {
          setGlobalError(errorData.detail || errorData.message || errorData.error || 'Registration failed');
        }
      } else {
        setGlobalError(err.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm bg-transparent sm:bg-card">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Join Utopia to find your dream property
          </CardDescription>
        </CardHeader>
        <CardContent>
          {globalError && (
            <div className="mb-4 flex items-center rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mr-2 h-4 w-4" />
              {globalError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                {...register('first_name')}
                error={errors.first_name?.message}
                disabled={isLoading}
              />
              <Input
                label="Last Name"
                {...register('last_name')}
                error={errors.last_name?.message}
                disabled={isLoading}
              />
            </div>
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              disabled={isLoading}
            />
            <Input
              label="Phone Number (Optional)"
              {...register('phone_number')}
              error={errors.phone_number?.message}
              disabled={isLoading}
            />
            <Input
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              disabled={isLoading}
            />
            <Input
              label="Confirm Password"
              type="password"
              {...register('confirm_password')}
              error={errors.confirm_password?.message}
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}