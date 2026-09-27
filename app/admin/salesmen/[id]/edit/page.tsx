'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditSalesmanPage() {
    const router = useRouter();
    const params = useParams();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '', // Optional on edit
        phone: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSalesman();
    }, []);

    const fetchSalesman = async () => {
        try {
            const response = await fetch(`/api/admin/salesmen`); // Fetch all and find (not optimal but api supports generic get list or generic put) 
            // Better to fetch specific, but my API was /api/admin/salesmen (List) and /api/admin/salesmen/[id] (PUT/DELETE)
            // Wait, I did NOT make a GET /api/admin/salesmen/[id]. I should fix that or just fetch all and filter.
            // Let's implement fetch all and filter for now as I missed GET on [id].

            const listResponse = await fetch('/api/admin/salesmen');
            const listData = await listResponse.json();

            if (listData.success) {
                const salesman = listData.data.find((s: any) => s.id.toString() === params.id);
                if (salesman) {
                    setFormData({
                        name: salesman.name,
                        email: salesman.email,
                        password: '',
                        phone: salesman.phone || '',
                    });
                } else {
                    setError('Salesman not found');
                }
            }
        } catch (err) {
            setError('Failed to fetch data');
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
            phone: formData.phone
        };
        if (formData.password) {
            updateData.password = formData.password;
        }

        try {
            const response = await fetch(`/api/admin/salesmen/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });
            const data = await response.json();

            if (data.success) {
                router.push('/admin/salesmen');
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to update salesman');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-5">Loading...</div>;
    if (error && !formData.name) return <div className="text-center p-5 text-error">{error}</div>;

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1>Edit Salesman</h1>
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
                            <label className="mb-1" style={{ display: 'block' }}>New Password (leave blank to keep current)</label>
                            <input
                                type="password"
                                className="input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                            {saving ? 'Saving...' : 'Update Salesman'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
