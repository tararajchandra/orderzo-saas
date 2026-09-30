const fs = require('fs');
let content = fs.readFileSync('components/Navbar.tsx', 'utf8');

const regex = /<div style=\{\{ display: 'flex', alignItems: 'center', gap: '0\.5rem' \}\}>[\s\S]*?<Link href="\/login"[\s\S]*?<\/div>/;

const replacement = `                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {(!isTableOrder && pathname !== '/menu' && pathname !== '/cart' && pathname !== '/dine-in-checkout') && (
                                <>
                                    <Link href="/login" className="btn btn-ghost" style={{ padding: '0.5rem 1rem' }}>
                                        Login
                                    </Link>
                                    <Link href="/signup" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>`;

content = content.replace(regex, replacement);
fs.writeFileSync('components/Navbar.tsx', content);
