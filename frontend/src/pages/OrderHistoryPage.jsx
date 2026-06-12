import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { EmptyState } from '../components/Layout';
import { currency, statusLabel } from '../utils/format';

export function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders').then(({ data }) => setOrders(data.data));
  }, []);

  if (!orders.length) return <EmptyState title="No orders yet" description="Completed checkouts will appear here." />;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Order history</h1>
      {orders.map((order) => (
        <article key={order.id} className="rounded border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Order {order.id.slice(0, 8)}</h2>
              <p className="text-sm capitalize text-slate-600">{statusLabel(order.status)}</p>
            </div>
            <span className="font-bold text-canopy">{currency(order.total_amount)}</span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {order.items.map((item) => <li key={item.id}>{item.product_name} x {item.quantity}</li>)}
          </ul>
        </article>
      ))}
    </section>
  );
}

