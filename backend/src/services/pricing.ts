import { Event, MembershipStatus, Prisma, TicketTier } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface PriceQuote {
  tier: TicketTier;
  amountPaise: number;
  currency: 'INR';
}

type MembershipReader = Prisma.TransactionClient | typeof prisma;

/**
 * Event prices are whole INR rupees. Razorpay is charged in paise (rupees × 100).
 * An ACTIVE membership that has not expired receives memberPrice. Everyone else
 * pays standardPrice. A zero result is a free registration and does not create an order.
 */
export async function quoteEventPrice(
  reader: MembershipReader,
  userId: string,
  event: Pick<Event, 'memberPrice' | 'standardPrice'>,
  now = new Date(),
): Promise<PriceQuote> {
  const membership = await reader.membership.findFirst({
    where: {
      userId,
      status: MembershipStatus.ACTIVE,
      validUntil: { gt: now },
    },
  });

  const tier = membership ? TicketTier.MEMBER : TicketTier.STANDARD;
  const rupees = membership ? event.memberPrice : event.standardPrice;
  return {
    tier,
    amountPaise: rupees * 100,
    currency: 'INR',
  };
}
