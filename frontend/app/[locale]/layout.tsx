import '@/app/globals.css'
import { ThemeProvider } from '@/components/common/ThemeProvider'
import { Toaster } from 'react-hot-toast'
import QueryProvider from '@/components/common/QueryProvider'
import { ComparisonProvider } from '@/lib/providers/ComparisonProvider'
import 'leaflet/dist/leaflet.css'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n/config'
import { Metadata } from 'next';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  
  const metadataTranslations: Record<string, Metadata> = {
    en: {
      title: 'UTOPIA - Ethiopian Real Estate Platform',
      description: 'Find, list, and value properties in Ethiopia',
    },
    am: {
      title: 'ዩቶፒያ - የኢትዮጵያ ሪል እስቴት መድረክ',
      description: 'በኢትዮጵያ ንብረቶችን ያግኙ፣ ይዘርዝሩ እና ዋጋውን ይወስኑ',
    },
    om: {
      title: 'Utopia - Paaltformii Qabeenyaalee Itoophiyaa',
      description: 'Qabeenyaalee Itoophiyaa keessatti argadhu, liistii godhi, gatii dhiheessi',
    }
  }

  return {
    ...metadataTranslations[locale] || metadataTranslations.en,
    openGraph: {
      type: 'website',
      locale,
      siteName: 'Utopia',
    },
  }
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Load messages for the locale
  let messages
  try {
    messages = await getMessages({ locale })
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error)
    notFound()
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <QueryProvider>
          <ComparisonProvider>
            {children}
            <Toaster position="top-right" />
          </ComparisonProvider>
        </QueryProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}