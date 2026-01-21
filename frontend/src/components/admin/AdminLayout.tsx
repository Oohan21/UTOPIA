// src/components/admin/AdminLayout.tsx - MATCHING HEADER STYLING
'use client'

import React, { ReactNode, useState, useEffect, startTransition } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import NotificationBell from '@/components/notifications/NotificationBell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import {
  Home,
  Users,
  User,
  LogOut,
  Building2,
  MessageSquare,
  BarChart3,
  FileText,
  Menu,
  X,
  Moon,
  Sun,
  Globe,
  CheckCircle,
  Shield,
  ChevronRight,
  Package,
  Heart,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  children?: NavItem[];
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    properties: false
  });
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useTranslations('common');
  const tAdmin = useTranslations('common.admin');
  const locale = useLocale();

  const locales = ['en', 'am', 'om'] as const;
  const localeNames = {
    en: 'English',
    am: 'አማርኛ',
    om: 'Afaan Oromoo'
  };

  const navItems: NavItem[] = [
    {
      icon: <Home size={20} />,
      label: tAdmin('dashboard.title'),
      href: `/${locale}/admin`,
    },
    {
      icon: <Users size={20} />,
      label: tAdmin('users.title'),
      href: `/${locale}/admin/users`,
    },
    {
      icon: <Building2 size={20} />,
      label: tAdmin('properties.title'),
      href: `/${locale}/admin/properties`,
      children: [
        {
          icon: <Building2 size={16} />,
          label: tAdmin('properties.all', { fallback: 'All Properties' }),
          href: `/${locale}/admin/properties`,
        },
        {
          icon: <CheckCircle size={16} />,
          label: tAdmin('approval.title', { fallback: 'Approval' }),
          href: `/${locale}/admin/properties/approval`,
        }
      ]
    },
    {
      icon: <MessageSquare size={20} />,
      label: tAdmin('inquiries.title'),
      href: `/${locale}/admin/inquiries`,
    },
    {
      icon: <FileText size={20} />,
      label: tAdmin('reports.title'),
      href: `/${locale}/admin/reports`,
    },
    {
      icon: <BarChart3 size={20} />,
      label: tAdmin('analytics.title'),
      href: `/${locale}/admin/analytics`,
    },
    {
      icon: <Shield size={20} />,
      label: tAdmin('audit.title'),
      href: `/${locale}/admin/audit`,
    },
  ];

  useEffect(() => {
    setMounted(true);
    
    // Auto-expand properties section if on a property-related page
    if (pathname.includes('/admin/properties')) {
      setExpandedItems(prev => ({ ...prev, properties: true }));
    }
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    startTransition(() => {
      router.push(`/${locale}/auth/login`);
    });
  };

  const isNavItemActive = (href: string) => {
    if (href === `/${locale}/admin`) {
      return pathname === `/${locale}/admin`;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Check if this is the exact active item (not just a parent)
  const isExactNavItemActive = (href: string) => {
    return pathname === href;
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const changeLanguage = (newLocale: string) => {
    const pathWithoutLocale = pathname.replace(/^\/(en|am|om)/, '') || '/';
    startTransition(() => {
      router.push(`/${newLocale}${pathWithoutLocale}`);
    });
    setIsSidebarOpen(false);
  };

  const getInitials = () => {
    if (!user) return "A";
    return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "A";
  };

  const isAdmin = user?.user_type === 'admin' || user?.is_staff || user?.is_superuser;

  const toggleItemExpansion = (itemLabel: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemLabel]: !prev[itemLabel]
    }));
  };

  const renderNavItem = (item: NavItem, isMobile = false) => {
    const isActive = isNavItemActive(item.href);
    const isExactActive = isExactNavItemActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.label] || false;

    if (hasChildren && !isMobile) {
      // Check if any child is active
      const hasActiveChild = item.children!.some(child => isNavItemActive(child.href));
      
      return (
        <div key={item.label} className="mb-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between h-10 px-3 text-left",
              // Parent items should NOT be highlighted when children are active
              isExactActive
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
            onClick={() => toggleItemExpansion(item.label)}
          >
            <div className="flex items-center flex-1 min-w-0">
              <span className={cn(
                "mr-3",
                isExactActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              )}>
                {item.icon}
              </span>
              <span className="text-sm font-medium truncate">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
          
          {/* Child items */}
          {isExpanded && (
            <div className="ml-8 mt-1 space-y-1">
              {item.children!.map((child) => {
                const isChildActive = isNavItemActive(child.href);
                return (
                  <Button
                    key={child.href}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-9 px-3 text-left text-sm",
                      isChildActive
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                    onClick={() => {
                      router.push(child.href);
                    }}
                  >
                    <span className={cn(
                      "mr-3",
                      isChildActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                    )}>
                      {child.icon}
                    </span>
                    <span className="font-medium truncate">{child.label}</span>
                    {isChildActive && (
                      <ChevronRight className="ml-2 h-3 w-3 text-blue-600 dark:text-blue-400" />
                    )}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Regular item without children or for mobile view
    return (
      <Button
        key={item.href}
        variant="ghost"
        className={cn(
          isMobile ? "w-full justify-start h-10 px-3 text-left" : "w-full justify-start h-10 px-3 text-left mb-1",
          isActive
            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        )}
        onClick={() => {
          router.push(item.href);
          if (isMobile) setIsSidebarOpen(false);
        }}
      >
        <span className={cn(
          "mr-3",
          isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
        )}>
          {item.icon}
        </span>
        <span className="text-sm font-medium truncate">{item.label}</span>
        {isActive && !hasChildren && (
          <ChevronRight className="ml-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
        )}
      </Button>
    );
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                suppressHydrationWarning
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2" suppressHydrationWarning>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500">
                  <div className="h-6 w-6 animate-pulse bg-blue-400 dark:bg-blue-300" />
                </div>
                <div className="hidden h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700 sm:block" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </header>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center p-4 sm:p-6 md:p-8 max-w-md">
          <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 dark:text-red-400 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Access Denied
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
            You don't have permission to access the admin panel. Only administrators can access this area.
          </p>
          <Button onClick={() => router.push('/')} size="sm" className="px-4 sm:px-6">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              suppressHydrationWarning
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link href={`/${locale}/admin`} className="flex items-center gap-2" suppressHydrationWarning>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white-600 dark:bg-grey-500">
                <Image
                  src="/favicon.ico"
                  alt="UTOPIA Logo"
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-xl font-bold text-gray-900 dark:text-white">UTOPIA</span>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-[-2px]">Admin Panel</span>
              </div>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" suppressHydrationWarning>
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">{localeNames[locale as keyof typeof localeNames]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {locales.map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => changeLanguage(lang)}
                    className={cn(
                      "text-gray-700 dark:text-gray-300",
                      locale === lang ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    {localeNames[lang]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden sm:flex text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
              suppressHydrationWarning
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" suppressHydrationWarning>
                    <Avatar className="h-8 w-8 ring-2 ring-gray-200 dark:ring-gray-700">
                      {user?.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={user.email}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {getInitials()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="p-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">
                        {user?.user_type || 'Admin'}
                      </Badge>
                      {user?.is_premium && (
                        <Badge className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-800">
                          Premium
                        </Badge>
                      )}
                      <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800">
                        Admin
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  <DropdownMenuItem asChild className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <Link href={`/${locale}/account`} className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      {t('myAccount')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <Link href={`/${locale}/account/listings`} className="flex items-center w-full">
                      <Package className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      {t('myListings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <Link href={`/${locale}/account/saved`} className="flex items-center w-full">
                      <Heart className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      {t('saved')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <Link href={`/${locale}`} className="flex items-center w-full">
                      <Home className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      View Site
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('logOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  asChild
                  size="sm"
                  className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  suppressHydrationWarning
                >
                  <Link href={`/${locale}/auth/login`}>
                    {t('signIn')}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isSidebarOpen && (
          <div className="container border-t border-gray-200 dark:border-gray-700 py-4 bg-white dark:bg-gray-900 lg:hidden">
            {/* Mobile Nav Links */}
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => renderNavItem(item, true))}

              {/* Language Switcher - Mobile */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                  Language
                </p>
                {locales.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => changeLanguage(lang)}
                    className={`w-full text-left py-2 text-sm font-medium ${locale === lang
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                      }`}
                  >
                    {localeNames[lang]}
                  </button>
                ))}
              </div>

              {/* Mobile Theme Toggle */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 w-full py-2 text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {resolvedTheme === 'dark' ? (
                    <>
                      <Sun className="h-4 w-4" />
                      Switch to Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" />
                      Switch to Dark Mode
                    </>
                  )}
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Layout */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
            <nav className="p-4">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Navigation</h2>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => renderNavItem(item, false))}
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto"> 
              <div className="p-4 md:p-6 lg:p-8 max-w-full"> 
                <div className="w-full overflow-hidden"> 
                  {children}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;