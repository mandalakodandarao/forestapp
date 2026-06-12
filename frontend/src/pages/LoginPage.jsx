import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return <AuthForm title="Login" form={form} setForm={setForm} submit={submit} error={error} mode="login" />;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  }

  return <AuthForm title="Create account" form={form} setForm={setForm} submit={submit} error={error} mode="register" />;
}

function AuthForm({ title, form, setForm, submit, error, mode }) {
  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">{title}</h1>
      {mode === 'register' && (
        <input className="focus-ring w-full rounded border border-slate-300 px-3 py-2" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
      )}
      <input className="focus-ring w-full rounded border border-slate-300 px-3 py-2" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
      <input className="focus-ring w-full rounded border border-slate-300 px-3 py-2" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
      {mode === 'register' && (
        <select className="focus-ring w-full rounded border border-slate-300 px-3 py-2" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
          <option value="customer">Customer</option>
          <option value="seller">Seller</option>
        </select>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="focus-ring w-full rounded bg-canopy px-4 py-2 font-semibold text-white">{title}</button>
      <p className="text-sm text-slate-600">
        {mode === 'login' ? 'Need an account? ' : 'Already registered? '}
        <Link className="font-semibold text-canopy" to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Register' : 'Login'}</Link>
      </p>
    </form>
  );
}

