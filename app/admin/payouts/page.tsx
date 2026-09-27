'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DeliveryBoyReport {
    id: number;
    name: string;
    phone: string;
    total_earned: string;
    total_paid: string;
    due_amount: string;
}

export default function PayoutsPage() {
    const router = useRouter();
    const [report, setReport] = useState<DeliveryBoyReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBoy, setSelectedBoy] = useState<DeliveryBoyReport | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/payouts');
            const data = await res.json();
            if (data.success) {
                setReport(data.data);
            }
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayClick = (boy: DeliveryBoyReport) => {
        setSelectedBoy(boy);
        setPayAmount(boy.due_amount); // Default to full due amount
        setNotes('');
    };

    const submitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBoy) return;

        setProcessing(true);
        try {
            const res = await fetch('/api/admin/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: selectedBoy.id,
                    amount: parseFloat(payAmount),
                    notes
                })
            });

            if (res.ok) {
                alert('Payment Recorded Successfully!');
                setSelectedBoy(null);
                fetchReport(); // Refresh data
            } else {
                alert('Payment Failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Error processing payment');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-5 text-center">Loading Payouts...</div>;

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>💰 Commission & Payouts</h1>
                        <p className="text-muted">Manage delivery boy commissions and payments</p>
                    </div>
                    <button onClick={() => router.push('/admin/dashboard')} className="btn btn-ghost">
                        ← Dashboard
                    </button>
                </div>

                <div className="glass-card">
                    <div className="table-container">
                        <table className="table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Total Earned</th>
                                    <th>Total Paid</th>
                                    <th>Due Amount</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.map(boy => (
                                    <tr key={boy.id}>
                                        <td>{boy.name}</td>
                                        <td>{boy.phone}</td>
                                        <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{parseFloat(boy.total_earned).toFixed(2)}</td>
                                        <td style={{ color: 'var(--info)' }}>₹{parseFloat(boy.total_paid).toFixed(2)}</td>
                                        <td style={{ color: parseFloat(boy.due_amount) > 0 ? 'var(--error)' : 'var(--text-muted)', fontWeight: 700 }}>
                                            ₹{parseFloat(boy.due_amount).toFixed(2)}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-primary"
                                                disabled={parseFloat(boy.due_amount) <= 0}
                                                onClick={() => handlePayClick(boy)}
                                                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                            >
                                                Pay Now
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {report.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center text-muted">No delivery boys found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment Modal */}
                {selectedBoy && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div className="glass-card fade-in" style={{ width: '400px', background: 'var(--background)' }}>
                            <h3>Pay {selectedBoy.name}</h3>
                            <p className="text-muted">Current Due: ₹{parseFloat(selectedBoy.due_amount).toFixed(2)}</p>

                            <form onSubmit={submitPayment} style={{ marginTop: '1rem' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input"
                                        value={payAmount}
                                        onChange={e => setPayAmount(e.target.value)}
                                        required
                                        max={selectedBoy.due_amount} // Optional: restrict overpayment?
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Notes</label>
                                    <textarea
                                        className="input"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="e.g. Weekly settlement"
                                    ></textarea>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setSelectedBoy(null)} className="btn btn-ghost">Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={processing}>
                                        {processing ? 'Processing...' : 'Confirm Payment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
