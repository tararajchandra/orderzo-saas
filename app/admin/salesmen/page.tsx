'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SalesmenPage() {
    const [salesmen, setSalesmen] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        fetchSalesmen();
    }, []);

    const fetchSalesmen = async () => {
        try {
            const response = await fetch('/api/admin/salesmen');
            const data = await response.json();
            if (data.success) {
                setSalesmen(data.data);
            }
        } catch (error) {
            console.error('Error fetching salesmen:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this salesman?')) return;

        try {
            const response = await fetch(`/api/admin/salesmen/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                fetchSalesmen();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error deleting salesman:', error);
            alert('Failed to delete salesman');
        }
    };

    if (loading) return <div className="text-center p-5">Loading...</div>;

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>Salesmen Management</h1>
                        <Link href="/admin/dashboard" className="text-muted" style={{ textDecoration: 'none' }}>
                            ← Back to Dashboard
                        </Link>
                    </div>
                    <Link href="/admin/salesmen/new" className="btn btn-primary">
                        + Add New Salesman
                    </Link>
                </div>

                <div className="glass-card">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Phone</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {salesmen.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center p-4 text-muted">
                                        No salesmen found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                salesmen.map((salesman) => (
                                    <tr key={salesman.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>{salesman.name}</td>
                                        <td style={{ padding: '1rem' }}>{salesman.email}</td>
                                        <td style={{ padding: '1rem' }}>{salesman.phone || '-'}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <Link href={`/admin/salesmen/${salesman.id}/edit`} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                                                    ✏️
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(salesman.id)}
                                                    className="btn btn-ghost"
                                                    style={{ padding: '0.5rem', color: 'var(--error)' }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
