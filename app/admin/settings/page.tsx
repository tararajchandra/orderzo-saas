'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Settings {
    restaurantName: string;
    restaurantAddress: string;
    restaurantPhone: string;
    restaurantEmail: string;
    gstNumber: string;
    gstType: 'regular' | 'composite' | 'unregistered';
    printerType: 'thermal' | 'a4';
    paperWidth: '58mm' | '80mm';
    showLogo: boolean;
    footerText: string;
    totalTables: string;
    restaurantLat: string;
    restaurantLng: string;
    allowedRadius: string;
    customerRadius: string;
}

const defaultSettings: Settings = {
    restaurantName: 'OrderZo',
    restaurantAddress: '123 Main Street, City, State 12345',
    restaurantPhone: '+91 1234567890',
    restaurantEmail: 'info@OrderZo.com',
    gstNumber: '',
    gstType: 'regular',
    printerType: 'thermal',
    paperWidth: '80mm',
    showLogo: true,
    footerText: 'Thank you for your business!',
    totalTables: '16',
    restaurantLat: '22.5726',
    restaurantLng: '88.3639',
    allowedRadius: '50',
    customerRadius: '50',
};

export default function SettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            if (data.success) {
                setSettings({ ...defaultSettings, ...data.data });
                localStorage.setItem('printerSettings', JSON.stringify(data.data));
            }
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setSaved(true);
                // Update local storage as well for sync in other pages that might still read it
                localStorage.setItem('printerSettings', JSON.stringify(settings));
                setTimeout(() => setSaved(false), 3000);
            } else {
                alert('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('An error occurred while saving');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('Reset to default settings?')) {
            setSettings(defaultSettings);
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <h1>Settings</h1>
                        <button 
                            onClick={() => router.push('/admin/settings/financial-years')} 
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
                        >
                            📅 Manage Financial Years
                        </button>
                    </div>
                    <button onClick={() => router.push('/admin/dashboard')} className="btn btn-ghost">
                        ← Back to Dashboard
                    </button>
                </div>

                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Restaurant Information</h2>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Restaurant Name
                                </label>
                                <input
                                    type="text"
                                    value={settings.restaurantName}
                                    onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                                    className="input"
                                    placeholder="Enter restaurant name"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Address
                                </label>
                                <textarea
                                    value={settings.restaurantAddress}
                                    onChange={(e) => setSettings({ ...settings, restaurantAddress: e.target.value })}
                                    className="input"
                                    placeholder="Enter restaurant address"
                                    rows={2}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={settings.restaurantPhone}
                                        onChange={(e) => setSettings({ ...settings, restaurantPhone: e.target.value })}
                                        className="input"
                                        placeholder="Enter phone number"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.restaurantEmail}
                                        onChange={(e) => setSettings({ ...settings, restaurantEmail: e.target.value })}
                                        className="input"
                                        placeholder="Enter email"
                                    />
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Total Tables (For Active Tables View)
                                    </label>
                                    <input
                                        type="number"
                                        value={settings.totalTables}
                                        onChange={(e) => setSettings({ ...settings, totalTables: e.target.value })}
                                        className="input"
                                        placeholder="e.g. 16"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        GST Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.gstNumber}
                                        onChange={(e) => setSettings({ ...settings, gstNumber: e.target.value })}
                                        className="input"
                                        placeholder="Enter GST number"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        GST Type
                                    </label>
                                    <select
                                        value={settings.gstType}
                                        onChange={(e) => setSettings({ ...settings, gstType: e.target.value as any })}
                                        className="input"
                                    >
                                        <option value="regular">Regular (Tax Invoice)</option>
                                        <option value="composite">Composite (Bill of Supply)</option>
                                        <option value="unregistered">Unregistered (Bill of Supply)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Printer Configuration</h2>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Printer Type
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => setSettings({ ...settings, printerType: 'thermal' })}
                                        className={settings.printerType === 'thermal' ? 'btn btn-primary' : 'btn btn-ghost'}
                                    >
                                        🖨️ Thermal Printer
                                    </button>
                                    <button
                                        onClick={() => setSettings({ ...settings, printerType: 'a4' })}
                                        className={settings.printerType === 'a4' ? 'btn btn-primary' : 'btn btn-ghost'}
                                    >
                                        📄 A4 Printer
                                    </button>
                                </div>
                            </div>

                            {settings.printerType === 'thermal' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        Paper Width
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => setSettings({ ...settings, paperWidth: '58mm' })}
                                            className={settings.paperWidth === '58mm' ? 'btn btn-primary' : 'btn btn-ghost'}
                                        >
                                            58mm
                                        </button>
                                        <button
                                            onClick={() => setSettings({ ...settings, paperWidth: '80mm' })}
                                            className={settings.paperWidth === '80mm' ? 'btn btn-primary' : 'btn btn-ghost'}
                                        >
                                            80mm
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Footer Text
                                </label>
                                <input
                                    type="text"
                                    value={settings.footerText}
                                    onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                                    className="input"
                                    placeholder="Enter footer text"
                                />
                            </div>
                        </div>
                    </div>

                    
                    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>Geofencing & Attendance</h2>
                            <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => {
                                    if(navigator.geolocation) {
                                        navigator.geolocation.getCurrentPosition(
                                            (pos) => {
                                                setSettings({
                                                    ...settings,
                                                    restaurantLat: pos.coords.latitude.toString(),
                                                    restaurantLng: pos.coords.longitude.toString()
                                                });
                                                alert('Location fetched successfully!');
                                            },
                                            (err) => alert('Could not fetch location. Please allow GPS access.')
                                        );
                                    }
                                }}
                            >
                                📍 Get Current Location
                            </button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Set the exact GPS coordinates of your restaurant. Staff must be within the Allowed Radius to check-in, and customers must be within the Customer Radius to place orders.
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Latitude</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={settings.restaurantLat}
                                    onChange={(e) => setSettings({ ...settings, restaurantLat: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Longitude</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={settings.restaurantLng}
                                    onChange={(e) => setSettings({ ...settings, restaurantLng: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Staff Radius (M)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={settings.allowedRadius}
                                    onChange={(e) => setSettings({ ...settings, allowedRadius: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Customer Radius (M)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={settings.customerRadius}
                                    onChange={(e) => setSettings({ ...settings, customerRadius: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(255, 145, 0, 0.3)' }}>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--warning)' }}>Database Maintenance</h2>
                        <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                            If you encounter errors saying "column does not exist", use this button to update your database schema to the latest version.
                        </p>

                        <button
                            onClick={async () => {
                                if (confirm('Update database schema to the latest version?')) {
                                    setSaving(true);
                                    try {
                                        const res = await fetch('/api/admin/run-migration', { method: 'POST' });
                                        const data = await res.json();
                                        if (data.success) {
                                            const summary = data.results.map((r: any) => `${r.id}: ${r.success ? '✅' : '❌'}`).join('\n');
                                            alert('Migration process finished:\n' + summary);
                                        } else {
                                            alert('Update failed: ' + (data.error || 'Unknown error'));
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        alert('An error occurred during update.');
                                    } finally {
                                        setSaving(false);
                                    }
                                }
                            }}
                            disabled={saving}
                            className="btn btn-warning"
                            style={{ width: '100%' }}
                        >
                            {saving ? 'Updating...' : '🔄 Run Database Schema Update'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button onClick={handleReset} className="btn btn-ghost">
                            Reset to Default
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary"
                            style={{ minWidth: '150px' }}
                        >
                            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
