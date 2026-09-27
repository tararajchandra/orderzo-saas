'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Order {
    id: number;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    total_amount: number;
    order_status: string;
    payment_status: string;
    delivery_boy_id: number | null;
    user_id: number | null;
    order_type: string;
    items: any[];
    created_at: string;
    driver_commission?: number;
}

export default function DeliveryDashboard() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'available' | 'my_orders'>('available');

    useEffect(() => {
        if (user && user.role !== 'delivery_boy' && user.role !== 'admin') {
            router.push('/');
            return;
        }
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [user]);

    const fetchData = async () => {
        try {
            // Fetch Salesmen to ignore their orders
            const salesmenRes = await fetch('/api/admin/salesmen');
            const salesmenData = await salesmenRes.json();
            const salesmenIds = salesmenData.success ? salesmenData.data.map((s: any) => s.id) : [];

            // Fetch Orders
            const ordersRes = await fetch('/api/orders');
            const ordersData = await ordersRes.json();

            if (ordersData.success) {
                const allOrders: Order[] = ordersData.data;

                // Filter logic
                const validOrders = allOrders.filter(order => {
                    // Only Delivery orders
                    if (order.order_type !== 'delivery') return false;

                    // Exclude Salesman orders (if any matched delivery)
                    if (order.user_id && salesmenIds.includes(order.user_id)) return false;

                    return true;
                });

                // Split into Available (Unclaimed) and My Orders
                const available = validOrders.filter(o =>
                    !o.delivery_boy_id &&
                    o.order_status === 'ready'
                );

                const mine = validOrders.filter(o => o.delivery_boy_id === user?.id);

                setAvailableOrders(available);
                setMyOrders(mine);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOrder = async (orderId: number) => {
        if (!confirm('Accept this delivery?')) return;

        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    delivery_boy_id: user?.id,
                    order_status: 'out_for_delivery'
                }),
            });

            if (response.ok) {
                fetchData();
                setActiveTab('my_orders');
            } else {
                alert('Failed to accept order');
            }
        } catch (error) {
            console.error('Error accepting order:', error);
        }
    };

    const handleCompleteOrder = async (orderId: number) => {
        if (!confirm('Mark this order as Delivered?')) return;

        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_status: 'delivered',
                    payment_status: 'paid' // Assuming COD collected or already paid
                }),
            });

            if (response.ok) {
                fetchData();
                alert('Order Delivered Successfully!');
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error completing order:', error);
        }
    };

    if (loading) return <div className="text-center p-5">Loading dashboard...</div>;

    // Calculate total earnings
    const totalEarnings = myOrders.reduce((sum, order) => sum + (order.driver_commission ? parseFloat(order.driver_commission.toString()) : 0), 0);

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>🛵 Delivery Dashboard</h1>
                        <p className="text-muted">Welcome, {user?.name}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={fetchData} className="btn btn-ghost" disabled={loading} title="Refresh Orders">
                            🔄 Refresh
                        </button>
                        <button onClick={logout} className="btn btn-ghost" style={{ color: 'var(--error)' }}>
                            Logout
                        </button>
                    </div>
                </div>

                <div className="glass-card mb-4" style={{ padding: '1rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white' }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Earnings</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>₹{totalEarnings.toFixed(2)}</div>
                </div>

                <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '0.5rem', display: 'flex' }}>
                    <button
                        className={`btn ${activeTab === 'available' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1 }}
                        onClick={() => setActiveTab('available')}
                    >
                        Available Orders ({availableOrders.length})
                    </button>
                    <button
                        className={`btn ${activeTab === 'my_orders' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1 }}
                        onClick={() => setActiveTab('my_orders')}
                    >
                        My Deliveries ({myOrders.length})
                    </button>
                </div>

                <div className="grid grid-2">
                    {(activeTab === 'available' ? availableOrders : myOrders).length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }} className="text-muted">
                            {activeTab === 'available' ? 'No orders available for delivery' : 'You have no active deliveries'}
                        </div>
                    ) : (
                        (activeTab === 'available' ? availableOrders : myOrders).map(order => (
                            <div key={order.id} className="glass-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span className="badge">#{order.id}</span>
                                    <span className={`badge ${order.order_status === 'delivered' ? 'badge-success' : 'badge-warning'}`}>
                                        {order.order_status}
                                    </span>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
                                    <div style={{ color: 'var(--primary)' }}>{order.customer_phone}</div>
                                    <div className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                        📍 {order.customer_address}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '1rem', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.5rem 0' }}>
                                    {order.items.map((item: any, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                                            <span>{item.menuItem.name} x {item.quantity}</span>
                                            <span>₹{item.menuItem.price * item.quantity}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: '0.5rem' }}>
                                        <span>Total Amount</span>
                                        <span>₹{order.total_amount}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: order.payment_status === 'paid' ? 'var(--success)' : 'var(--warning)', textAlign: 'right', marginTop: '0.25rem' }}>
                                        {order.payment_status?.toUpperCase()}
                                    </div>
                                    {order.driver_commission && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: '0.5rem', color: 'var(--success)' }}>
                                            <span>Commission Earned</span>
                                            <span>₹{parseFloat(order.driver_commission.toString()).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                {activeTab === 'available' ? (
                                    <button
                                        onClick={() => handleAcceptOrder(order.id)}
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                    >
                                        Accept Delivery
                                    </button>
                                ) : (
                                    order.order_status !== 'delivered' && (
                                        <button
                                            onClick={() => handleCompleteOrder(order.id)}
                                            className="btn btn-success"
                                            style={{ width: '100%' }}
                                        >
                                            Mark Delivered
                                        </button>
                                    )
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
