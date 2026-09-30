const fs = require('fs');

let content = fs.readFileSync('app/admin/settings/page.tsx', 'utf8');

// If already updated, do not duplicate
if (!content.includes('customerRadius: string;')) {
    content = content.replace(
        /totalTables: string;\r?\n\}/,
        `totalTables: string;\n    restaurantLat: string;\n    restaurantLng: string;\n    allowedRadius: string;\n    customerRadius: string;\n}`
    );

    content = content.replace(
        /totalTables: '16',\r?\n\};/,
        `totalTables: '16',\n    restaurantLat: '22.5726',\n    restaurantLng: '88.3639',\n    allowedRadius: '50',\n    customerRadius: '50',\n};`
    );

    const geoUI = `
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
`;

    content = content.replace(
        /<div className="glass-card" style={{ marginBottom: '1.5rem', border: '1px solid rgba\(255, 145, 0, 0.3\)' }}>/,
        geoUI + `\n                    <div className="glass-card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(255, 145, 0, 0.3)' }}>`
    );

    fs.writeFileSync('app/admin/settings/page.tsx', content);
}
