import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { EmptyState } from '../../../components/feedback/EmptyState'
import { formatMoney } from '../../../lib/format'
import { api, isApiError } from '../../../lib/api'
import type { Order } from '../../../types/models'

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ orders: Order[] }>('/orders/me')
      .then((data) => setOrders(data.orders))
      .catch((err: unknown) => setError(isApiError(err) ? err.message : 'Orders could not be loaded.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-body-md text-[var(--color-muted)]">Loading your orders…</p>
  if (error) {
    return <EmptyState icon={<ShoppingBag className="w-6 h-6" />} title="Orders unavailable" description={error} />
  }
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="w-6 h-6" />}
        title="No orders yet"
        description="Merchandise you reserve will show up here."
      />
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-heading-1 font-display font-extrabold">My orders</h1>
      {orders.map((order) => (
        <article key={order.id} className="rounded-[14px] border border-[var(--color-hairline)] bg-[var(--color-canvas)] p-4 space-y-2">
          <div className="flex justify-between gap-3">
            <h2 className="font-bold">{order.orderNumber}</h2>
            <span className="text-caption">{order.status}</span>
          </div>
          <ul className="text-body-sm text-[var(--color-body)]">
            {order.items.map((item) => (
              <li key={`${item.productId}-${item.size}`}>
                {item.productName} · {item.size} × {item.quantity} · {formatMoney(item.unitPrice)}
              </li>
            ))}
          </ul>
          <p className="font-semibold">{formatMoney(order.totalAmount)}</p>
        </article>
      ))}
    </div>
  )
}
