export const KHR_DEFAULT_RATE = 4100;

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatKHR(amountUSD: number, exchangeRate: number = KHR_DEFAULT_RATE): string {
  const khr = Math.round(amountUSD * exchangeRate);
  return new Intl.NumberFormat('km-KH', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(khr) + ' ៛';
}

export function formatDualCurrency(amountUSD: number, exchangeRate: number = KHR_DEFAULT_RATE): string {
  return `${formatUSD(amountUSD)} (${formatKHR(amountUSD, exchangeRate)})`;
}
