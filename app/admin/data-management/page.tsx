'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type DataType = 'menu_items' | 'categories' | 'delivery_locations' | 'users' | 'orders' | 'salesmen' | 'delivery_boys';

interface ExportOptions {
    dataType: DataType;
    format: 'json' | 'csv';
    dateRange?: {
        startDate: string;
        endDate: string;
    };
}

export default function DataManagementPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [exportType, setExportType] = useState<DataType>('menu_items');
    const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
    const [importType, setImportType] = useState<DataType>('menu_items');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [useDataRange, setUseDataRange] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            router.push('/admin');
            return;
        }
    }, []);

    const dataTypes = [
        { value: 'menu_items', label: 'Menu Items', icon: '🍽️' },
        { value: 'categories', label: 'Categories', icon: '🏷️' },
        { value: 'delivery_locations', label: 'Delivery Locations', icon: '📍' },
        { value: 'users', label: 'Users (Customers)', icon: '👥' },
        { value: 'salesmen', label: 'Salesmen', icon: '👨‍💼' },
        { value: 'delivery_boys', label: 'Delivery Boys', icon: '🛵' },
        { value: 'orders', label: 'Orders', icon: '📦' },
    ];

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                type: exportType,
                format: exportFormat,
            });

            if (useDataRange && startDate && endDate && exportType === 'orders') {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            }

            console.log('Exporting with params:', params.toString());
            const response = await fetch(`/api/admin/data-management/export?${params.toString()}`);

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Export error response:', errorData);
                throw new Error(errorData.error || 'Export failed');
            }

            // Check content type
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);

            const blob = await response.blob();
            console.log('Blob size:', blob.size, 'bytes');
            console.log('Blob type:', blob.type);

            if (blob.size === 0) {
                throw new Error('Export returned empty file. No data available.');
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${exportType}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
            a.style.display = 'none';
            document.body.appendChild(a);

            console.log('Triggering download for:', a.download);
            a.click();

            // Clean up after a short delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            showMessage('success', `${exportType} exported successfully! Check your downloads folder.`);
        } catch (error) {
            console.error('Export error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to export data. Please try again.';
            showMessage('error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (fileExtension !== 'json' && fileExtension !== 'csv') {
                showMessage('error', 'Please select a JSON or CSV file');
                return;
            }
            setImportFile(file);
        }
    };

    const handleImport = async () => {
        if (!importFile) {
            showMessage('error', 'Please select a file to import');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', importFile);
            formData.append('type', importType);

            const response = await fetch('/api/admin/data-management/import', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                showMessage('success', data.message || 'Data imported successfully!');
                setImportFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            } else {
                showMessage('error', data.error || 'Failed to import data');
            }
        } catch (error) {
            console.error('Import error:', error);
            showMessage('error', 'Failed to import data. Please check the file format.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="container" style={{ padding: '2rem 1.5rem' }}>
            <div className="fade-in">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1>📊 Data Import/Export</h1>
                    <button onClick={() => router.push('/admin/dashboard')} className="btn btn-ghost">
                        ← Back to Dashboard
                    </button>
                </div>

                {/* Message Alert */}
                {message && (
                    <div
                        className="glass-card"
                        style={{
                            marginBottom: '2rem',
                            padding: '1rem',
                            background: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                            color: 'white',
                            borderRadius: '8px'
                        }}
                    >
                        {message.text}
                    </div>
                )}

                <div className="grid grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
                    {/* Export Section */}
                    <div className="glass-card">
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📤 Export Data
                        </h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Select Data Type
                            </label>
                            <select
                                value={exportType}
                                onChange={(e) => setExportType(e.target.value as DataType)}
                                className="input"
                                style={{ width: '100%' }}
                            >
                                {dataTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.icon} {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Export Format
                            </label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        value="json"
                                        checked={exportFormat === 'json'}
                                        onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <span>JSON</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        value="csv"
                                        checked={exportFormat === 'csv'}
                                        onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <span>CSV</span>
                                </label>
                            </div>
                        </div>

                        {/* Date Range for Orders */}
                        {exportType === 'orders' && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={useDataRange}
                                        onChange={(e) => setUseDataRange(e.target.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Filter by Date Range</span>
                                </label>

                                {useDataRange && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="input"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="input"
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleExport}
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            {loading ? '⏳ Exporting...' : '📥 Download Export'}
                        </button>

                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                                💡 <strong>Tip:</strong> Exported files can be used for backup or importing into another system.
                            </p>
                        </div>
                    </div>

                    {/* Import Section */}
                    <div className="glass-card">
                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📥 Import Data
                        </h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Select Data Type
                            </label>
                            <select
                                value={importType}
                                onChange={(e) => setImportType(e.target.value as DataType)}
                                className="input"
                                style={{ width: '100%' }}
                            >
                                {dataTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.icon} {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                Select File (JSON or CSV)
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,.csv"
                                onChange={handleFileChange}
                                className="input"
                                style={{ width: '100%', padding: '0.75rem' }}
                            />
                            {importFile && (
                                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--success)' }}>
                                    ✓ Selected: {importFile.name}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={handleImport}
                            disabled={loading || !importFile}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            {loading ? '⏳ Importing...' : '📤 Upload & Import'}
                        </button>

                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 165, 0, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 165, 0, 0.3)' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--warning)', margin: 0, marginBottom: '0.5rem' }}>
                                ⚠️ <strong>Warning:</strong>
                            </p>
                            <ul style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '1.5rem' }}>
                                <li>Importing will add new records to the database</li>
                                <li>Duplicate entries may be skipped or updated</li>
                                <li>Always backup your data before importing</li>
                                <li>Ensure file format matches the selected data type</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Information Section */}
                <div className="glass-card" style={{ marginTop: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>📚 Data Format Guide</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        <div>
                            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Menu Items</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                name, description, category_id, price, gst_rate, available
                            </p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Categories</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                name, description, sort_order
                            </p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Delivery Locations</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                location_name, delivery_charge, is_active
                            </p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>Users</h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                                email, name, phone, address, role
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
