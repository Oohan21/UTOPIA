// src/components/admin/AdminLayout.tsx - UPDATED
'use client'

import React, { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Home,
  Users,
  Building2,
  MessageSquare,
  BarChart3,
  Settings,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/Scroll-area';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const navItems = [
    { icon: <Home size={20} />, label: 'Dashboard', href: '/admin' },
    { icon: <Users size={20} />, label: 'Users', href: '/admin/users' },
    { icon: <Building2 size={20} />, label: 'Properties', href: '/admin/properties' },
    { icon: <MessageSquare size={20} />, label: 'Inquiries', href: '/admin/inquiries' },
    { icon: <CheckCircle size={20} />, label: 'Approval', href: '/admin/properties/approval' },
    { icon: <FileText size={20} />, label: 'Reports', href: '/admin/reports' },
    { icon: <BarChart3 size={20} />, label: 'Analytics', href: '/admin/analytics' },
    { icon: <Settings size={20} />, label: 'Settings', href: '/admin/settings' },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  // Check if user is admin
  const isAdmin = user?.user_type === 'admin' || user?.is_staff || user?.is_superuser;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access the admin panel.
          </p>
          <Button onClick={() => router.push('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin-specific Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="mr-2 lg:hidden"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  Admin Panel
                </span>
                <Badge variant="outline" className="ml-3">
                  Beta
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => router.push('/admin/notifications')}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>

              <div className="relative group">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar>
                    {user?.profile_picture ? (
                      <AvatarImage src={user.profile_picture} alt={user.first_name} />
                    ) : null}
                    <AvatarFallback>
                      {(user?.first_name?.[0] || user?.email?.[0])?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">
                      {user?.first_name && user?.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user?.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Administrator
                    </p>
                  </div>
                </Button>

                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 hidden group-hover:block z-50 border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => router.push('/admin/profile')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Admin-specific Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-200 ease-in-out h-[calc(100vh-4rem)]`}
        >
          <ScrollArea className="h-full">
            <nav className="px-4 py-6">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start ${
                        pathname === item.href
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => router.push(item.href)}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                    </Button>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Quick Actions
                </h3>
                <ul className="space-y-1">
                  <li>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      onClick={() => router.push('/admin/users/create')}
                    >
                      <Users size={16} className="mr-3" />
                      Add New User
                    </Button>
                  </li>
                </ul>
              </div>

              <div className="mt-8 px-3">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    System Status
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-700 dark:text-blue-300">
                        API
                      </span>
                      <Badge variant="default" className="bg-green-500 text-white">
                        Online
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-700 dark:text-blue-300">
                        Database
                      </span>
                      <Badge variant="default" className="bg-green-500 text-white">
                        Healthy
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </ScrollArea>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;