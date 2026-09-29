'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function TableReportPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0];
    });

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        fetchReport();
    }, [startDate, endDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            // Fetch all orders between dates
            const response = await fetch(`/api/orders?start=${startDate}&end=${endDate}&type=dine_in`, { cache: 'no-store' });
            const data = await response.json();
            if (data.success) {
                // Filter only paid dine_in orders that have a table number
                const tableOrders = data.data.filter((o: any) => 
                    (o.order_type === 'dine_in' || o.order_type === 'dine-in') && 
                    o.table_number && 
                    o.payment_status === 'paid' && 
                    o.order_status !== 'cancelled'
                );
                setOrders(tableOrders);
            }
        } catch (error) {
            console.error('Error fetching table report:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals per table
    const tableStats = orders.reduce((acc: any, order: any) => {
        const table = order.table_number.toString();
        if (!acc[table]) {
            acc[table] = { totalAmount: 0, orderCount: 0 };
        }
        acc[table].totalAmount += parseFloat(order.total_amount || 0);
        acc[table].orderCount += 1;
        return acc;
    }, {});

    const sortedTables = Object.keys(tableStats).sort((a, b) => parseInt(a) - parseInt(b));
    const grandTotal = Object.values(tableStats).reduce((sum: number, t: any) => sum + t.totalAmount, 0);

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ marginBottom: '0.5rem' }}>Table-wise Sales Report</h1>
                        <p className="text-muted">View revenue generated per table</p>
                    </div>
                    <Link href="/admin/dashboard" className="btn btn-ghost">
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Start Date</label>
                        <input 
                            type="date" 
                            className="input" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                        />
                    </div>
                    <div>
                        <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>End Date</label>
                        <input 
                            type="date" 
                            className="input" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                        />
                    </div>
                    <button className="btn btn-primary" onClick={fetchReport} disabled={loading}>
                        {loading ? 'Loading...' : 'Generate Report'}
                    </button>
                </div>

                <div className="glass-card">
                    {sortedTables.length === 0 ? (
                        <p className="text-muted text-center" style={{ padding: '2rem 0' }}>No table sales found for this period.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Table Number</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Total Orders</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Total Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTables.map(table => (
                                        <tr key={table} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>Table {table}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>{tableStats[table].orderCount}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--success)', fontWeight: 'bold' }}>
                                                ₹{tableStats[table].totalAmount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                        <td colSpan={2} style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem' }}>Grand Total:</td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>
                                            ₹{grandTotal.toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
