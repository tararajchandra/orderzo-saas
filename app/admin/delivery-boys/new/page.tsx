'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewDeliveryBoyPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        commission_rate: '0',
        commission_type: 'fixed'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/admin/delivery-boys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                router.push('/admin/delivery-boys');
            } else {
                setError(data.error || 'Failed to create delivery boy');
            }
        } catch (error) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container" style={{ padding: '2rem 1.5rem', maxWidth: '600px' }}>
            <div className="glass-card fade-in">
                <div style={{ marginBottom: '2rem' }}>
                    <h1>Add Delivery Boy</h1>
                    <Link href="/admin/delivery-boys" className="text-muted" style={{ textDecoration: 'none' }}>
                        ← Back to List
                    </Link>
                </div>

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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="mb-1" style={{ display: 'block' }}>Commission Type</label>
                            <select
                                className="input"
                                value={formData.commission_type}
                                onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
                            >
                                <option value="fixed">Fixed Amount (₹)</option>
                                <option value="percent">Percentage (%)</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1" style={{ display: 'block' }}>Commission Rate</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input"
                                value={formData.commission_rate}
                                onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        {loading ? 'Creating...' : 'Create Delivery Boy'}
                    </button>
                </form>
            </div>
        </main>
    );
}
