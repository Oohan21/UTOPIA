export const locales = ['en', 'am', 'om'] as const
export type Locale = (typeof locales)[number]

export const localePrefix = 'as-needed'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  am: 'አማርኛ',
  om: 'Afaan Oromoo'
}

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  am: '🇪🇹',
  om: '🇪🇹'
}

export const defaultLocale: Locale = 'en'