'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { locales, localeNames, Locale } from '@/i18n/config'

interface LanguageContextType {
  currentLocale: Locale
  availableLocales: typeof locales
  localeNames: typeof localeNames
  changeLanguage: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  const changeLanguage = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <LanguageContext.Provider
      value={{
        currentLocale: locale,
        availableLocales: locales,
        localeNames,
        changeLanguage
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}