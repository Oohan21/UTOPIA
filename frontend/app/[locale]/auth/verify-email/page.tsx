'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle, Loader2, Mail, AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'missing'>(
    token ? 'loading' : 'missing'
  )
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Get email from localStorage or context
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setEmail(user.email)
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e)
      }
    }

    if (token) {
      verifyToken(token)
    }
  }, [token])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [cooldown])

  const verifyToken = async (token: string) => {
    try {
      console.log('Verifying token:', token)
      
      const response = await fetch('http://localhost:8000/api/auth/verify-email/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        credentials: 'include',
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (response.ok && data.success) {
        setStatus('success')
        setMessage(data.message || 'Email verified successfully!')
        
        // Update stored user
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        
        toast.success('Email verified successfully!')
        
        // Auto-redirect
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.error || data.message || 'Verification failed')
        toast.error(data.error || 'Verification failed')
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage(error.message || 'Verification failed')
      toast.error(error.message || 'Verification failed')
    }
  }

  const handleResendVerification = async () => {
    setResending(true)
    try {
      const response = await fetch('http://localhost:8000/api/auth/resend-verification/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (data.email_verified) {
          toast.success('Email is already verified!')
          setStatus('success')
          setMessage('Your email is already verified.')
          setTimeout(() => router.push('/dashboard'), 2000)
          return
        }
        
        toast.success('Verification email sent! Check your inbox.')
        setMessage('Verification email sent. Please check your inbox.')
        
        // Set cooldown
        if (data.next_resend_allowed) {
          const nextTime = new Date(data.next_resend_allowed).getTime()
          const now = new Date().getTime()
          const seconds = Math.max(0, Math.ceil((nextTime - now) / 1000))
          setCooldown(seconds)
        } else {
          setCooldown(60) // Default 60 seconds cooldown
        }
      } else {
        toast.error(data.error || 'Failed to send verification email')
        setMessage(data.error || 'Failed to send verification email')
        
        // Check if it's a rate limit error
        if (data.error && data.error.includes('wait')) {
          setCooldown(60) // Set 60 seconds cooldown
        }
      }
    } catch (error: any) {
      console.error('Resend error:', error)
      toast.error(error.message || 'Failed to send verification email')
    } finally {
      setResending(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
              status === 'success' ? 'bg-green-100' : 
              status === 'error' ? 'bg-red-100' : 
              'bg-blue-100'
            }`}>
              {status === 'loading' ? (
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              ) : status === 'success' ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : status === 'error' ? (
                <XCircle className="h-8 w-8 text-red-600" />
              ) : (
                <Mail className="h-8 w-8 text-blue-600" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' ? 'Verifying Email...' :
             status === 'success' ? 'Email Verified!' :
             status === 'error' ? 'Verification Failed' :
             'Email Verification Required'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' ? 'Please wait while we verify your email address' :
             status === 'success' ? 'Your email has been successfully verified' :
             status === 'error' ? message :
             'Please verify your email to continue'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {email && (
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-sm text-gray-600">
                Email: <span className="font-medium">{email}</span>
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-green-800">
                  You can now enjoy all features of UTOPIA Real Estate Platform.
                </p>
                <p className="text-sm text-green-600 mt-2">
                  Redirecting to dashboard...
                </p>
              </div>
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Go to Dashboard Now
              </Button>
            </>
          )}
          
          {(status === 'error' || status === 'missing') && (
            <>
              <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-yellow-800 font-medium">
                      {status === 'error' ? 'Verification Failed' : 'Verification Required'}
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {message || 'Please verify your email to access all features.'}
                    </p>
                    <ul className="text-sm text-yellow-600 mt-2 space-y-1 pl-4">
                      <li>• Check your email inbox</li>
                      <li>• Look in spam/junk folder</li>
                      <li>• Make sure email is correct: {email}</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={handleResendVerification}
                  className="w-full"
                  disabled={resending || cooldown > 0}
                >
                  {resending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : cooldown > 0 ? (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Resend Available in {formatTime(cooldown)}
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push('/auth/login')}
                    variant="outline"
                    className="flex-1"
                  >
                    Back to Login
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    variant="ghost"
                    className="flex-1"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </>
          )}
          
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-lg bg-gray-100 p-3 mt-4">
              <p className="text-xs text-gray-600">
                <strong>Debug:</strong> Token: {token ? 'Present' : 'Missing'} | 
                Status: {status} | 
                Email: {email || 'Not found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}