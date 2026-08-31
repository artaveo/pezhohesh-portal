import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function LoginPage() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage('');
    setIsSubmitting(true);

    const result = await login(email, password);

    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.message || 'ایمیل یا رمز عبور اشتباه است.');
      return;
    }

    setEmail('');
    setPassword('');
  };

  return (
    <div style={{ direction: 'rtl', fontFamily: "'Vazirmatn', 'Segoe UI', Tahoma, sans-serif", padding: window.innerWidth < 768 ? '48px 16px' : '80px 20px', maxWidth: '420px', margin: '0 auto', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', padding: window.innerWidth < 768 ? '24px 20px' : '36px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #e9ecef', width: '100%' }}>

        <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🔒</span>
        <h3 style={{ color: '#112a1d', marginTop: 0, fontWeight: '800', fontSize: '20px', marginBottom: '8px' }}>ورود به پنل مدیریت پژوهش</h3>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '24px', fontWeight: '500', lineHeight: '1.5' }}>لطفاً ایمیل و رمز عبور اختصاصی خود را وارد کنید:</p>

        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
            disabled={isSubmitting}
            autoComplete="username"
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', textAlign: 'center', fontSize: '15px', outline: 'none', fontFamily: 'inherit', direction: 'ltr' }}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isSubmitting}
            autoComplete="current-password"
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box', textAlign: 'center', fontSize: '16px', outline: 'none', fontFamily: 'inherit' }}
          />

          {errorMessage && (
            <p style={{ margin: 0, fontSize: '12.5px', color: '#dc3545', fontWeight: '700' }}>{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ padding: '12px', backgroundColor: isSubmitting ? '#3a5c4a' : '#112a1d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', cursor: isSubmitting ? 'default' : 'pointer', fontWeight: '700', boxShadow: '0 4px 12px rgba(17,42,29,0.15)' }}
          >
            {isSubmitting ? 'در حال بررسی...' : 'ورود امن به سیستم'}
          </button>
        </form>

        <Link to="/" style={{ display: 'inline-block', marginTop: '20px', fontSize: '13px', color: '#666', textDecoration: 'none', fontWeight: '700', borderBottom: '1px dashed #ccc', paddingBottom: '2px' }}>
          ← بازگشت به صفحه اصلی پورتال
        </Link>
      </div>
    </div>
  );
}
