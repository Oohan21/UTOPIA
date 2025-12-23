// For next-intl 4.6.1, we need to use different imports
import { createNavigation } from 'next-intl/navigation'

export const locales = ['en', 'am', 'om'] as const
export type Locale = (typeof locales)[number]

export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
  defaultLocale: 'en'
})