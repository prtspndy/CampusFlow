/**
 * Payment API service — wraps api.ts for Razorpay order generation and verification.
 * Mirrors backend payment.service.ts response shapes.
 */
import { api } from '../../../lib/api'

export type PaymentStatus = 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface PublicPayment {
  id: string
  registrationId: string
  eventId: string
  userId: string
  status: PaymentStatus
  amountPaise: number
  currency: string
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  signatureVerifiedAt: string | null
  keyId?: string | null
}

export interface PaymentOrderResponse {
  payment: PublicPayment
  alreadyExisted: boolean
}

export interface VerifyPaymentInput {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface VerifyPaymentResponse {
  payment: PublicPayment
  registration: {
    id: string
    eventId: string
    userId: string
    status: string
    amountPaise: number
  }
  ticket: {
    id: string
    registrationId: string
    eventId: string
    userId: string
    status: string
    issuedAt: string
    checkedInAt: string | null
    checkedInById: string | null
    qrToken?: string
    qrDataUrl?: string
  }
}

export const paymentApiService = {
  /** Create or retrieve a Razorpay payment order for a pending registration. */
  createPaymentOrder: (registrationId: string) =>
    api.post<PaymentOrderResponse>(`/registrations/${registrationId}/payment-order`),

  /** Verify signature for a completed Razorpay payment. */
  verifyPayment: (data: VerifyPaymentInput) =>
    api.post<VerifyPaymentResponse>('/payments/verify', data),

  /** Get a payment record by ID. */
  getPayment: (paymentId: string) =>
    api.get<PublicPayment>(`/payments/${paymentId}`),

  /** List payments (requires payments.read). */
  listPayments: (params: { eventId?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams()
    if (params.eventId) qs.set('eventId', params.eventId)
    if (params.page) qs.set('page', String(params.page))
    if (params.limit) qs.set('limit', String(params.limit))
    const q = qs.toString()
    return api.get<{
      payments: PublicPayment[]
      pagination: { total: number; page: number; limit: number; totalPages: number }
    }>(`/payments${q ? `?${q}` : ''}`)
  },
}

/**
 * Dynamically loads the official Razorpay checkout script if not already present.
 */
export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).Razorpay) return Promise.resolve(true)

  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}
