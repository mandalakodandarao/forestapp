export const currency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));

export const statusLabel = (value) => String(value || '').replace(/_/g, ' ');

