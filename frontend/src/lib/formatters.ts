/**
 * Format currency in Indian Rupees (INR)
 * @param amount Number in INR (rupees)
 */
export function formatINR(amount: number): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || Number.isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format paise (e.g. from Razorpay or registration fee) to INR rupees
 * @param paise Amount in paise
 */
export function formatPaise(paise: number): string {
  if (typeof paise !== 'number' || !Number.isFinite(paise) || Number.isNaN(paise)) {
    return '₹0';
  }
  return formatINR(paise / 100);
}

/**
 * Format ISO date string into readable format
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * Format ISO date string into date + time format
 */
export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * Truncate long IDs or tokens for compact monospace display
 */
export function truncateId(id: string, len = 8): string {
  if (!id) return '';
  if (id.length <= len) return id;
  return `${id.slice(0, len)}...`;
}

/**
 * Map status to badge color style
 */
export function getStatusStyle(status: string): {
  color: 'success' | 'warning' | 'error' | 'info' | 'default';
  label: string;
} {
  const s = status.toUpperCase();
  switch (s) {
    case 'ACTIVE':
    case 'CONFIRMED':
    case 'PAID':
    case 'APPROVED':
    case 'PUBLISHED':
    case 'SETTLED':
    case 'ATTENDED':
    case 'VERIFIED':
      return { color: 'success', label: status };

    case 'PENDING':
    case 'PENDING_PAYMENT':
    case 'DRAFT':
    case 'REGISTERED':
    case 'PLACED':
      return { color: 'warning', label: status.replace('_', ' ') };

    case 'CANCELLED':
    case 'REJECTED':
    case 'EXPIRED':
    case 'FAILED':
    case 'SUSPENDED':
    case 'NO_SHOW':
    case 'DISABLED':
      return { color: 'error', label: status.replace('_', ' ') };

    case 'ISSUED':
    case 'IN_STOCK':
    case 'CLOSED':
      return { color: 'info', label: status };

    default:
      return { color: 'default', label: status };
  }
}
