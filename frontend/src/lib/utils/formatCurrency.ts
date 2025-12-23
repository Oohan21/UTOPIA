// src/lib/utils/formatCurrency.ts

/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency code (ETB or USD)
 * @param compact Whether to use compact notation (e.g., 1.2M instead of 1,200,000)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: 'ETB' | 'USD' = 'ETB',
  compact: boolean = false
): string => {
  if (compact && amount >= 1000000) {
    const millions = amount / 1000000;
    const formatted = millions >= 10 
      ? millions.toFixed(0)
      : millions.toFixed(1);
    return currency === 'ETB' 
      ? `ETB ${formatted}M`
      : `$${formatted}M`;
  }
  
  if (compact && amount >= 1000) {
    const thousands = amount / 1000;
    const formatted = thousands >= 10 
      ? thousands.toFixed(0)
      : thousands.toFixed(1);
    return currency === 'ETB' 
      ? `ETB ${formatted}K`
      : `$${formatted}K`;
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ETB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    currencyDisplay: 'symbol',
  })

  if (currency === 'ETB') {
    return formatter.format(amount).replace('ETB', 'ETB ')
  }
  
  return formatter.format(amount)
}

/**
 * Format price per square meter
 * @param price The price per square meter
 * @param currency The currency code
 * @returns Formatted price per square meter string
 */
export const formatPricePerSqm = (price: number, currency: 'ETB' | 'USD' = 'ETB'): string => {
  return `${formatCurrency(price, currency)}/m²`
}

/**
 * Format a price range
 * @param min Minimum price
 * @param max Maximum price
 * @param currency The currency code
 * @returns Formatted price range string
 */
export const formatPriceRange = (
  min: number, 
  max: number, 
  currency: 'ETB' | 'USD' = 'ETB'
): string => {
  return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`
}

/**
 * Format a number with Ethiopian formatting (comma as thousand separator)
 * @param num The number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Format a percentage value
 * @param value The percentage value
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format a date to relative time (e.g., "2 days ago")
 * @param date The date to format
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

/**
 * Format a date in Ethiopian format
 * @param date The date to format
 * @param includeTime Whether to include time
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string, 
  includeTime: boolean = false
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat('en-ET', options).format(d);
}

/**
 * Format file size in human-readable format
 * @param bytes File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format phone number in Ethiopian format
 * @param phone Phone number string
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Ethiopian phone number format: +251 XX XXX XXXX
  if (cleaned.length === 12 && cleaned.startsWith('251')) {
    return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
  }
  
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    return `+251 ${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5)}`;
  }
  
  return phone;
}

/**
 * Format duration in minutes to human-readable format
 * @param minutes Duration in minutes
 * @returns Formatted duration string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (remainingHours > 0) {
    return `${days}d ${remainingHours}h`;
  }
  
  return `${days}d`;
}

/**
 * Format coordinates for display
 * @param lat Latitude
 * @param lng Longitude
 * @param precision Decimal precision
 * @returns Formatted coordinates string
 */
export const formatCoordinates = (
  lat: number, 
  lng: number, 
  precision: number = 6
): string => {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * Format social media numbers (followers, likes, etc.)
 * @param count The count to format
 * @returns Formatted social media count
 */
export const formatSocialCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Format price difference with arrow indicator
 * @param currentPrice Current price
 * @param previousPrice Previous price
 * @param currency Currency code
 * @returns Formatted price difference with arrow
 */
export const formatPriceChange = (
  currentPrice: number,
  previousPrice: number,
  currency: 'ETB' | 'USD' = 'ETB'
): { text: string; isPositive: boolean; change: number } => {
  const change = currentPrice - previousPrice;
  const percentage = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
  
  const formattedChange = formatCurrency(Math.abs(change), currency);
  const formattedPercentage = formatPercentage(Math.abs(percentage), 1);
  
  if (change > 0) {
    return {
      text: `↑ ${formattedChange} (${formattedPercentage})`,
      isPositive: true,
      change: percentage,
    };
  } else if (change < 0) {
    return {
      text: `↓ ${formattedChange} (${formattedPercentage})`,
      isPositive: false,
      change: percentage,
    };
  }
  
  return {
    text: 'No change',
    isPositive: false,
    change: 0,
  };
}

/**
 * Format commission amount
 * @param amount Property price
 * @param rate Commission rate (percentage)
 * @param currency Currency code
 * @returns Formatted commission
 */
export const formatCommission = (
  amount: number,
  rate: number,
  currency: 'ETB' | 'USD' = 'ETB'
): string => {
  const commission = (amount * rate) / 100;
  return `${formatCurrency(commission, currency)} (${rate}%)`;
}

/**
 * Format rental yield
 * @param annualRent Annual rental income
 * @param propertyPrice Property price
 * @returns Formatted rental yield
 */
export const formatRentalYield = (
  annualRent: number,
  propertyPrice: number
): string => {
  const yieldPercentage = (annualRent / propertyPrice) * 100;
  return formatPercentage(yieldPercentage, 2);
}

/**
 * Format mortgage payment
 * @param principal Loan amount
 * @param annualRate Annual interest rate (percentage)
 * @param years Loan term in years
 * @param currency Currency code
 * @returns Formatted monthly payment
 */
export const formatMortgagePayment = (
  principal: number,
  annualRate: number,
  years: number,
  currency: 'ETB' | 'USD' = 'ETB'
): string => {
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = years * 12;
  
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
  
  return `${formatCurrency(monthlyPayment, currency)}/month`;
}

/**
 * Format property area
 * @param area Area in square meters
 * @returns Formatted area string
 */
export const formatArea = (area: number): string => {
  if (area >= 10000) {
    const hectares = area / 10000;
    return `${hectares.toFixed(2)} ha`;
  }
  return `${formatNumber(area, 0)} m²`;
}

/**
 * Format price comparison
 * @param price1 First price
 * @param price2 Second price
 * @param currency Currency code
 * @returns Formatted comparison string
 */
export const formatPriceComparison = (
  price1: number,
  price2: number,
  currency: 'ETB' | 'USD' = 'ETB'
): { difference: string; percentage: string; isCheaper: boolean } => {
  const difference = Math.abs(price1 - price2);
  const percentage = (difference / Math.min(price1, price2)) * 100;
  
  return {
    difference: formatCurrency(difference, currency),
    percentage: formatPercentage(percentage, 1),
    isCheaper: price1 < price2,
  };
}

/**
 * Format exchange rate
 * @param amount Amount to convert
 * @param rate Exchange rate (ETB per USD)
 * @param from Source currency
 * @param to Target currency
 * @returns Formatted exchange rate string
 */
export const formatExchangeRate = (
  amount: number,
  rate: number,
  from: 'ETB' | 'USD',
  to: 'ETB' | 'USD'
): string => {
  let converted: number;
  let sourceSymbol = from === 'ETB' ? 'ETB' : '$';
  let targetSymbol = to === 'ETB' ? 'ETB' : '$';
  
  if (from === 'ETB' && to === 'USD') {
    converted = amount / rate;
  } else {
    converted = amount * rate;
  }
  
  return `${formatCurrency(amount, from)} ≈ ${formatCurrency(converted, to)}`;
}

// Re-export commonly used formatters
export {
  formatCurrency as currency,
  formatNumber as number,
  formatPercentage as percentage,
  formatDate as date,
};