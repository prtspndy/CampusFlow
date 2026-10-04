let razorpayScriptPromise: Promise<boolean> | null = null;

/**
 * Loads the official Razorpay Checkout modal script dynamically.
 * Caches the load promise to prevent multiple duplicate script tags.
 */
export function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window !== 'undefined' && typeof (window as unknown as { Razorpay?: unknown }).Razorpay === 'function') {
    return Promise.resolve(true);
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    if (typeof document === 'undefined') {
      resolve(false);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[Razorpay] Failed to load checkout script');
      razorpayScriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}
