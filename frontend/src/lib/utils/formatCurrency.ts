export const formatCurrency = (
  amount: number,
  currency: 'ETB' | 'USD' = 'ETB'
): string => {
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

export const formatPricePerSqm = (price: number): string => {
  return `${formatCurrency(price)}/m²`
}

export const formatPriceRange = (min: number, max: number): string => {
  return `${formatCurrency(min)} - ${formatCurrency(max)}`
}