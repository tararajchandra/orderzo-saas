'use client';

import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="footer no-print">
            <div className="container">
                <div className="footer-content">
                    <span className="text-muted">Developed by</span>
                    <div className="footer-logo">
                        <Image
                            src="/OrderZo_Logo_Mod.png"
                            alt="Developer Logo"
                            width={120}
                            height={60}
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                    <span className="text-muted">•</span>
                    <a href="/help" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem' }}>
                        📚 Help & Documentation
                    </a>
                </div>
            </div>
            <style jsx>{`
                .footer {
                    padding: 2rem 0;
                    margin-top: auto;
                    border-top: 1px solid var(--border-color);
                    background: var(--bg-secondary);
                }
                .footer-content {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                }
                .footer-logo {
                    display: flex;
                    align-items: center;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                .footer-logo:hover {
                    opacity: 1;
                }
            `}</style>
        </footer>
    );
}
