import { Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { currency, statusLabel } from '../utils/format';

const initialProduct = { name: '', category_id: '', description: '', price: '', inventory_count: 0, image_url: '', origin_region: '' };

export function SellerDashboard() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [form, setForm] = useState(initialProduct);

  async function load() {
    const [categoryRes, productRes, orderRes, earningRes] = await Promise.all([
      api.get('/categories'),
      api.get('/seller/products'),
      api.get('/seller/orders'),
      api.get('/seller/earnings')
    ]);
    setCategories(categoryRes.data.data);
    setProducts(productRes.data.data);
    setOrders(orderRes.data.data);
    setEarnings(earningRes.data.data);
  }

  useEffect(() => { load(); }, []);

  async function submit(event) {
    event.preventDefault();
    await api.post('/seller/products', form);
    setForm(initialProduct);
    load();
  }

  async function remove(id) {
    await api.delete(`/seller/products/${id}`);
    load();
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Gross earnings" value={currency(earnings?.gross_earnings)} />
        <Metric label="Orders" value={earnings?.order_count || 0} />
        <Metric label="Units sold" value={earnings?.units_sold || 0} />
      </section>

      <form onSubmit={submit} className="grid gap-4 rounded border border-slate-200 bg-white p-5 md:grid-cols-2">
        <h1 className="md:col-span-2 text-2xl font-bold">Create product</h1>
        <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <select className="focus-ring rounded border border-slate-300 px-3 py-2" value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })}>
          <option value="">Category</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="Price" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
        <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="Inventory" value={form.inventory_count} onChange={(event) => setForm({ ...form, inventory_count: event.target.value })} />
        <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="Image URL" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} />
        <input className="focus-ring rounded border border-slate-300 px-3 py-2" placeholder="Origin region" value={form.origin_region} onChange={(event) => setForm({ ...form, origin_region: event.target.value })} />
        <textarea className="focus-ring md:col-span-2 rounded border border-slate-300 p-3" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <button className="focus-ring inline-flex w-fit items-center gap-2 rounded bg-canopy px-4 py-2 font-semibold text-white"><Save className="h-4 w-4" /> Submit for approval</button>
      </form>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Inventory</h2>
        {products.map((product) => (
          <div key={product.id} className="flex flex-wrap justify-between gap-3 rounded border border-slate-200 bg-white p-4">
            <div><strong>{product.name}</strong><p className="text-sm capitalize text-slate-600">{statusLabel(product.status)} - {product.inventory_count} units</p></div>
            <button className="focus-ring rounded border border-slate-300 p-2 text-red-600" onClick={() => remove(product.id)}><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Orders</h2>
        {orders.map((order) => <div key={order.id} className="rounded border border-slate-200 bg-white p-4 text-sm">{order.product_name} x {order.quantity} - {currency(order.quantity * order.unit_price)}</div>)}
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-2xl font-bold text-canopy">{value}</p></div>;
}
