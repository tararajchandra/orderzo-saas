'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DeliveryBoy {
    id: number;
    name: string;
    email: string;
    phone: string;
    created_at: string;
}

export default function DeliveryBoysPage() {
    const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeliveryBoys();
    }, []);

    const fetchDeliveryBoys = async () => {
        try {
            const response = await fetch('/api/admin/delivery-boys');
            const data = await response.json();
            if (data.success) {
                setDeliveryBoys(data.data);
            }
        } catch (error) {
            console.error('Error fetching delivery boys:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this delivery boy?')) return;

        try {
            const response = await fetch(`/api/admin/delivery-boys/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                setDeliveryBoys(deliveryBoys.filter(d => d.id !== id));
            } else {
                alert('Failed to delete: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting delivery boy:', error);
        }
    };

    if (loading) return <div className="text-center p-5">Loading...</div>;

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>Delivery Boy Management</h1>
                        <Link href="/admin/dashboard" className="text-muted" style={{ textDecoration: 'none' }}>
                            ← Back to Dashboard
                        </Link>
                    </div>
                    <Link href="/admin/delivery-boys/new" className="btn btn-primary">
                        + Add New Delivery Boy
                    </Link>
                </div>

                <div className="glass-card">
                    {deliveryBoys.length === 0 ? (
                        <p className="text-center text-muted p-4">No delivery boys found.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>Name</th>
                                        <th style={{ padding: '1rem' }}>Email</th>
                                        <th style={{ padding: '1rem' }}>Phone</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deliveryBoys.map((db) => (
                                        <tr key={db.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '1rem' }}>{db.name}</td>
                                            <td style={{ padding: '1rem' }}>{db.email}</td>
                                            <td style={{ padding: '1rem' }}>{db.phone || '-'}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <Link href={`/admin/delivery-boys/${db.id}/edit`} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                                                        ✏️
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(db.id)}
                                                        className="btn btn-ghost"
                                                        style={{ padding: '0.5rem', color: 'var(--error)' }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
