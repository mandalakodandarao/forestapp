import { LogOut, Package, ShoppingCart, Sprout, UserCog } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const navClass = ({ isActive }) =>
  `rounded px-3 py-2 text-sm font-medium ${isActive ? 'bg-canopy text-white' : 'text-slate-700 hover:bg-slate-100'}`;

export function Layout() {
  const { user, logout } = useAuth();
  const { items } = useCart();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-canopy">
            <Sprout className="h-6 w-6" />
            ForestRoots
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink className={navClass} to="/">Products</NavLink>
            {user?.role === 'customer' && <NavLink className={navClass} to="/orders">Orders</NavLink>}
            {user?.role === 'seller' && <NavLink className={navClass} to="/seller">Seller</NavLink>}
            {user?.role === 'admin' && <NavLink className={navClass} to="/admin">Admin</NavLink>}
            <NavLink className={navClass} to="/cart">
              <span className="inline-flex items-center gap-1"><ShoppingCart className="h-4 w-4" /> {items.length}</span>
            </NavLink>
            {user ? (
              <button onClick={logout} className="focus-ring inline-flex items-center gap-2 rounded bg-bark px-3 py-2 text-sm font-medium text-white">
                <LogOut className="h-4 w-4" /> {user.name}
              </button>
            ) : (
              <NavLink className={navClass} to="/login"><UserCog className="inline h-4 w-4" /> Login</NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
        Direct marketplace for tribal communities, artisans, farmers, and forest-product producers.
      </footer>
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center">
      <Package className="mx-auto h-10 w-10 text-slate-400" />
      <h2 className="mt-3 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}

