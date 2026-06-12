import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="rounded border border-slate-200 bg-white p-8 text-center">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link to="/" className="mt-4 inline-block rounded bg-canopy px-4 py-2 font-semibold text-white">Back to products</Link>
    </div>
  );
}

