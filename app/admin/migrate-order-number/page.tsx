'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

export default function MigrateOrderNumberPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string>('');

    const runMigration = async () => {
        if (!confirm('Are you sure you want to run the order_number migration? This will add the order_number field to all orders.')) {
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await fetch('/api/admin/migrate-order-number', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                setResult(data);
                alert('Migration completed successfully! ✅');
            } else {
                setError(data.error || 'Migration failed');
                alert('Migration failed: ' + (data.details || data.error));
            }
        } catch (err: any) {
            setError(err.message);
            alert('Error running migration: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1>Database Migration: Order Numbering</h1>
                    <button onClick={() => router.push('/admin/dashboard')} className="btn btn-ghost">
                        ← Back to Dashboard
                    </button>
                </div>

                <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2>Add Order Number Field</h2>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                        This migration will add a daily sequential order number field to all orders.
                    </p>

                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>📋 What this does:</h3>
                        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
                            <li>Adds <code>order_number</code> column to orders table</li>
                            <li>Creates index for fast lookups</li>
                            <li>Updates existing orders with sequential numbers</li>
                            <li>Format: <code>YYYYMMDD-XXX</code> (e.g., 20251216-001)</li>
                        </ul>
                    </div>

                    <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>⚠️ Important:</h3>
                        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
                            <li>This is a <strong>one-time migration</strong></li>
                            <li>Safe to run multiple times (uses IF NOT EXISTS)</li>
                            <li>Existing orders will get sequential numbers based on date</li>
                            <li>New orders will auto-generate numbers</li>
                        </ul>
                    </div>

                    <button
                        onClick={runMigration}
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                    >
                        {loading ? '⏳ Running Migration...' : '🚀 Run Migration'}
                    </button>

                    {error && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--error)' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>❌ Error:</h3>
                            <p>{error}</p>
                        </div>
                    )}

                    {result && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>✅ Migration Successful!</h3>
                            <p style={{ marginBottom: '1rem' }}>
                                <strong>Orders Updated:</strong> {result.stats?.ordersUpdated || 0}
                            </p>

                            {result.stats?.sampleOrders && result.stats.sampleOrders.length > 0 && (
                                <>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Sample Orders:</h4>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', fontSize: '0.875rem' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>ID</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Order Number</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Customer</th>
                                                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.stats.sampleOrders.map((order: any) => (
                                                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <td style={{ padding: '0.5rem' }}>{order.id}</td>
                                                        <td style={{ padding: '0.5rem' }}>
                                                            <code style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                                                {order.order_number}
                                                            </code>
                                                        </td>
                                                        <td style={{ padding: '0.5rem' }}>{order.customer_name}</td>
                                                        <td style={{ padding: '0.5rem' }}>
                                                            {formatDate(order.created_at)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}

                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)' }}>
                                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    <strong>✅ Next Steps:</strong>
                                </p>
                                <ol style={{ marginLeft: '1.5rem', fontSize: '0.875rem', lineHeight: '1.6' }}>
                                    <li>Try creating a new order to test</li>
                                    <li>Order number will be auto-generated</li>
                                    <li>Format: YYYYMMDD-XXX (resets daily)</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '2rem', maxWidth: '800px', margin: '2rem auto 0' }}>
                    <div className="glass-card">
                        <h3>📚 Documentation</h3>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                            For more information about the order numbering system:
                        </p>
                        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.8' }}>
                            <li>
                                <a href="/DAILY_ORDER_NUMBERING.md" target="_blank" style={{ color: 'var(--primary)' }}>
                                    Complete Documentation
                                </a>
                            </li>
                            <li>
                                <a href="/ORDER_NUMBERING_IMPLEMENTATION_SUMMARY.md" target="_blank" style={{ color: 'var(--primary)' }}>
                                    Implementation Summary
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </main>
    );
}
