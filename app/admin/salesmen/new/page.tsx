'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewSalesmanPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const response = await fetch('/api/admin/salesmen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();

            if (data.success) {
                router.push('/admin/salesmen');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to create salesman');
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1>Add New Salesman</h1>
                    <Link href="/admin/salesmen" className="text-muted" style={{ textDecoration: 'none' }}>
                        ← Back to List
                    </Link>
                </div>

                <div className="glass-card">
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                        {error && (
                            <div className="badge badge-error" style={{ justifyContent: 'center' }}>
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="mb-1" style={{ display: 'block' }}>Name *</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1" style={{ display: 'block' }}>Email *</label>
                            <input
                                type="email"
                                className="input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1" style={{ display: 'block' }}>Password *</label>
                            <input
                                type="password"
                                className="input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="mb-1" style={{ display: 'block' }}>Phone</label>
                            <input
                                type="tel"
                                className="input"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? 'Creating...' : 'Create Salesman'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
