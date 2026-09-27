'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function OrdersContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        if (user) {
            if (searchParams.get('success') === 'true') {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 5000);
            }
            fetchOrders();
        }
    }, [searchParams, user, authLoading, isAuthenticated]);

    const fetchOrders = async () => {
        if (!user) return;

        try {
            const response = await fetch(`/api/orders?userId=${user.id}`);
            const data = await response.json();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'badge-success';
            case 'cancelled': return 'badge-error';
            case 'preparing':
            case 'ready': return 'badge-warning';
            default: return 'badge-primary';
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
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                {showSuccess && (
                    <div className="glass-card" style={{
                        marginBottom: '2rem',
                        background: 'rgba(50, 200, 100, 0.1)',
                        border: '1px solid rgba(50, 200, 100, 0.3)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '2rem' }}>✓</span>
                            <div>
                                <h3 style={{ color: 'var(--success)', marginBottom: '0.25rem' }}>Order Placed Successfully!</h3>
                                <p className="text-muted" style={{ marginBottom: 0 }}>
                                    Your order has been received and will be prepared shortly.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <h1 className="text-center mb-3">Your Orders</h1>
                <p className="text-center text-muted mb-5" style={{ fontSize: '1.125rem' }}>
                    Track and view your order history
                </p>

                {orders.length === 0 ? (
                    <div className="glass-card text-center" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem 2rem' }}>
                        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📦</div>
                        <h2>No Orders Yet</h2>
                        <p className="text-muted" style={{ marginBottom: '2rem' }}>
                            You haven't placed any orders. Start by browsing our menu!
                        </p>
                        <a href="/menu" className="btn btn-primary">
                            Browse Menu
                        </a>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
                        {orders.map((order, index) => (
                            <div
                                key={order.id}
                                className="glass-card slide-up"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '0.5rem' }}>Order #{order.id}</h3>
                                        <p className="text-muted" style={{ fontSize: '0.9375rem', marginBottom: 0 }}>
                                            {formatDateTime(order.created_at!)}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className={`badge ${getStatusColor(order.order_status!)}`}>
                                            {order.order_status}
                                        </span>
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                                                {order.payment_status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    borderTop: '1px solid var(--border-color)',
                                    borderBottom: '1px solid var(--border-color)',
                                    padding: '1rem 0',
                                    margin: '1rem 0',
                                }}>
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <strong>Items:</strong>
                                    </div>
                                    {(Array.isArray(order.items) ? order.items : []).map((item: any, idx: number) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                marginBottom: '0.5rem',
                                                paddingLeft: '1rem',
                                            }}
                                        >
                                            <span className="text-muted">
                                                {item.menuItem.name} × {item.quantity}
                                            </span>
                                            <span>₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                            Delivery Address
                                        </div>
                                        <div>{order.customer_address}</div>
                                        {(order as any).delivery_location_name && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <span className="badge" style={{ background: 'var(--info)', color: 'white', fontSize: '0.75rem' }}>
                                                    📍 {(order as any).delivery_location_name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                            Payment Method
                                        </div>
                                        <div style={{ textTransform: 'capitalize' }}>{order.payment_method}</div>
                                        {(order as any).delivery_charge > 0 && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                Delivery: ₹{parseFloat((order as any).delivery_charge).toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid var(--border-color)',
                                }}>
                                    <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>Total Amount</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                        ₹{parseFloat(order.total_amount as any).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="spinner"></div>
            </div>
        }>
            <OrdersContent />
        </Suspense>
    );
}
