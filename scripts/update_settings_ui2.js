const fs = require('fs');

let content = fs.readFileSync('app/admin/settings/page.tsx', 'utf8');

// 1. Update Settings interface
content = content.replace(
    /allowedRadius: string;\n\}/,
    `allowedRadius: string;\n    customerRadius: string;\n}`
);

// 2. Update defaultSettings
content = content.replace(
    /allowedRadius: '50',\n\};/,
    `allowedRadius: '50',\n    customerRadius: '100',\n};`
);

// 3. Update the UI to add the new input box
content = content.replace(
    /<div>\n\s*<label[^>]*>Allowed Radius \(Meters\)<\/label>[\s\S]*?<\/div>/,
    match => match + `
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Customer Order Radius (M)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={settings.customerRadius}
                                    onChange={(e) => setSettings({ ...settings, customerRadius: e.target.value })}
                                />
                            </div>`
);

// Also change the grid template columns from '1fr 1fr 1fr' to '1fr 1fr 1fr 1fr'
content = content.replace(/gridTemplateColumns: '1fr 1fr 1fr'/, "gridTemplateColumns: '1fr 1fr 1fr 1fr'");

fs.writeFileSync('app/admin/settings/page.tsx', content);
