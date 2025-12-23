'use client'

import React, { useState, useEffect, startTransition } from 'react'
import { useAuthStore } from '@/lib/store/authStore'
import { useNotificationStore } from '@/lib/store/notificationStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useTheme } from 'next-themes'
import { NotificationBell } from '@/components/common/NotificationBell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"
import {
  Menu, X, Home, Search as SearchIcon, User, LogOut, Settings, Package, Bell, Moon,
  Sun, Globe
} from "lucide-react"
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'

export default function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, isAuthenticated, logout } = useAuthStore()
  const { unreadCount, fetchUnreadCount } = useNotificationStore()
  const [mounted, setMounted] = useState(false)

  // next-intl hooks
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  // Language configuration
  const locales = ['en', 'am', 'om'] as const
  const localeNames = {
    en: 'English',
    am: 'አማርኛ',
    om: 'Afaan Oromoo'
  }

  const navLinks = [
    { href: '/listings', label: t('properties') },
    { href: '/comparison', label: t('compare') },
    { href: '/messages', label: t('messages') },
  ]

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount()
    }
  }, [isAuthenticated, fetchUnreadCount])

  // Wait for mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    startTransition(() => {
      router.push(`/${locale}/auth/login`)
    })
  }

  const handleSearch = () => {
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery) {
      startTransition(() => {
        router.push(`/${locale}/listings?search=${encodeURIComponent(trimmedQuery)}`)
      })
      setIsMenuOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const changeLanguage = (newLocale: string) => {
    // Get the current path without the locale prefix
    const pathWithoutLocale = pathname.replace(/^\/(en|am|om)/, '') || '/'
    // Navigate to the same path with new locale
    startTransition(() => {
      router.push(`/${newLocale}${pathWithoutLocale}`)
    })
    setIsMenuOpen(false)
  }

  const getInitials = () => {
    if (!user) return "U"
    return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U"
  }

  // Determine if we should show admin link
  const isAdmin = user?.user_type === "admin" || user?.is_staff || user?.is_superuser

  if (!mounted) {
    // Return a simplified header during SSR to avoid hydration mismatches
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}`} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="hidden text-xl font-bold sm:inline-block">UTOPIA</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Mobile Menu Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            suppressHydrationWarning
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <Link href={`/${locale}`} className="flex items-center gap-2" suppressHydrationWarning>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden text-xl font-bold sm:inline-block">UTOPIA</span>
          </Link>
        </div>
        
        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(true)}
            suppressHydrationWarning
          >
            <SearchIcon className="h-5 w-5" />
          </Button>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={`/${locale}${link.href}`}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === `/${locale}${link.href}` || pathname.startsWith(`/${locale}${link.href}/`)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
                suppressHydrationWarning
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2" suppressHydrationWarning>
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{localeNames[locale as keyof typeof localeNames]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {locales.map((lang) => (
                <DropdownMenuItem
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={locale === lang ? 'bg-accent' : ''}
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
            className="hidden sm:flex"
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
          {isAuthenticated ? (
            <NotificationBell />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/${locale}/auth/login`)}
              title={t('signIn')}
              className="hidden sm:flex"
              suppressHydrationWarning
            >
              <Bell className="h-5 w-5" />
            </Button>
          )}

          {/* Auth */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" suppressHydrationWarning>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profile_picture || undefined} alt={user?.email} />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {user?.user_type}
                    </Badge>
                    {user?.is_premium && (
                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/account`} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    {t('myAccount')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${locale}/account/listings`} className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    {t('myListings')}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href={`/${locale}/admin`} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      {t('adminPanel')}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('logOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center space-x-2">
              <Button variant="ghost" asChild size="sm" suppressHydrationWarning>
                <Link href={`/${locale}/auth/login`}>
                  {t('signIn')}
                </Link>
              </Button>
              <Button asChild size="sm" suppressHydrationWarning>
                <Link href={`/${locale}/auth/register`}>{t('signUp')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu with Search */}
      {isMenuOpen && (
        <div className="container border-t py-4 lg:hidden">
          {/* Mobile Search */}
          <div className="mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('searchProperties')}
                className="pl-9 pr-16"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                suppressHydrationWarning
              />
              {searchQuery && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded hover:bg-muted"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <button
                    onClick={handleSearch}
                    className="rounded-md px-2 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Go
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Nav Links */}
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={`/${locale}${link.href}`}
                className={cn(
                  "py-2 text-sm font-medium",
                  pathname === `/${locale}${link.href}` || pathname.startsWith(`/${locale}${link.href}/`)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
                onClick={() => setIsMenuOpen(false)}
                suppressHydrationWarning
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && (
              <>
                <div className="border-t pt-3 mt-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Account</p>
                  <Link
                    href={`/${locale}/account`}
                    className="block py-2 text-sm font-medium text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                    suppressHydrationWarning
                  >
                    {t('myAccount')}
                  </Link>
                  <Link
                    href={`/${locale}/account/listings`}
                    className="block py-2 text-sm font-medium text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                    suppressHydrationWarning
                  >
                    {t('myListings')}
                  </Link>
                  {isAdmin && (
                    <Link
                      href={`/${locale}/admin`}
                      className="block py-2 text-sm font-medium text-foreground"
                      onClick={() => setIsMenuOpen(false)}
                      suppressHydrationWarning
                    >
                      {t('adminPanel')}
                    </Link>
                  )}
                </div>
                <div className="border-t pt-3">
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className="w-full text-left py-2 text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    {t('logOut')}
                  </button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="border-t pt-3 mt-3">
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" asChild onClick={() => setIsMenuOpen(false)} suppressHydrationWarning>
                    <Link href={`/${locale}/auth/login`}>
                      {t('signIn')}
                    </Link>
                  </Button>
                  <Button className="flex-1" asChild onClick={() => setIsMenuOpen(false)} suppressHydrationWarning>
                    <Link href={`/${locale}/auth/register`}>{t('signUp')}</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Language Switcher - Mobile */}
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                {t('language')}
              </p>
              {locales.map((lang) => (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={`w-full text-left py-2 text-sm font-medium ${
                    locale === lang ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {localeNames[lang]}
                </button>
              ))}
            </div>

            {/* Mobile Theme Toggle */}
            <div className="border-t pt-3">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 w-full py-2 text-sm font-medium text-foreground"
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
  )
}