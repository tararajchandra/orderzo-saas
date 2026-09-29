'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Kitchen StaffPage() {
    const [Kitchen Staff, setKitchen Staff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        fetchKitchen Staff();
    }, []);

    const fetchKitchen Staff = async () => {
        try {
            const response = await fetch('/api/admin/Kitchen Staff');
            const data = await response.json();
            if (data.success) {
                setKitchen Staff(data.data);
            }
        } catch (error) {
            console.error('Error fetching Kitchen Staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this Kitchen Staff?')) return;

        try {
            const response = await fetch(`/api/admin/Kitchen Staff/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                fetchKitchen Staff();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error deleting Kitchen Staff:', error);
            alert('Failed to delete Kitchen Staff');
        }
    };

    if (loading) return <div className="text-center p-5">Loading...</div>;

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>Kitchen Staff Management</h1>
                        <Link href="/admin/dashboard" className="text-muted" style={{ textDecoration: 'none' }}>
                            ← Back to Dashboard
                        </Link>
                    </div>
                    <Link href="/admin/Kitchen Staff/new" className="btn btn-primary">
                        + Add New Kitchen Staff
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
                            {Kitchen Staff.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center p-4 text-muted">
                                        No Kitchen Staff found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                Kitchen Staff.map((Kitchen Staff) => (
                                    <tr key={Kitchen Staff.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>{Kitchen Staff.name}</td>
                                        <td style={{ padding: '1rem' }}>{Kitchen Staff.email}</td>
                                        <td style={{ padding: '1rem' }}>{Kitchen Staff.phone || '-'}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <Link href={`/admin/Kitchen Staff/${Kitchen Staff.id}/edit`} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                                                    ✏️
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(Kitchen Staff.id)}
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
