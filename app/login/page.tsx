'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                login(data.data.token, data.data.user);
                if (data.data.user.role === 'admin') {
                    router.push('/admin/dashboard');
                } else if (data.data.user.role === 'salesman') {
                    router.push('/salesman');
                } else if (data.data.user.role === 'delivery_boy') {
                    router.push('/delivery');
                } else {
                    router.push('/menu');
                }
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
        }}>
            <div className="glass-card fade-in" style={{ maxWidth: '450px', width: '100%' }}>
                <div className="text-center mb-4">
                    <h1 style={{ marginBottom: '0.5rem' }}>Welcome Back</h1>
                    <p className="text-muted">Login to access your account</p>
                </div>

                {error && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        background: 'rgba(255, 80, 80, 0.1)',
                        border: '1px solid rgba(255, 80, 80, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--error)',
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            className="input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '1.125rem', padding: '1rem' }}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                    <span className="text-muted" style={{ fontSize: '0.875rem' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                </div>

                <button
                    type="button"
                    onClick={async () => {
                        setGoogleLoading(true);
                        setError('');
                        try {
                            const res = await fetch('/api/auth/google/url');
                            const data = await res.json();

                            if (!res.ok || data.error) {
                                setError(data.error || 'Google sign-in is not configured. Please contact support.');
                                setGoogleLoading(false);
                                return;
                            }

                            if (data.url) {
                                window.location.href = data.url;
                            } else {
                                setError('Failed to initiate Google sign-in');
                                setGoogleLoading(false);
                            }
                        } catch (err) {
                            console.error('Failed to get Google auth URL', err);
                            setError('Failed to connect to Google. Please try again.');
                            setGoogleLoading(false);
                        }
                    }}
                    disabled={googleLoading || loading}
                    className="btn btn-outline"
                    style={{
                        width: '100%',
                        padding: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        background: 'white',
                        color: '#333',
                        borderColor: '#ddd'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {googleLoading ? 'Connecting to Google...' : 'Sign in with Google'}
                </button>

                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <p className="text-muted">
                        Don't have an account?{' '}
                        <Link href="/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}
