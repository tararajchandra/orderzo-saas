const fs = require('fs');
let content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

const newLink = `                    <Link href="/admin/audit-logs" className="glass-card text-center" style={{ textDecoration: 'none', cursor: 'pointer', position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📋</div>
                        <h3 style={{ color: 'var(--text-primary)' }}>Audit Trail</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Activity Logs</p>
                    </Link>\n`;

content = content.replace(
    /(<Link href="\/admin\/attendance"[^>]+>[\s\S]*?<\/Link>)/,
    "$1\n" + newLink
);

fs.writeFileSync('app/admin/dashboard/page.tsx', content);
