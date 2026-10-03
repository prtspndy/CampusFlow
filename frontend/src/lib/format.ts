/**
 * Currency & Money formatting utilities adhering strictly to DESIGN.md rules:
 * - Tabular figures (tnum)
 * - Intl.NumberFormat with customizable currency & locale (default INR/USD)
 * - Explicit + / − signs for deltas & money flow
 * - Two decimals for ledgers
 */

export interface FormatMoneyOptions {
  currency?: string
  locale?: string
  showDecimals?: boolean
  showSign?: boolean // Forces explicit + or −
  isDelta?: boolean
}

export function formatMoney(
  amount: number,
  options: FormatMoneyOptions = {}
): string {
  const {
    currency = 'INR',
    locale = 'en-IN',
    showDecimals = true,
    showSign = false,
    isDelta = false,
  } = options

  const absAmount = Math.abs(amount)
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })

  const formatted = formatter.format(absAmount)

  if (isDelta || showSign) {
    if (amount > 0) return `+${formatted}`
    if (amount < 0) return `−${formatted}` // Unicode minus
    return formatted
  }

  if (amount < 0) {
    return `−${formatted}`
  }

  return formatted
}

export function formatNumber(value: number, locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatSeatCount(remaining: number): string {
  if (remaining <= 0) return 'Sold out'
  if (remaining === 1) return 'Only 1 seat left'
  if (remaining <= 10) return `Only ${remaining} left`
  return `${remaining} seats left`
}

export function formatStockCount(stock: number): string {
  if (stock <= 0) return 'Out of stock'
  if (stock === 1) return '1 left'
  if (stock <= 5) return `${stock} left`
  return `${stock} in stock`
}
