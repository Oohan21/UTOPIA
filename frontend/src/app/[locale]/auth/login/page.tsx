'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from '@/lib/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Loader2, LogIn, AlertCircle, ShieldAlert, Mail } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { validateEmail, sanitizeInput } from '@/lib/utils/validation'

const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .refine((email) => validateEmail(email), 'Invalid email format'),
  password: z.string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutTime, setLockoutTime] = useState<number | null>(null)

  // ADD THESE MISSING STATE VARIABLES
  const [showResendVerification, setShowResendVerification] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resendingVerification, setResendingVerification] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const clearAuthErrors = () => {
    setAuthError(null)
    setRemainingAttempts(null)
    setShowResendVerification(false)
    setUnverifiedEmail(null)
    clearErrors()
  }

  const formatLockoutTime = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      return `${hours} hour${hours > 1 ? 's' : ''}`
    }
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  const handleApiError = (error: any) => {
    console.error('Login API error:', error)

    // Extract response data
    const status = error.response?.status
    const data = error.response?.data
    const errorDetail = data?.detail || data?.error || data?.message

    switch (status) {
      case 401:
        // Unauthorized - Incorrect credentials
        const errorMessage = errorDetail || 'Invalid email or password'
        setAuthError(errorMessage)

        // Check if there are remaining attempts in the response
        if (data?.remaining_attempts !== undefined) {
          setRemainingAttempts(data.remaining_attempts)
          if (data.remaining_attempts <= 3) {
            toast.error(`Incorrect password. ${data.remaining_attempts} attempt${data.remaining_attempts === 1 ? '' : 's'} remaining`)
          } else {
            toast.error('Invalid email or password')
          }
        } else {
          toast.error('Invalid email or password')
        }

        // Clear password field for security
        reset({ password: '' })
        setError('password', { type: 'manual', message: ' ' })
        break

      case 400:
        // Bad Request - Validation errors
        if (data?.email) {
          setAuthError(data.email[0])
          toast.error(data.email[0])
        } else if (data?.password) {
          setAuthError(data.password[0])
          toast.error(data.password[0])
        } else if (data?.non_field_errors) {
          setAuthError(data.non_field_errors[0])
          toast.error(data.non_field_errors[0])
        } else {
          setAuthError('Invalid login credentials')
          toast.error('Invalid login credentials')
        }
        break

      case 403:
        if (errorDetail?.includes('verify') || data?.requires_verification) {
          setAuthError('Please verify your email before logging in.');

          // Store user data for verification page
          if (data?.email && data?.user_id) {
            sessionStorage.setItem('unverified_email', data.email);
            sessionStorage.setItem('unverified_user_id', data.user_id);
          }

          // Show resend verification option
          setShowResendVerification(true);
          setUnverifiedEmail(data?.email || '');

          toast.error('Email verification required');
        } else if (errorDetail?.includes('locked') || errorDetail?.includes('temporarily')) {
          setIsLocked(true)
          // Extract lockout time if provided
          const lockoutMatch = errorDetail?.match(/(\d+)/)
          if (lockoutMatch) {
            setLockoutTime(parseInt(lockoutMatch[1]))
          }
          setAuthError('Account temporarily locked due to too many failed attempts')
          toast.error('Account temporarily locked. Please try again later.')
        } else if (errorDetail?.includes('disabled')) {
          setAuthError('Your account has been disabled. Please contact support.')
          toast.error('Account disabled. Please contact support.')
        } else {
          setAuthError('Access forbidden. Please contact support.')
          toast.error('Access forbidden')
        }
        break

      case 404:
        // Not Found - User doesn't exist
        setAuthError('No account found with this email')
        toast.error('No account found with this email')
        break

      case 429:
        // Too Many Requests - Rate limiting
        setAuthError('Too many login attempts. Please try again later.')
        toast.error('Too many login attempts. Please wait before trying again.')
        break

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        setAuthError('Server error. Please try again later.')
        toast.error('Server error. Please try again later.')
        break

      default:
        // Network errors or other issues
        if (error.message?.includes('Network') || error.message?.includes('network')) {
          setAuthError('Network error. Please check your internet connection.')
          toast.error('Network error. Please check your connection')
        } else {
          setAuthError(error.message || 'Login failed. Please try again.')
          toast.error(error.message || 'Login failed')
        }
    }
  }

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;

    setResendingVerification(true);
    try {
      await authApi.resendVerificationEmail();
      toast.success('Verification email sent! Please check your inbox.');
      setShowResendVerification(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    clearAuthErrors()
    setIsLoading(true)
    setIsLocked(false)
    setLockoutTime(null)

    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(data.email).toLowerCase()
      const sanitizedPassword = sanitizeInput(data.password)

      await login(sanitizedEmail, sanitizedPassword)
      toast.success('Login successful!')

      // Check if user is admin and redirect accordingly
      const isAdmin = user?.user_type === 'admin' ||
        user?.is_staff === true ||
        user?.is_superuser === true

      if (isAdmin) {
        router.push('/admin')
      } else {
        router.push('/')
      }
    } catch (error: any) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    const email = watchEmail()
    if (email && validateEmail(email)) {
      router.push(`/auth/forgot-password?email=${encodeURIComponent(email)}`)
    } else {
      router.push('/auth/forgot-password')
    }
  }

  // Watch email field for forgot password pre-fill
  const watchEmail = () => {
    const form = document.querySelector('form')
    if (form) {
      const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]')
      return emailInput?.value || ''
    }
    return ''
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg">
              <Image
                src="/logo.jpg"
                alt="Logo"
                width={130}
                height={130}
                priority
                onError={(e) => {
                  e.currentTarget.src = '/logo-placeholder.jpg'
                }}
              />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3">
              <div className="flex items-start">
                <AlertCircle className="mr-2 mt-0.5 h-4 w-4 text-destructive flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">
                    {authError}
                  </p>

                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <p className="text-xs text-destructive/80">
                      {remainingAttempts} attempt{remainingAttempts === 1 ? '' : 's'} remaining
                    </p>
                  )}

                  {remainingAttempts !== null && remainingAttempts === 0 && (
                    <p className="text-xs text-destructive/80">
                      Account locked. Please use "Forgot Password" to reset.
                    </p>
                  )}

                  {isLocked && (
                    <div className="flex items-start mt-2">
                      <ShieldAlert className="mr-2 h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-amber-700 font-medium">
                          Account temporarily locked
                        </p>
                        {lockoutTime && (
                          <p className="text-xs text-amber-600">
                            Please try again in {formatLockoutTime(lockoutTime)}
                          </p>
                        )}
                        <p className="text-xs text-amber-600 mt-1">
                          You can reset your password to unlock your account immediately.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Show resend verification option */}
                  {showResendVerification && unverifiedEmail && (
                    <div className="mt-3 pt-3 border-t border-destructive/20">
                      <div className="flex items-start">
                        <Mail className="mr-2 h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-700">
                            Need a new verification email?
                          </p>
                          <Button
                            onClick={handleResendVerification}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            disabled={resendingVerification}
                          >
                            {resendingVerification ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              'Resend Verification Email'
                            )}
                          </Button>
                          <p className="text-xs text-blue-600 mt-1">
                            Or go to{' '}
                            <Link
                              href="/auth/verify-email"
                              className="underline hover:text-blue-800"
                            >
                              verification page
                            </Link>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              {...register('email', {
                onChange: clearAuthErrors,
              })}
              error={errors.email?.message}
              required
              disabled={isLoading || isLocked}
              aria-describedby={errors.email ? "email-error" : undefined}
              autoComplete="email"
            />

            <div className="space-y-2">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                {...register('password', {
                  onChange: clearAuthErrors,
                })}
                error={errors.password?.message}
                required
                disabled={isLoading || isLocked}
                aria-describedby={errors.password ? "password-error" : undefined}
                autoComplete="current-password"
              />
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  {remainingAttempts !== null && remainingAttempts <= 3 && (
                    <span className="text-amber-600 font-medium">
                      {remainingAttempts} attempt{remainingAttempts === 1 ? '' : 's'} left
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isSubmitting || isLocked}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : isLocked ? (
                <>
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Account Locked
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </>
              )}
            </Button>

            {isLocked && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                <div className="flex">
                  <ShieldAlert className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Account temporarily suspended</p>
                    <p className="mt-1">
                      For immediate access, use{' '}
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-amber-700 font-medium hover:underline"
                      >
                        Forgot Password
                      </button>{' '}
                      to reset your password.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}