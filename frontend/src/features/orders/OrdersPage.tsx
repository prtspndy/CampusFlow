import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ordersService } from '../../services/orders.service';
import { Order } from '../../types/commerce';
import { hasRole } from '../../config/permissions';
import { parseApiError } from '../../lib/api-errors';
import { formatDateTime, formatINR } from '../../lib/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  PackageCheck,
  CheckCircle,
  AlertCircle,
  Ban,
  Package,
} from 'lucide-react';

export function OrdersPage() {
  const { user } = useAuth();
  const canManageAll = hasRole(user, ['ADMIN', 'TREASURER']);

  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Order Details Modal
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);

  // Cancel Order Dialog
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'all' && canManageAll) {
        const res = await ordersService.listAllOrders();
        setOrders(res.orders || []);
        setTotal(res.total || 0);
      } else {
        const res = await ordersService.getMyOrders();
        setOrders(res.orders || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, canManageAll]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    setFeedback(null);

    try {
      await ordersService.cancelOrder(cancelTarget.id);
      setCancelTarget(null);
      setFeedback({
        type: 'success',
        message: `Order #${cancelTarget.orderNumber} cancelled successfully. Reserved stock has been released.`,
      });
      await loadOrders();
    } catch (err) {
      const parsed = parseApiError(err);
      setFeedback({ type: 'error', message: parsed.message });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-dark-border/60 light:border-light-border">
        <div>
          <h1 className="text-2xl font-headline font-bold text-dark-text light:text-light-text flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-brand" />
            Merchandise Pickup Orders
          </h1>
          <p className="text-xs text-dark-muted light:text-light-muted mt-0.5">
            Track gear reservations, pickup receipts, and inventory disbursements
          </p>
        </div>

        {canManageAll && (
          <div className="flex rounded-lg border border-dark-border p-0.5 bg-dark-canvas text-xs light:bg-light-elevated light:border-light-border">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeTab === 'my'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-dark-muted hover:text-dark-text light:hover:text-light-text'
              }`}
            >
              My Orders
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-dark-muted hover:text-dark-text light:hover:text-light-text'
              }`}
            >
              All Chapter Orders
            </button>
          </div>
        )}
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

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-sm">
              {activeTab === 'all' ? 'All Placed Orders' : 'My Placed Orders'} ({total})
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={loadOrders} disabled={isLoading}>
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Package}
                title="No Orders Found"
                description={
                  activeTab === 'all'
                    ? 'No merchandise orders have been placed in the system.'
                    : 'You haven’t placed any gear orders yet. Check out the club store!'
                }
                actionText={activeTab === 'my' ? 'Visit Store' : undefined}
                onAction={() => window.location.assign('/store')}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Order #</TableHead>
                {activeTab === 'all' && <TableHead>Customer</TableHead>}
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {orders.map((ord) => (
                  <TableRow key={ord.id}>
                    <TableCell isMono>#{ord.orderNumber}</TableCell>

                    {activeTab === 'all' && (
                      <TableCell>
                        <span className="font-semibold text-dark-text light:text-light-text">
                          {ord.user?.name || 'Student'}
                        </span>
                        <div className="text-[11px] text-dark-muted font-mono">{ord.user?.email}</div>
                      </TableCell>
                    )}

                    <TableCell>
                      <div className="space-y-0.5">
                        {ord.items?.map((it, idx) => (
                          <div key={idx} className="text-xs text-dark-text light:text-light-text">
                            {it.quantity}x {it.productName} ({it.size})
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell isMono>{formatINR(ord.totalAmount)}</TableCell>

                    <TableCell>
                      <Badge status={ord.status} />
                    </TableCell>

                    <TableCell>{formatDateTime(ord.createdAt)}</TableCell>

                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] px-2"
                          onClick={() => setInspectOrder(ord)}
                        >
                          Details
                        </Button>

                        {ord.status === 'PLACED' && (
                          <Button
                            size="sm"
                            variant="danger"
                            className="h-7 text-[11px] px-2"
                            onClick={() => setCancelTarget(ord)}
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel Order Dialog */}
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Merchandise Order"
        description={`Are you sure you want to cancel order #${cancelTarget?.orderNumber}? Any reserved merchandise stock will be returned to the store.`}
        confirmText="Confirm Cancellation"
        variant="danger"
        isLoading={isCancelling}
      />

      {/* Inspect Order Details Modal */}
      {inspectOrder && (
        <Modal
          isOpen={Boolean(inspectOrder)}
          onClose={() => setInspectOrder(null)}
          title={`Order #${inspectOrder.orderNumber}`}
          description={`Placed on ${formatDateTime(inspectOrder.createdAt)}`}
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border/60">
              <span className="text-dark-muted font-medium">Status</span>
              <Badge status={inspectOrder.status} />
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-dark-muted uppercase text-[10px]">Order Lines</span>
              <div className="divide-y divide-dark-border/40 border border-dark-border rounded-lg overflow-hidden">
                {inspectOrder.items?.map((it) => (
                  <div key={it.id} className="p-3 bg-dark-canvas flex justify-between items-center light:bg-light-elevated">
                    <div>
                      <div className="font-semibold text-dark-text light:text-light-text">{it.productName}</div>
                      <div className="text-[11px] text-dark-muted font-mono">
                        Size: {it.size} • Qty: {it.quantity} @ {formatINR(it.unitPrice)}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-dark-text light:text-light-text">
                      {formatINR(it.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-dark-canvas border border-dark-border flex justify-between font-bold text-sm light:bg-light-elevated">
              <span className="text-dark-text light:text-light-text">Total Pickup Amount</span>
              <span className="font-mono text-emerald-400">{formatINR(inspectOrder.totalAmount)}</span>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="secondary" onClick={() => setInspectOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
