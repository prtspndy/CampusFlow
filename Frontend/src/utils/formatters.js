// Utility functions for formatting currencies, dates, numbers and roles

export const formatCurrency = (amount, currency = '$') => {
  if (typeof amount !== 'number') {
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return `${currency}0.00`;
    amount = parsed;
  }
  return `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateString, format = 'medium') => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    if (format === 'short') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (format === 'medium') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
};

export const getRoleBadgeClass = (role) => {
  switch (role) {
    case 'Super Admin':
      return 'bg-danger text-white';
    case 'Admin':
      return 'bg-primary text-white';
    case 'Treasurer':
      return 'bg-success text-white';
    case 'Event Manager':
      return 'bg-info text-dark';
    case 'Volunteer':
      return 'bg-warning text-dark';
    case 'Member':
      return 'bg-secondary text-white';
    default:
      return 'bg-light text-dark';
  }
};

export const truncateText = (text, maxLength = 60) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
