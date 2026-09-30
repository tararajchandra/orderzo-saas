'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function DineInCheckoutPage() {
    const router = useRouter();
    const { cart, getCartTotal, clearCart, isLoaded: cartLoaded } = useCart();
    const { user, loading: authLoading } = useAuth(); // We get user if they happen to be logged in, but won't force it
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [tableNumber, setTableNumber] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        notes: '',
    });

    useEffect(() => {
        // Fetch settings for GST type
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.success) setSettings(data.data);
            })
            .catch(err => console.error('Error fetching settings:', err));
            
        // Get table number
        const storedTable = sessionStorage.getItem('table_number');
        if (storedTable) {
            setTableNumber(storedTable);
        } else {
            // If somehow they reached here without a table number, redirect to cart
            router.push('/cart');
        }
    }, [router]);

    const subtotal = getCartTotal();

    const calculateTax = () => {
        if (settings?.gstType !== 'regular') return 0;

        return cart.reduce((sum, item) => {
            const itemPrice = item.menuItem.price;
            const gstRate = (item.menuItem.gst_rate || 5) / 100;
            return sum + (itemPrice * item.quantity * gstRate);
        }, 0);
    };

    const tax = calculateTax();
    const total = subtotal + tax;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!tableNumber) return;

        setLoading(true);

        try {
            const orderData = {
                user_id: user?.id,
                customer_name: user?.name || 'Walk-in Customer',
                customer_phone: user?.phone || 'N/A',
                customer_address: null,
                order_type: 'dine_in',
                table_number: tableNumber,
                items: cart.map(item => ({
                    menuItem: {
                        id: item.menuItem.id,
                        name: item.menuItem.name,
                        price: item.menuItem.price,
                        gst_rate: item.menuItem.gst_rate
                    },
                    quantity: item.quantity
                })),
                subtotal,
                tax,
                discount: 0,
                delivery_location_id: null,
                delivery_charge: 0,
                total_amount: total,
                payment_method: 'cash',
                notes: formData.notes,
                customer_lat: null,
                customer_lng: null,
                distance: null,
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const data = await response.json();

            if (data.success) {
                clearCart();
                // We keep table_number in sessionStorage in case they order more later
                router.push(`/orders?success=true&orderId=${data.data.id}`);
            } else {
                alert('Failed to place order. Please try again.');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!cartLoaded) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
                <span className="spinner"></span>
                <p>Loading checkout...</p>
            </div>
        );
    }

    if (cart.length === 0) {
        router.push('/cart');
        return null;
    }

    if (!tableNumber) {
        return null; // Will redirect in useEffect
    }

    return (
        <main className="container" style={{ padding: '2rem 1.5rem', maxWidth: '900px' }}>
            <div className="fade-in">
                <h1 className="text-center mb-4">Dine-In Checkout</h1>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        
                        {/* Table Information */}
                        <div className="glass-card" style={{ border: '2px solid var(--primary)', backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }}>
                            <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Table Order</h3>
                            <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>Table Number: {tableNumber}</p>
                            <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Your order will be served directly to your table. No delivery charge applies.</p>
                            
                            <div style={{ marginTop: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                    Special Instructions (Optional)
                                </label>
                                <textarea
                                    className="input"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Any special requests or instructions for the chef"
                                    rows={2}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="glass-card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Payment Method</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{
                                        padding: '1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'default'
                                    }}
                                >
                                    <span style={{ fontSize: '2rem' }}>💵</span>
                                    <span style={{ fontSize: '0.875rem' }}>Pay at Counter</span>
                                </button>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="glass-card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Order Summary</h3>

                            <div style={{ marginBottom: '1.5rem' }}>
                                {cart.map((item) => (
                                    <div
                                        key={item.menuItem.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.75rem',
                                            paddingBottom: '0.75rem',
                                            borderBottom: '1px solid var(--border-color)',
                                        }}
                                    >
                                        <span>
                                            {item.menuItem.name} × {item.quantity}
                                        </span>
                                        <span>₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span className="text-muted">Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                {settings?.gstType === 'regular' && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span className="text-muted">Tax (GST)</span>
                                        <span>₹{tax.toFixed(2)}</span>
                                    </div>
                                )}
                                <div style={{
                                    borderTop: '1px solid var(--border-color)',
                                    paddingTop: '0.75rem',
                                    marginTop: '0.75rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                }}>
                                    <span>Total</span>
                                    <span style={{ color: 'var(--primary)' }}>₹{total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ width: '100%', fontSize: '1.125rem', padding: '1rem' }}
                            >
                                {loading ? 'Placing Order...' : 'Place Order'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
}
