import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { currency } from '../utils/format';

export function ProductCard({ product }) {
  return (
    <article className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[4/3] bg-slate-100">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-canopy/10 text-sm font-medium text-canopy">ForestRoots</div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-clay">{product.category_name}</p>
          <Link to={`/products/${product.id}`} className="mt-1 block text-lg font-semibold text-slate-950 hover:text-canopy">
            {product.name}
          </Link>
        </div>
        <p className="line-clamp-2 text-sm text-slate-600">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-canopy">{currency(product.price)}</span>
          <span className="inline-flex items-center gap-1 text-sm text-slate-600">
            <Star className="h-4 w-4 fill-clay text-clay" /> {product.average_rating || 0}
          </span>
        </div>
      </div>
    </article>
  );
}

