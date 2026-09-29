'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime } from '@/lib/utils';

export default function KitchenDashboard() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.role !== 'kitchen' && user.role !== 'admin') {
            router.push('/');
            return;
        }
        if (user) {
            fetchActiveOrders();
            // Auto-refresh every 15 seconds
            const interval = setInterval(fetchActiveOrders, 15000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchActiveOrders = async () => {
        try {
            // Fetch all orders
            const res = await fetch(`/api/orders`);
            const data = await res.json();
            if (data.success) {
                // Filter only orders that the kitchen needs to see
                const kitchenOrders = data.data.filter((o: any) => 
                    o.order_status === 'pending' || 
                    o.order_status === 'confirmed' || 
                    o.order_status === 'preparing'
                );
                
                // Sort by older first
                kitchenOrders.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                setOrders(kitchenOrders);
            }
        } catch (error) {
            console.error('Error fetching kitchen orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (id: number, newStatus: string) => {
        try {
            const res = await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                fetchActiveOrders(); // Refresh
            } else {
                alert('Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('An error occurred');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <main className="container" style={{ padding: '2rem 1.5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1>Kitchen Display System (KDS)</h1>
                    <p className="text-muted">Live Orders & KOT</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={fetchActiveOrders} className="btn btn-ghost">
                        🔄 Refresh
                    </button>
                    <button onClick={logout} className="btn btn-ghost" style={{ color: 'var(--error)' }}>
                        Logout
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {orders.length === 0 ? (
                    <div className="glass-card" style={{ padding: '3rem', gridColumn: '1/-1', textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>👨‍🍳</div>
                        <h2 className="text-muted">No pending orders to cook.</h2>
                    </div>
                ) : (
                    orders.map(order => {
                        let parsedItems: any[] = [];
                        try {
                            parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                        } catch (e) { }

                        const isPreparing = order.order_status === 'preparing';
                        
                        return (
                            <div key={order.id} className="glass-card fade-in" style={{ 
                                padding: '1.5rem', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '1rem',
                                borderLeft: isPreparing ? '4px solid var(--warning)' : '4px solid var(--info)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.75rem' }}>
                                    <div>
                                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            #{order.order_number || order.id}
                                            {order.order_type === 'dine_in' && order.table_number && (
                                                <span className="badge" style={{ background: 'var(--primary)', color: 'white', fontSize: '1rem' }}>
                                                    Table {order.table_number}
                                                </span>
                                            )}
                                        </h2>
                                        <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                                            {formatDateTime(order.created_at)}
                                        </p>
                                    </div>
                                    <span className="badge" style={{ background: isPreparing ? 'var(--warning)' : 'var(--info)', color: 'white' }}>
                                        {order.order_status.toUpperCase()}
                                    </span>
                                </div>

                                <div style={{ flex: 1, minHeight: '150px' }}>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {parsedItems.map((item: any, idx: number) => (
                                            <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{item.menuItem.name}</span>
                                                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', background: 'var(--glass-bg)', padding: '2px 10px', borderRadius: '4px' }}>x{item.quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                {order.notes && (
                                    <div style={{ padding: '0.75rem', background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.2)', borderRadius: '8px', color: 'var(--error)' }}>
                                        <strong>Notes:</strong> {order.notes}
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px dashed var(--border-color)' }}>
                                    {isPreparing ? (
                                        <button 
                                            className="btn btn-success" 
                                            style={{ padding: '1rem', fontSize: '1.1rem', background: 'var(--success)' }}
                                            onClick={() => updateOrderStatus(order.id, 'ready')}
                                        >
                                            ✅ Mark as Ready
                                        </button>
                                    ) : (
                                        <button 
                                            className="btn btn-warning" 
                                            style={{ padding: '1rem', fontSize: '1.1rem', background: 'var(--warning)', color: '#000' }}
                                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                                        >
                                            🔥 Start Cooking
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
}
