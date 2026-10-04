import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventsService } from '../../services/events.service';
import { registrationsService } from '../../services/registrations.service';
import { paymentsService } from '../../services/payments.service';
import { EventItem, RegisterEventResult } from '../../types/events';
import { canManageEvents } from '../../config/permissions';
import { ENV } from '../../config/env';
import { parseApiError } from '../../lib/api-errors';
import { formatDateTime, formatINR, formatPaise } from '../../lib/formatters';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Ticket,
  CreditCard,
  Ban,
  Sparkles,
  Plus,
  Minus,
  QrCode,
} from 'lucide-react';
import { loadRazorpayCheckoutScript } from '../../lib/razorpay';
import { Ticket as TicketType } from '../../types/ticketing';
import { membershipsService } from '../../services/memberships.service';

declare global {
  interface Window {
    Razorpay?: unknown;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (res: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Registration flow state
  const [quantity, setQuantity] = useState(1);
  const [isMember, setIsMember] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<RegisterEventResult | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [issuedTickets, setIssuedTickets] = useState<TicketType[]>([]);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Staff management state
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const isStaff = canManageEvents(user);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    try {
      const data = await eventsService.getEventById(eventId);
      setEvent(data);
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsMember(false);
      return;
    }
    membershipsService.getMyMemberships().then((memberships) => {
      const active = (memberships || []).some(
        (m) => m.status === 'ACTIVE' && new Date(m.validUntil).getTime() > Date.now(),
      );
      setIsMember(active);
    }).catch(() => {
      setIsMember(false);
    });
  }, [isAuthenticated]);

  // Handle Event Registration
  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${eventId}` } } });
      return;
    }

    if (!eventId) return;
    setIsRegistering(true);
    setFeedback(null);

    try {
      const safeQuantity = Number.isInteger(quantity) && quantity >= 1 ? quantity : 1;
      const result = await registrationsService.registerForEvent(eventId, { quantity: safeQuantity });
      setRegisterResult(result);

      if (result.requiresPayment) {
        const order = result.paymentOrder;
        if (
          !order ||
          !order.razorpayOrderId ||
          typeof order.amountPaise !== 'number' ||
          !Number.isFinite(order.amountPaise) ||
          order.amountPaise <= 0
        ) {
          throw new Error('Unable to initialize payment order. Please try again or contact event organizers.');
        }
        setIsCheckoutOpen(true);
        // Pre-load Razorpay checkout script in background
        loadRazorpayCheckoutScript();
      } else {
        const tickets = result.tickets || (result.ticket ? [result.ticket] : []);
        setIssuedTickets(tickets);
        setIsSuccessModalOpen(true);
        setFeedback({
          type: 'success',
          message: `Registration confirmed! ${tickets.length} pass${tickets.length > 1 ? 'es' : ''} issued.`,
        });
        await loadEvent();
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsRegistering(false);
    }
  };

  // Launch standard Razorpay SDK modal
  const handleLaunchRazorpay = async () => {
    if (!registerResult?.paymentOrder) return;
    const order = registerResult.paymentOrder;

    if (!order.razorpayOrderId || typeof order.amountPaise !== 'number' || order.amountPaise <= 0) {
      setFeedback({
        type: 'error',
        message: 'Invalid payment order details. Please retry ticket booking.',
      });
      return;
    }

    const loaded = await loadRazorpayCheckoutScript();
    if (!loaded || typeof window.Razorpay !== 'function') {
      setFeedback({
        type: 'error',
        message: 'Could not load Razorpay checkout script. Please check your internet connection or ad blocker and try again.',
      });
      return;
    }

    const options: RazorpayOptions = {
      key: order.keyId || ENV.RAZORPAY_KEY_ID,
      amount: order.amountPaise,
      currency: order.currency || 'INR',
      name: 'CampusFlow',
      description: `${registerResult.registration.quantity} Pass${registerResult.registration.quantity > 1 ? 'es' : ''} for ${event?.title || 'Event'}`,
      order_id: order.razorpayOrderId,
      handler: async (response) => {
        await submitVerification({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      prefill: {
        name: user?.name,
        email: user?.email,
      },
      theme: {
        color: '#0047FF',
      },
      modal: {
        ondismiss: () => {
          setFeedback({
            type: 'error',
            message: 'Payment window was closed before completion. You can retry paying when ready.',
          });
        },
      },
    };

    const rzpInstance = new (window.Razorpay as new (opts: RazorpayOptions) => {
      open: () => void;
      on?: (event: string, handler: (data: unknown) => void) => void;
    })(options);

    if (typeof rzpInstance.on === 'function') {
      rzpInstance.on('payment.failed', (resp: unknown) => {
        const failure = resp as { error?: { description?: string } } | undefined;
        setFeedback({
          type: 'error',
          message: failure?.error?.description || 'Payment failed. Please try again with a valid payment method.',
        });
      });
    }

    rzpInstance.open();
  };

  const submitVerification = async (params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    if (!params.razorpayOrderId || !params.razorpayPaymentId || !params.razorpaySignature) {
      setFeedback({
        type: 'error',
        message: 'Incomplete payment credentials received. Verification aborted.',
      });
      return;
    }

    setIsVerifyingPayment(true);
    setFeedback(null);
    try {
      const verifyResult = await paymentsService.verifyPayment({
        razorpay_order_id: params.razorpayOrderId,
        razorpay_payment_id: params.razorpayPaymentId,
        razorpay_signature: params.razorpaySignature,
      });
      setIsCheckoutOpen(false);
      setRegisterResult(null);
      const tickets = verifyResult.tickets || (verifyResult.ticket ? [verifyResult.ticket] : []);
      setIssuedTickets(tickets);
      setIsSuccessModalOpen(true);
      setFeedback({
        type: 'success',
        message: `Payment verified successfully! ${tickets.length} pass${tickets.length > 1 ? 'es' : ''} issued.`,
      });
      await loadEvent();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // Staff action: Publish
  const handlePublish = async () => {
    if (!eventId) return;
    setIsPublishing(true);
    setFeedback(null);
    try {
      await eventsService.publishEvent(eventId);
      setFeedback({ type: 'success', message: 'Event successfully published to the campus directory.' });
      await loadEvent();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsPublishing(false);
    }
  };

  // Staff action: Cancel
  const handleCancelEvent = async () => {
    if (!eventId) return;
    setIsCancelling(true);
    setFeedback(null);
    try {
      await eventsService.cancelEvent(eventId);
      setIsCancelConfirmOpen(false);
      setFeedback({ type: 'success', message: 'Event has been cancelled.' });
      await loadEvent();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-dark-text">Event Not Found</h2>
        <p className="text-xs text-dark-muted">The requested campus event does not exist or has been removed.</p>
        <Link to="/events">
          <Button variant="secondary" size="sm">Back to Events</Button>
        </Link>
      </div>
    );
  }

  const memberPrice =
    typeof event.memberPrice === 'number' && Number.isFinite(event.memberPrice) && event.memberPrice >= 0
      ? event.memberPrice
      : 0;

  const standardPrice =
    typeof event.standardPrice === 'number' && Number.isFinite(event.standardPrice) && event.standardPrice >= 0
      ? event.standardPrice
      : 0;

  const unitPrice = isMember ? memberPrice : standardPrice;
  const safeQuantity = Number.isInteger(quantity) && quantity >= 1 ? quantity : 1;
  const totalRupees = unitPrice * safeQuantity;
  const isTotalValid = Number.isFinite(totalRupees) && totalRupees >= 0;

  const remainingCapacity =
    event.totalCapacity != null
      ? Math.max(0, event.totalCapacity - event.registeredCount)
      : null;
  const isFull = remainingCapacity != null ? remainingCapacity <= 0 : false;
  const maxAllowed =
    remainingCapacity != null
      ? Math.min(10, Math.max(1, remainingCapacity))
      : 10;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs text-dark-muted hover:text-dark-text transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Events Catalogue</span>
        </Link>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded text-xs font-medium flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-status-success-bg border border-status-success-border text-status-success-text'
              : 'bg-status-error-bg border border-status-error-border text-status-error-text'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Event Header Card */}
      <Card className="overflow-hidden border-dark-border/90">
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {event.category && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-brand/10 border border-brand/25 text-brand font-semibold uppercase">
                  {event.category}
                </span>
              )}
              {event.isFeatured && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 font-semibold uppercase flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Featured
                </span>
              )}
            </div>
            <Badge status={event.status} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-headline font-bold text-dark-text light:text-light-text">
            {event.title}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-dark-border/60 text-xs text-dark-muted light:border-light-border">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-brand shrink-0" />
              <div>
                <span className="font-semibold text-dark-text light:text-light-text block">Date & Time</span>
                <span>{formatDateTime(event.startsAt)} – {formatDateTime(event.endsAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-semibold text-dark-text light:text-light-text block">Location</span>
                <span>{event.venue}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-dark-muted mb-2">
              About This Event
            </h3>
            <p className="text-sm text-dark-text light:text-light-text leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>
        </div>

        {/* Action & Registration Footer */}
        <div className="p-6 bg-dark-canvas/50 border-t border-dark-border/80 flex flex-col gap-6 light:bg-light-elevated/40 light:border-light-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-[10px] uppercase font-semibold text-dark-muted block">
                  Member Price
                </span>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {memberPrice === 0 ? 'Free Entry' : formatINR(memberPrice)}
                </div>
                {isMember && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
                    <CheckCircle className="w-3 h-3" /> Member Rate Applied
                  </span>
                )}
              </div>

              {standardPrice > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-semibold text-dark-muted block">
                    Standard Price
                  </span>
                  <div className="text-lg font-bold font-mono text-dark-text light:text-light-text">
                    {formatINR(standardPrice)}
                  </div>
                  {!isMember && (
                    <span className="text-[10px] text-dark-muted block mt-0.5">
                      Standard Rate
                    </span>
                  )}
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-semibold text-dark-muted block">
                  Capacity
                </span>
                <div className="text-sm font-semibold text-dark-text light:text-light-text">
                  {event.registeredCount} {event.totalCapacity ? `/ ${event.totalCapacity}` : 'Registered'}
                </div>
                {event.totalCapacity != null && (
                  <span
                    className={`text-[10px] font-medium block mt-0.5 ${
                      Math.max(0, event.totalCapacity - event.registeredCount) <= 5
                        ? 'text-amber-400'
                        : 'text-dark-muted'
                    }`}
                  >
                    {event.registeredCount >= event.totalCapacity
                      ? 'Sold Out'
                      : `${event.totalCapacity - event.registeredCount} seat${
                          event.totalCapacity - event.registeredCount === 1 ? '' : 's'
                        } remaining`}
                  </span>
                )}
              </div>
            </div>

            {/* Staff Controls */}
            {isStaff && (
              <div className="flex items-center gap-2 self-start md:self-auto">
                <Link to={`/events/${event.id}/registrations`}>
                  <Button size="md" variant="secondary">
                    <Users className="w-4 h-4 mr-1.5" />
                    Attendee Roster
                  </Button>
                </Link>

                {event.status === 'DRAFT' && (
                  <Button
                    size="md"
                    variant="primary"
                    onClick={handlePublish}
                    isLoading={isPublishing}
                  >
                    Publish Event
                  </Button>
                )}

                {event.status !== 'CANCELLED' && (
                  <Button
                    size="md"
                    variant="danger"
                    onClick={() => setIsCancelConfirmOpen(true)}
                  >
                    <Ban className="w-4 h-4 mr-1.5" />
                    Cancel Event
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Ticket Quantity & Live Order Summary (For Published Events) */}
          {event.status === 'PUBLISHED' && (
            <div className="p-4 rounded-xl bg-dark-card border border-dark-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4 light:bg-white light:border-light-border">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-dark-text light:text-light-text">
                    Ticket Quantity:
                  </span>
                  <div className="flex items-center gap-2 bg-dark-canvas border border-dark-border rounded-lg p-1 light:bg-light-canvas">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={safeQuantity <= 1 || isFull}
                      className="w-7 h-7 flex items-center justify-center rounded bg-dark-card text-dark-text hover:bg-dark-border/40 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold light:bg-white light:text-light-text"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={maxAllowed}
                      value={safeQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (Number.isNaN(val) || val < 1) setQuantity(1);
                        else setQuantity(Math.min(maxAllowed, val));
                      }}
                      disabled={isFull}
                      className="w-12 text-center bg-transparent text-sm font-bold font-mono text-dark-text light:text-light-text focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setQuantity((q) => Math.min(maxAllowed, q + 1));
                      }}
                      disabled={safeQuantity >= maxAllowed || isFull}
                      className="w-7 h-7 flex items-center justify-center rounded bg-dark-card text-dark-text hover:bg-dark-border/40 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold light:bg-white light:text-light-text"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-[11px] text-dark-muted">
                    (Max {maxAllowed} per booking)
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-dark-muted font-mono">
                  <span>
                    Rate:{' '}
                    {unitPrice === 0 ? 'Free' : formatINR(unitPrice)} × {safeQuantity}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-dark-text light:text-light-text">
                    Total:{' '}
                    {!isTotalValid
                      ? '—'
                      : totalRupees === 0
                      ? 'Free Entry'
                      : formatINR(totalRupees)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="lg"
                  variant="primary"
                  onClick={handleRegister}
                  isLoading={isRegistering}
                  disabled={
                    isFull ||
                    !isTotalValid ||
                    (remainingCapacity != null && safeQuantity > remainingCapacity)
                  }
                  className="w-full md:w-auto font-semibold shadow-md"
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  {isFull
                    ? 'Event Sold Out'
                    : totalRupees === 0
                    ? `Register for Free (${safeQuantity} pass${safeQuantity > 1 ? 'es' : ''})`
                    : `Book ${safeQuantity} Ticket${safeQuantity > 1 ? 's' : ''} • ${formatINR(totalRupees)}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Cancel Event Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleCancelEvent}
        title="Cancel Campus Event"
        description={`Are you sure you want to cancel "${event.title}"? Confirmed registrations and tickets will be invalidated.`}
        confirmText="Confirm Cancellation"
        variant="danger"
        isLoading={isCancelling}
      />

      {/* Paid Registration Checkout Modal */}
      {isCheckoutOpen && registerResult?.paymentOrder && (
        <Modal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          title="Complete Ticket Purchase"
          description="A paid reservation has been created. Complete your Razorpay payment to confirm your booking and receive passes."
        >
          {(() => {
            const order = registerResult.paymentOrder;
            const orderAmountPaise =
              typeof order.amountPaise === 'number' && Number.isFinite(order.amountPaise) && order.amountPaise > 0
                ? order.amountPaise
                : 0;
            const hasValidOrder = Boolean(order.razorpayOrderId && orderAmountPaise > 0);

            return (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-dark-canvas border border-dark-border/80 text-xs space-y-2 light:bg-light-elevated light:border-light-border">
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Event</span>
                    <span className="font-semibold text-dark-text light:text-light-text">{event.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Rate Tier</span>
                    <span className="font-semibold text-dark-text light:text-light-text">{registerResult.registration.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-muted">Ticket Quantity</span>
                    <span className="font-semibold text-dark-text light:text-light-text">
                      {registerResult.registration.quantity} Ticket{registerResult.registration.quantity > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-dark-border/40 pt-2 font-mono text-sm">
                    <span className="text-dark-muted font-sans font-semibold">Amount Payable</span>
                    <span className="font-bold text-emerald-400">
                      {orderAmountPaise > 0 ? formatPaise(orderAmountPaise) : '—'}
                    </span>
                  </div>
                  <div className="text-[10px] text-dark-muted font-mono pt-1">
                    Order ID: {order.razorpayOrderId || 'Unavailable'}
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full h-11 font-semibold text-sm shadow-md"
                  onClick={handleLaunchRazorpay}
                  isLoading={isVerifyingPayment}
                  disabled={!hasValidOrder || isVerifyingPayment}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {hasValidOrder
                    ? `Pay ${formatPaise(orderAmountPaise)} with Razorpay`
                    : 'Order Unavailable'}
                </Button>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Registration Success / Issued Passes Modal */}
      {isSuccessModalOpen && (
        <Modal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          title="Booking Confirmed!"
          description={`Your registration for "${event.title}" is confirmed. ${issuedTickets.length} digital pass${issuedTickets.length > 1 ? 'es have' : ' has'} been issued.`}
          maxWidth="lg"
        >
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {issuedTickets.map((t, idx) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-dark-canvas border border-dark-border/80 flex flex-col items-center text-center space-y-2.5 light:bg-light-elevated light:border-light-border"
                >
                  <div className="w-full flex items-center justify-between text-[10px] font-mono text-cyan-400">
                    <span>Ticket #{idx + 1}</span>
                    <Badge status={t.status} />
                  </div>

                  {t.qrDataUrl ? (
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-inner">
                      <img
                        src={t.qrDataUrl}
                        alt={`QR code for ticket ${t.id}`}
                        className="w-32 h-32 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 flex flex-col items-center justify-center p-2 bg-dark-card border border-dark-border rounded-lg text-dark-muted font-mono text-[10px] break-all">
                      <QrCode className="w-8 h-8 text-brand mb-1" />
                      <span>{t.qrToken?.slice(0, 16)}...</span>
                    </div>
                  )}

                  <div className="w-full text-center">
                    <span className="text-[10px] font-mono text-dark-muted block">
                      Pass ID: #{t.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-dark-border/60 light:border-light-border">
              <Link to="/tickets" className="w-full sm:w-auto flex-1">
                <Button variant="primary" className="w-full h-10 font-semibold text-xs">
                  <Ticket className="w-4 h-4 mr-1.5" />
                  View in My Tickets
                </Button>
              </Link>
              <Button
                variant="secondary"
                className="w-full sm:w-auto h-10 text-xs px-4"
                onClick={() => setIsSuccessModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
