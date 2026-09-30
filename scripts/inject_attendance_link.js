const fs = require('fs');
let content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

const newLink = `                    <Link href="/admin/attendance" className="glass-card text-center" style={{ textDecoration: 'none', cursor: 'pointer', position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⏱️</div>
                        <h3 style={{ color: 'var(--text-primary)' }}>Staff Attendance</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>View Reports</p>
                    </Link>\n`;

content = content.replace(
    /(<Link href="\/admin\/settings\/financial-years"[^>]+>[\s\S]*?<\/Link>)/,
    "$1\n" + newLink
);

fs.writeFileSync('app/admin/dashboard/page.tsx', content);
