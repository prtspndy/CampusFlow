/**
 * Safe, typed environment configuration for CampusFlow frontend.
 * Only public variables prefixed with VITE_ are exposed to the client.
 */
export const ENV = {
  API_URL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api',
  RAZORPAY_KEY_ID: (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || 'rzp_test_TjUmoVOo81PmG8',
  IS_DEV: import.meta.env.DEV,
} as const;
