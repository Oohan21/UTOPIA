'use client'

import React, { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/admin/AdminLayout'
import { Shield } from 'lucide-react'

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, user, checkAdminAccess } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/admin')
    } else if (!checkAdminAccess()) {
      router.push('/')
    }
  }, [isAuthenticated, user, router, checkAdminAccess])

  // Show loading state
  if (!isAuthenticated || !checkAdminAccess()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mb-4 animate-spin">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <p className="text-lg font-medium">Loading admin panel...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Checking permissions...
          </p>
        </div>
      </div>
    )
  }

  return <AdminLayout>{children}</AdminLayout>
}