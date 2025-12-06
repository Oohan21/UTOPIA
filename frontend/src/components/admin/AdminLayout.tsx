'use client'

import React from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Shield, Home, Users, FileText, BarChart3, Settings, Building2, Bell, LogOut, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { useState } from 'react'
import toast from 'react-hot-toast'

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
  { href: '/admin/properties', label: 'Properties', icon: <Building2 className="h-4 w-4" /> },
  { href: '/admin/users', label: 'Users', icon: <Users className="h-4 w-4" /> },
  { href: '/admin/inquiries', label: 'Inquiries', icon: <FileText className="h-4 w-4" /> },
  { href: '/admin/audit', label: 'Audit Log', icon: <Shield className="h-4 w-4" /> },
  { href: '/admin/reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> },
  { href: '/admin/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      router.push('/auth/login')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const getInitials = () => {
    if (!user) return 'A'
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'A'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Mobile menu button & Logo */}
            <div className="flex items-center">
              <button
                type="button"
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <span className="sr-only">Open sidebar</span>
                {sidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <div className="ml-4 flex items-center">
                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">UTOPIA Real Estate</p>
                </div>
              </div>
            </div>

            {/* Right: Notifications & User menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {notifications}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profile_picture} alt={user?.email} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:inline-flex"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar for desktop */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-64 transform overflow-y-auto bg-white dark:bg-gray-800 transition duration-300 ease-in-out lg:static lg:inset-0 lg:translate-x-0 lg:transition-none ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="flex h-full flex-col">
            {/* Sidebar content */}
            <div className="flex-1 px-4 py-8">
              <nav className="space-y-1">
                {adminNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Sidebar footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-6">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <p className="font-medium text-gray-700 dark:text-gray-300">System Status</p>
                <div className="mt-2 flex items-center">
                  <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                  <span>All systems operational</span>
                </div>
                <p className="mt-4 text-xs">
                  UTOPIA v1.0.0 • © {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {/* Overlay for mobile sidebar */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-gray-600 bg-opacity-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}