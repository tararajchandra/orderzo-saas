'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { FinancialYear } from '@/contexts/FinancialYearContext';

export default function FinancialYearsPage() {
    const router = useRouter();
    const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
    });

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        fetchFYs();
    }, []);

    const fetchFYs = async () => {
        try {
            const response = await fetch('/api/financial-years');
            const result = await response.json();
            if (result.success) {
                setFinancialYears(result.data);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to load financial years');
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (id: number) => {
        if (!confirm('Are you sure you want to set this as the Active Financial Year? All new orders and invoices will be assigned to this year.')) {
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/financial-years', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: true }),
            });
            const result = await response.json();
            if (result.success) {
                // Refresh list and optionally refresh context or page
                await fetchFYs();
                alert('Active Financial Year updated successfully! Please refresh the page to apply it globally.');
                window.location.reload(); // Reload to update the top Navbar Context
            } else {
                setError(result.error || 'Failed to update active year');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/financial-years', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (result.success) {
                setShowAddForm(false);
                setFormData({ name: '', start_date: '', end_date: '' });
                await fetchFYs();
                alert('Financial Year added successfully!');
            } else {
                setError(result.error || 'Failed to add financial year');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading && financialYears.length === 0) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>Manage Financial Years</h1>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    {showAddForm ? 'Cancel' : '+ Add New FY'}
                </button>
            </div>

            {error && (
                <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {showAddForm && (
                <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Add Financial Year</h3>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'end' }}>
                        <div>
                            <label className="form-label">Name (e.g., 2027-28)</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                required
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="2027-28"
                            />
                        </div>
                        <div>
                            <label className="form-label">Start Date</label>
                            <input 
                                type="date" 
                                className="form-input" 
                                required
                                value={formData.start_date}
                                onChange={e => setFormData({...formData, start_date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="form-label">End Date</label>
                            <input 
                                type="date" 
                                className="form-input" 
                                required
                                value={formData.end_date}
                                onChange={e => setFormData({...formData, end_date: e.target.value})}
                            />
                        </div>
                        <div>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Save FY'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ padding: '1rem' }}>Name</th>
                            <th style={{ padding: '1rem' }}>Start Date</th>
                            <th style={{ padding: '1rem' }}>End Date</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {financialYears.map((fy) => (
                            <tr key={fy.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem', fontWeight: fy.is_active ? 'bold' : 'normal', color: 'var(--text-primary)' }}>
                                    {fy.name}
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                    {formatDate(fy.start_date)}
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                    {formatDate(fy.end_date)}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {fy.is_active ? (
                                        <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '0.875rem' }}>
                                            Active System FY
                                        </span>
                                    ) : (
                                        <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', borderRadius: '4px', fontSize: '0.875rem' }}>
                                            Inactive
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {!fy.is_active && (
                                        <button 
                                            className="btn btn-secondary" 
                                            onClick={() => handleActivate(fy.id)}
                                            disabled={loading}
                                            style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}
                                        >
                                            Set as Active
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
