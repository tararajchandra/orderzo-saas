'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function KitchenStaffPage() {
    const [KitchenStaff, setKitchenStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        fetchKitchenStaff();
    }, []);

    const fetchKitchenStaff = async () => {
        try {
            const response = await fetch('/api/admin/KitchenStaff');
            const data = await response.json();
            if (data.success) {
                setKitchenStaff(data.data);
            }
        } catch (error) {
            console.error('Error fetching KitchenStaff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this KitchenStaff?')) return;

        try {
            const response = await fetch(`/api/admin/KitchenStaff/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (data.success) {
                fetchKitchenStaff();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error deleting KitchenStaff:', error);
            alert('Failed to delete KitchenStaff');
        }
    };

    if (loading) return <div className="text-center p-5">Loading...</div>;

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>KitchenStaff Management</h1>
                        <Link href="/admin/dashboard" className="text-muted" style={{ textDecoration: 'none' }}>
                            ← Back to Dashboard
                        </Link>
                    </div>
                    <Link href="/admin/KitchenStaff/new" className="btn btn-primary">
                        + Add New KitchenStaff
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
                            {KitchenStaff.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center p-4 text-muted">
                                        No KitchenStaff found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                KitchenStaff.map((KitchenStaff) => (
                                    <tr key={KitchenStaff.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem' }}>{KitchenStaff.name}</td>
                                        <td style={{ padding: '1rem' }}>{KitchenStaff.email}</td>
                                        <td style={{ padding: '1rem' }}>{KitchenStaff.phone || '-'}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <Link href={`/admin/KitchenStaff/${KitchenStaff.id}/edit`} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                                                    ✏️
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(KitchenStaff.id)}
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
