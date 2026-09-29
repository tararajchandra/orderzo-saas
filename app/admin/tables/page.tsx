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
    const [totalTables, setTotalTables] = useState(16);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);

    // Modal state for showing table details
    const [showModal, setShowModal] = useState(false);
    
    // For printing
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        fetchSettings();
        fetchActiveTableOrders();
        
        // Poll every 15s to keep it fresh
        const interval = setInterval(() => {
            fetchActiveTableOrders(true);
        }, 15000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            if (data.success) {
                setSettings(data.data);
                if (data.data.totalTables) {
                    setTotalTables(parseInt(data.data.totalTables, 10));
                }
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchActiveTableOrders = async (isPolling = false) => {
        try {
            const response = await fetch('/api/orders', { cache: 'no-store' });
            const data = await response.json();
            if (data.success) {
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
        const table = order.table_number.toString();
        if (!acc[table]) {
            acc[table] = { orders: [], total: 0, lastActivity: order.created_at };
        }
        acc[table].orders.push(order);
        acc[table].total += parseFloat(order.total_amount || 0);
        if (new Date(order.created_at) > new Date(acc[table].lastActivity)) {
            acc[table].lastActivity = order.created_at;
        }
        return acc;
    }, {});

    const handleSettleTable = async (tableNo: string, paymentMethod: string) => {
        const confirmSettle = confirm(`Are you sure you want to settle all pending orders for Table ${tableNo} with ${paymentMethod.toUpperCase()}?`);
        if (!confirmSettle) return;
        
        setSettlingTable(tableNo);
        const tableOrders = tableGroups[tableNo].orders;
        
        try {
            // Sort by oldest first so we keep the first order id as the master
            const sortedOrders = [...tableOrders].sort((a: any, b: any) => a.id - b.id);
            const masterOrder = sortedOrders[0];
            const otherOrders = sortedOrders.slice(1);

            let combinedItems: any[] = [];
            let totalSubtotal = 0;
            let totalTax = 0;
            let totalDiscount = 0;
            
            sortedOrders.forEach((o: any) => {
                let parsedItems = [];
                try {
                    parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
                } catch(e) {}
                combinedItems = [...combinedItems, ...parsedItems];
                totalSubtotal += parseFloat(o.subtotal || 0);
                totalTax += parseFloat(o.tax || 0);
                totalDiscount += parseFloat(o.discount || 0);
            });

            const mergedItemsMap = new Map();
            combinedItems.forEach(item => {
                const key = item.menuItem.id;
                if (mergedItemsMap.has(key)) {
                    const existing = mergedItemsMap.get(key);
                    mergedItemsMap.set(key, { ...existing, quantity: existing.quantity + item.quantity });
                } else {
                    mergedItemsMap.set(key, item);
                }
            });
            const finalItems = Array.from(mergedItemsMap.values());
            const finalTotal = totalSubtotal + totalTax - totalDiscount;

            // Update Master Order with merged items and totals
            await fetch(`/api/orders/${masterOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    payment_status: 'paid',
                    payment_method: paymentMethod,
                    order_status: 'delivered',
                    items: finalItems,
                    subtotal: totalSubtotal,
                    tax: totalTax,
                    discount: totalDiscount,
                    total_amount: finalTotal
                }),
            });
            
            // Delete the duplicate separated orders since they are now merged
            if (otherOrders.length > 0) {
                const deletePromises = otherOrders.map((o: any) => 
                    fetch(`/api/orders/${o.id}`, { method: 'DELETE' })
                );
                await Promise.all(deletePromises);
            }
            
            alert(`Table ${tableNo} settled successfully!`);
            setShowModal(false);
            fetchActiveTableOrders();
        } catch (error) {
            console.error('Error settling table:', error);
            alert('An error occurred while settling the table.');
        } finally {
            setSettlingTable(null);
        }
    };
    
    // Print Bill functionality - combining all orders for the table
    const handlePrintBill = (tableNo: string) => {
        if (!settings) {
            alert('Settings not loaded yet.');
            return;
        }
        
        const group = tableGroups[tableNo];
        if (!group) return;

        const isThermal = settings.printerType === 'thermal';
        const paperWidth = settings.paperWidth === '58mm' ? '58mm' : '80mm';
        const fontSize = settings.paperWidth === '58mm' ? '12px' : '14px';

        // Combine items from all orders
        let combinedItems: any[] = [];
        let totalSubtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;
        let grandTotal = group.total;
        
        group.orders.forEach((o: any) => {
            let parsedItems = [];
            try {
                parsedItems = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
            } catch(e) {}
            
            combinedItems = [...combinedItems, ...parsedItems];
            totalSubtotal += parseFloat(o.subtotal || 0);
            totalTax += parseFloat(o.tax || 0);
            totalDiscount += parseFloat(o.discount || 0);
        });

        // Combine same items if they appear across multiple orders
        const mergedItemsMap = new Map();
        combinedItems.forEach(item => {
            const key = item.menuItem.id;
            if (mergedItemsMap.has(key)) {
                const existing = mergedItemsMap.get(key);
                mergedItemsMap.set(key, { ...existing, quantity: existing.quantity + item.quantity });
            } else {
                mergedItemsMap.set(key, item);
            }
        });
        const finalItems = Array.from(mergedItemsMap.values());

        const orderDate = formatDateTime(new Date().toISOString());

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Master Bill - Table ${tableNo}</title>
                <style>
                    body {
                        font-family: ${isThermal ? 'monospace' : 'Arial, sans-serif'};
                        font-size: ${isThermal ? fontSize : '14px'};
                        margin: 0;
                        padding: ${isThermal ? '0' : '20px'};
                        width: ${isThermal ? paperWidth : '100%'};
                        color: #000;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .bold { font-weight: bold; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { padding: 4px 2px; text-align: left; }
                    th { border-bottom: 1px dashed #000; border-top: 1px dashed #000; }
                    .border-top { border-top: 1px dashed #000; }
                    .border-bottom { border-bottom: 1px dashed #000; }
                    @media print {
                        body { width: ${isThermal ? paperWidth : '100%'}; }
                        @page { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="text-center">
                    <h2 style="margin:0;font-size:${isThermal ? '18px' : '24px'}">${settings.restaurantName}</h2>
                    <p style="margin:2px 0;">${settings.restaurantAddress}</p>
                    <p style="margin:2px 0;">Phone: ${settings.restaurantPhone}</p>
                    ${settings.gstNumber ? `<p style="margin:2px 0;">GSTIN: ${settings.gstNumber}</p>` : ''}
                    <div style="margin:10px 0; border-top:1px dashed #000; border-bottom:1px dashed #000; padding:5px 0;">
                        <span class="bold">MASTER BILL (Dine-in)</span>
                    </div>
                </div>
                
                <div>
                    <div class="bold" style="font-size: 18px; margin-bottom: 5px;">Table No: ${tableNo}</div>
                    <div>Date: ${orderDate}</div>
                    <div>Orders: ${group.orders.map((o:any) => '#' + (o.order_number || o.id)).join(', ')}</div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 50%">Item</th>
                            <th class="text-center">Qty</th>
                            <th class="text-right">Price</th>
                            <th class="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${finalItems.map((item: any) => `
                        <tr>
                            <td>${item.menuItem.name}</td>
                            <td class="text-center">${item.quantity}</td>
                            <td class="text-right">${Number(item.menuItem.price).toFixed(2)}</td>
                            <td class="text-right">${(Number(item.menuItem.price) * item.quantity).toFixed(2)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="margin-top: 10px; padding-top: 5px;" class="border-top">
                    <table style="margin-top: 0;">
                        <tr>
                            <td>Subtotal</td>
                            <td class="text-right">${totalSubtotal.toFixed(2)}</td>
                        </tr>
                        ${totalTax > 0 ? `
                        <tr>
                            <td>Taxes</td>
                            <td class="text-right">${totalTax.toFixed(2)}</td>
                        </tr>` : ''}
                    </table>
                </div>

                <div style="margin-top: 10px; padding: 10px 0;" class="border-top border-bottom bold">
                    <table style="margin-top: 0;">
                        <tr>
                            <td style="font-size: ${isThermal ? '16px' : '18px'}">GRAND TOTAL</td>
                            <td class="text-right" style="font-size: ${isThermal ? '16px' : '18px'}">Rs. ${grandTotal.toFixed(2)}</td>
                        </tr>
                    </table>
                </div>

                <div class="text-center" style="margin-top: 20px;">
                    <p style="margin: 2px 0;">${settings.footerText}</p>
                </div>
                
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    // Generate table array [1, 2, 3, ..., totalTables]
    const tablesList = Array.from({ length: totalTables }, (_, i) => (i + 1).toString());

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ marginBottom: '0.5rem' }}>Active Tables (Dine-in)</h1>
                        <p className="text-muted">Manage table orders & billing</p>
                    </div>
                    <Link href="/admin/dashboard" className="btn btn-ghost">
                        ← Back to Dashboard
                    </Link>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    {tablesList.map(tableNo => {
                        const isOccupied = !!tableGroups[tableNo];
                        
                        return (
                            <button
                                key={tableNo}
                                onClick={() => {
                                    if (isOccupied) {
                                        setSelectedTable(tableNo);
                                        setShowModal(true);
                                    } else {
                                        // Empty table clicked
                                        alert(`Table ${tableNo} is currently empty.`);
                                    }
                                }}
                                style={{
                                    height: '100px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: isOccupied ? 'var(--error)' : 'var(--success)',
                                    color: 'white',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    transition: 'transform 0.2s',
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>T-{tableNo}</span>
                                {isOccupied && (
                                    <span style={{ fontSize: '0.8rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                                        ₹{tableGroups[tableNo].total.toFixed(0)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Modal for Table Details */}
            {showModal && selectedTable && tableGroups[selectedTable] && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    padding: '1rem'
                }}>
                    <div className="glass-card fade-in" style={{ 
                        width: '100%', maxWidth: '500px', 
                        background: 'var(--bg-color)',
                        maxHeight: '90vh', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            <h2 style={{ margin: 0, color: 'var(--primary)' }}>Table {selectedTable}</h2>
                            <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ padding: '0.5rem' }}>✕</button>
                        </div>
                        
                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem', marginBottom: '1rem' }}>
                            {tableGroups[selectedTable].orders.map((o: any, idx: number) => (
                                <div key={o.id} style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--glass-bg)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <strong>Order #{o.order_number || o.id}</strong>
                                        <span className="badge badge-info">{o.order_status}</span>
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                                        {formatDateTime(o.created_at)}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                                        <span>Amount:</span>
                                        <span>₹{parseFloat(o.total_amount).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Master Bill</span>
                                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                                    ₹{tableGroups[selectedTable].total.toFixed(2)}
                                </span>
                            </div>
                            
                            <button 
                                onClick={() => handlePrintBill(selectedTable)}
                                className="btn btn-ghost"
                                style={{ width: '100%', marginBottom: '1rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                🖨️ Print Master Bill
                            </button>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button 
                                    onClick={() => handleSettleTable(selectedTable, 'cash')}
                                    disabled={settlingTable === selectedTable}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    {settlingTable === selectedTable ? '...' : '💵 Settle Cash'}
                                </button>
                                <button 
                                    onClick={() => handleSettleTable(selectedTable, 'upi')}
                                    disabled={settlingTable === selectedTable}
                                    className="btn btn-secondary"
                                    style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', background: '#3b82f6', color: 'white', border: 'none' }}
                                >
                                    {settlingTable === selectedTable ? '...' : '📱 Settle UPI'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
