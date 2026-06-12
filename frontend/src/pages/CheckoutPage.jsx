import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { currency } from '../utils/format';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const [address, setAddress] = useState({ line1: '', city: '', state: '', postal_code: '', country: 'India' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    try {
      await api.post('/checkout', {
        items: items.map((item) => ({ product_id: item.id, quantity: item.quantity })),
        shipping_address: address
      });
      clearCart();
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed');
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-4 rounded border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-bold">Checkout</h1>
        {['line1', 'city', 'state', 'postal_code', 'country'].map((field) => (
          <input
            key={field}
            className="focus-ring w-full rounded border border-slate-300 px-3 py-2"
            placeholder={field.replace('_', ' ')}
            value={address[field]}
            onChange={(event) => setAddress({ ...address, [field]: event.target.value })}
          />
        ))}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </section>
      <aside className="h-fit rounded border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Order total</h2>
        <p className="mt-3 text-2xl font-bold text-canopy">{currency(total)}</p>
        <button className="focus-ring mt-5 w-full rounded bg-canopy px-4 py-2 font-semibold text-white">Place order</button>
      </aside>
    </form>
  );
}

