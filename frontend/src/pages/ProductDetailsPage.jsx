import { ShoppingBag, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { currency } from '../utils/format';

export function ProductDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/products/${id}`).then(({ data }) => setProduct(data.data));
    api.get(`/products/${id}/reviews`).then(({ data }) => setReviews(data.data));
  }, [id]);

  async function submitReview(event) {
    event.preventDefault();
    await api.post(`/products/${id}/reviews`, review);
    const { data } = await api.get(`/products/${id}/reviews`);
    setReviews(data.data);
    setMessage('Review saved');
  }

  if (!product) return <p className="text-sm text-slate-600">Loading product...</p>;

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="overflow-hidden rounded border border-slate-200 bg-white">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-canopy/10 text-canopy">ForestRoots</div>
        )}
      </div>
      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase text-clay">{product.category_name}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">{product.name}</h1>
          <p className="mt-2 text-sm text-slate-600">Sold by {product.seller_name} {product.origin_region ? `from ${product.origin_region}` : ''}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-canopy">{currency(product.price)}</span>
          <span className="inline-flex items-center gap-1 text-sm text-slate-600"><Star className="h-4 w-4 fill-clay text-clay" /> {product.average_rating}</span>
          <span className="text-sm text-slate-500">{product.inventory_count} in stock</span>
        </div>
        <p className="text-slate-700">{product.description}</p>
        <button onClick={() => addItem(product, 1)} className="focus-ring inline-flex items-center gap-2 rounded bg-canopy px-4 py-2 font-semibold text-white">
          <ShoppingBag className="h-4 w-4" /> Add to cart
        </button>

        <section className="space-y-3 border-t border-slate-200 pt-5">
          <h2 className="text-xl font-semibold">Reviews</h2>
          {reviews.map((item) => (
            <div key={item.id} className="rounded border border-slate-200 bg-white p-4">
              <div className="font-medium">{item.customer_name} rated {item.rating}/5</div>
              <p className="mt-1 text-sm text-slate-600">{item.comment}</p>
            </div>
          ))}
          {user?.role === 'customer' && (
            <form onSubmit={submitReview} className="space-y-3 rounded border border-slate-200 bg-white p-4">
              <select className="focus-ring rounded border border-slate-300 px-3 py-2" value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })}>
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
              </select>
              <textarea className="focus-ring block w-full rounded border border-slate-300 p-3" placeholder="Share your experience" value={review.comment} onChange={(event) => setReview({ ...review, comment: event.target.value })} />
              <button className="focus-ring rounded bg-river px-4 py-2 font-semibold text-white">Submit review</button>
              {message && <p className="text-sm text-canopy">{message}</p>}
            </form>
          )}
        </section>
      </section>
    </div>
  );
}

