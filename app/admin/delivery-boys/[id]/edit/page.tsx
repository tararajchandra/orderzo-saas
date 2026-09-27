'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditDeliveryBoyPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '', // Optional for update
        phone: '',
        commission_rate: '0',
        commission_type: 'fixed'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchDeliveryBoy();
    }, []);

    const fetchDeliveryBoy = async () => {
        try {
            const response = await fetch(`/api/admin/delivery-boys/${params.id}`);
            const data = await response.json();
            if (data.success) {
                setFormData({
                    name: data.data.name,
                    email: data.data.email,
                    password: '',
                    phone: data.data.phone || '',
                    commission_rate: data.data.commission_rate || '0',
                    commission_type: data.data.commission_type || 'fixed'
                });
            } else {
                setError('Failed to fetch delivery boy details');
            }
        } catch (error) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        const updateData: any = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            commission_rate: formData.commission_rate,
            commission_type: formData.commission_type
        };

        if (formData.password) {
            updateData.password = formData.password;
        }

        try {
            const response = await fetch(`/api/admin/delivery-boys/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (data.success) {
                router.push('/admin/delivery-boys');
            } else {
                setError(data.error || 'Failed to update delivery boy');
            }
        } catch (error) {
            setError('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-5">Loading...</div>;

    return (
        <main className="container" style={{ padding: '2rem 1.5rem', maxWidth: '600px' }}>
            <div className="glass-card fade-in">
                <div style={{ marginBottom: '2rem' }}>
                    <h1>Edit Delivery Boy</h1>
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
                        <label className="mb-1" style={{ display: 'block' }}>New Password (Optional)</label>
                        <input
                            type="password"
                            className="input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            minLength={6}
                            placeholder="Leave blank to keep current password"
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
                        disabled={saving}
                        className="btn btn-primary"
                        style={{ marginTop: '1rem' }}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </main>
    );
}
