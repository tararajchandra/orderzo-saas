const fs = require('fs');

let content = fs.readFileSync('components/Navbar.tsx', 'utf8');

// Add useState, useEffect import if not present (it's not present for useState but let's check)
if (!content.includes('useState')) {
    content = content.replace(/import Link from 'next\/link';/, "import { useState, useEffect } from 'react';\nimport Link from 'next/link';");
}

// Add state and effect
content = content.replace(
    /const cartCount = getCartCount\(\);/,
    `const cartCount = getCartCount();\n    const [isTableOrder, setIsTableOrder] = useState(false);\n\n    useEffect(() => {\n        if (typeof window !== 'undefined') {\n            setIsTableOrder(!!localStorage.getItem('tableNumber'));\n        }\n    }, []);`
);

// Replace the Login/Signup block with condition
const oldAuthBlock = `                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Link href="/login" className="btn btn-ghost" style={{ padding: '0.5rem 1rem' }}>
                                Login
                            </Link>
                            <Link href="/signup" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                                Sign Up
                            </Link>
                        </div>`;

const newAuthBlock = `                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {!isTableOrder && (
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

content = content.replace(oldAuthBlock, newAuthBlock);

fs.writeFileSync('components/Navbar.tsx', content);
