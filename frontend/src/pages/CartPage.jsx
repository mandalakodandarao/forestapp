import { Minus, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/Layout';
import { useCart } from '../context/CartContext';
import { currency } from '../utils/format';

export function CartPage() {
  const { items, total, updateQuantity } = useCart();

  if (!items.length) {
    return <EmptyState title="Your cart is empty" description="Browse products from community producers and add them here." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded border border-slate-200 bg-white p-4">
            <div>
              <h2 className="font-semibold">{item.name}</h2>
              <p className="text-sm text-slate-600">{currency(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="focus-ring rounded border border-slate-300 p-2" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center font-semibold">{item.quantity}</span>
              <button className="focus-ring rounded border border-slate-300 p-2" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></button>
              <button className="focus-ring rounded border border-slate-300 p-2 text-red-600" onClick={() => updateQuantity(item.id, 0)}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </section>
      <aside className="h-fit rounded border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Summary</h2>
        <div className="mt-4 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{currency(total)}</span>
        </div>
        <Link className="focus-ring mt-5 block rounded bg-canopy px-4 py-2 text-center font-semibold text-white" to="/checkout">Checkout</Link>
      </aside>
    </div>
  );
}

