'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export default function AdminTablesPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [settlingTable, setSettlingTable] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        fetchActiveTableOrders();
        
        // Poll every 15s to keep it fresh
        const interval = setInterval(() => {
            fetchActiveTableOrders(true);
        }, 15000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchActiveTableOrders = async (isPolling = false) => {
        try {
            const response = await fetch('/api/orders', { cache: 'no-store' });
            const data = await response.json();
            if (data.success) {
                // Filter only dine_in orders that have a table_number, and are NOT paid yet
                const activeDineInOrders = data.data.filter((o: any) => 
                    (o.order_type === 'dine_in' || o.order_type === 'dine-in') && 
                    o.table_number && 
                    o.payment_status !== 'paid' &&
                    o.order_status !== 'cancelled'
                );
                setOrders(activeDineInOrders);
            }
        } catch (error) {
            console.error('Error fetching table orders:', error);
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    // Group orders by table number
    const tableGroups = orders.reduce((acc: any, order: any) => {
        const table = order.table_number;
        if (!acc[table]) {
            acc[table] = { orders: [], total: 0, lastActivity: order.created_at };
        }
        acc[table].orders.push(order);
        acc[table].total += parseFloat(order.total_amount || 0);
        // keep track of latest order time
        if (new Date(order.created_at) > new Date(acc[table].lastActivity)) {
            acc[table].lastActivity = order.created_at;
        }
        return acc;
    }, {});

    const handleSettleTable = async (tableNo: string, paymentMethod: string) => {
        const confirmSettle = confirm(`Are you sure you want to settle all pending orders for Table ${tableNo}?`);
        if (!confirmSettle) return;
        
        setSettlingTable(tableNo);
        const tableOrders = tableGroups[tableNo].orders;
        
        try {
            // Update all orders for this table
            const updatePromises = tableOrders.map((order: any) => 
                fetch(`/api/orders/${order.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        payment_status: 'paid',
                        payment_method: paymentMethod,
                        order_status: 'delivered' // or completed
                    }),
                })
            );
            
            await Promise.all(updatePromises);
            alert(`Table ${tableNo} settled successfully!`);
            fetchActiveTableOrders();
        } catch (error) {
            console.error('Error settling table:', error);
            alert('An error occurred while settling the table.');
        } finally {
            setSettlingTable(null);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    const activeTablesCount = Object.keys(tableGroups).length;

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ marginBottom: '0.5rem' }}>Active Tables (Dine-in)</h1>
                        <p className="text-muted">{activeTablesCount} {activeTablesCount === 1 ? 'table' : 'tables'} currently occupied</p>
                    </div>
                    <Link href="/admin/dashboard" className="btn btn-ghost">
                        ← Back to Dashboard
                    </Link>
                </div>

                {activeTablesCount === 0 ? (
                    <div className="glass-card text-center" style={{ padding: '3rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
                        <h3>No Active Tables</h3>
                        <p className="text-muted">There are currently no unpaid dine-in orders with a table number.</p>
                    </div>
                ) : (
                    <div className="grid grid-3" style={{ gap: '1.5rem' }}>
                        {Object.entries(tableGroups).map(([tableNo, group]: [string, any]) => (
                            <div key={tableNo} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                                    <h2 style={{ margin: 0, color: 'var(--primary)' }}>Table {tableNo}</h2>
                                    <span className="badge" style={{ background: 'var(--warning)', color: 'white' }}>
                                        {group.orders.length} {group.orders.length === 1 ? 'Order' : 'Orders'}
                                    </span>
                                </div>
                                
                                <div style={{ marginBottom: '1.5rem', flex: 1 }}>
                                    {group.orders.map((o: any, idx: number) => (
                                        <div key={o.id} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <strong>#{o.order_number || o.id}</strong>
                                                <span>₹{parseFloat(o.total_amount).toFixed(2)}</span>
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                {new Date(o.created_at).toLocaleTimeString()} • {o.order_status}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div style={{ 
                                    borderTop: '2px dashed var(--border-color)', 
                                    paddingTop: '1rem',
                                    marginTop: 'auto'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>Total Bill</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                            ₹{group.total.toFixed(2)}
                                        </span>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <button 
                                            onClick={() => handleSettleTable(tableNo, 'cash')}
                                            disabled={settlingTable === tableNo}
                                            className="btn btn-primary"
                                            style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                                        >
                                            {settlingTable === tableNo ? '...' : '💵 Settle Cash'}
                                        </button>
                                        <button 
                                            onClick={() => handleSettleTable(tableNo, 'upi')}
                                            disabled={settlingTable === tableNo}
                                            className="btn btn-ghost"
                                            style={{ padding: '0.5rem', fontSize: '0.875rem', border: '1px solid var(--border-color)' }}
                                        >
                                            {settlingTable === tableNo ? '...' : '📱 Settle UPI'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
