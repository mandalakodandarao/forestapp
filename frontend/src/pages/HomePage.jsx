import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { EmptyState } from '../components/Layout';
import { ProductCard } from '../components/ProductCard';

export function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/products', { params: filters })
      .then(({ data }) => setProducts(data.data))
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 rounded bg-canopy px-6 py-8 text-white md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">ForestRoots</h1>
          <p className="mt-3 max-w-2xl text-white/85">
            Buy forest honey, herbal wellness goods, handicrafts, millets, and farm products directly from community producers.
          </p>
        </div>
        <div className="rounded bg-white/10 p-4 text-sm">
          Transparent marketplace access for customers, approved seller workflows for producers, and governance tools for admins.
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded border border-slate-200 bg-white p-4 md:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            className="focus-ring w-full rounded border border-slate-300 py-2 pl-9 pr-3"
            placeholder="Search products"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
        </label>
        <select
          className="focus-ring rounded border border-slate-300 px-3 py-2"
          value={filters.category}
          onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>{category.name}</option>
          ))}
        </select>
      </section>

      {loading ? (
        <p className="text-sm text-slate-600">Loading products...</p>
      ) : products.length ? (
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </section>
      ) : (
        <EmptyState title="No products found" description="Try another search or category filter." />
      )}
    </div>
  );
}

