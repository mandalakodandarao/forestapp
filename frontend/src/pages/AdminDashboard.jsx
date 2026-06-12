import { CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { currency, statusLabel } from '../utils/format';

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [analytics, setAnalytics] = useState([]);

  async function load() {
    const [dashboardRes, userRes, productRes, analyticsRes] = await Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/users'),
      api.get('/admin/products'),
      api.get('/admin/analytics')
    ]);
    setDashboard(dashboardRes.data.data);
    setUsers(userRes.data.data);
    setProducts(productRes.data.data);
    setAnalytics(analyticsRes.data.data);
  }

  useEffect(() => { load(); }, []);

  async function setSellerStatus(id, status) {
    await api.patch(`/admin/sellers/${id}/status`, { status });
    load();
  }

  async function setProductStatus(id, status) {
    await api.patch(`/admin/products/${id}/status`, { status });
    load();
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-5">
        <Metric label="Users" value={dashboard?.users || 0} />
        <Metric label="Pending sellers" value={dashboard?.pending_sellers || 0} />
        <Metric label="Pending products" value={dashboard?.pending_products || 0} />
        <Metric label="Orders" value={dashboard?.orders || 0} />
        <Metric label="Revenue" value={currency(dashboard?.revenue)} />
      </section>

      <section className="overflow-hidden rounded border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h1 className="text-xl font-semibold">Manage users</h1>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Seller status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3 capitalize">{user.role}</td>
                  <td className="p-3 capitalize">{statusLabel(user.seller_status)}</td>
                  <td className="flex gap-2 p-3">
                    {user.role === 'seller' && user.seller_status === 'pending' && (
                      <>
                        <button className="focus-ring rounded bg-canopy p-2 text-white" onClick={() => setSellerStatus(user.id, 'approved')}><CheckCircle className="h-4 w-4" /></button>
                        <button className="focus-ring rounded bg-red-600 p-2 text-white" onClick={() => setSellerStatus(user.id, 'rejected')}><XCircle className="h-4 w-4" /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h1 className="text-xl font-semibold">Approve products</h1>
        </div>
        <div className="divide-y divide-slate-100">
          {products.map((product) => (
            <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <h2 className="font-semibold">{product.name}</h2>
                <p className="text-sm capitalize text-slate-600">{product.seller_name} - {product.category_name} - {statusLabel(product.status)}</p>
              </div>
              {product.status === 'pending' && (
                <div className="flex gap-2">
                  <button className="focus-ring rounded bg-canopy p-2 text-white" onClick={() => setProductStatus(product.id, 'approved')}><CheckCircle className="h-4 w-4" /></button>
                  <button className="focus-ring rounded bg-red-600 p-2 text-white" onClick={() => setProductStatus(product.id, 'rejected')}><XCircle className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {analytics.map((item) => (
          <div key={item.category} className="rounded border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">{item.category}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.product_count} products</p>
            <p className="mt-2 text-xl font-bold text-canopy">{currency(item.sales)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded border border-slate-200 bg-white p-4"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-canopy">{value}</p></div>;
}
