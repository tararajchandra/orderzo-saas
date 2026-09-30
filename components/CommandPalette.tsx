'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Command {
    id: string;
    title: string;
    route: string;
    icon: string;
    roles: string[]; // Roles that can see this command
}

const ALL_COMMANDS: Command[] = [
    { id: 'dashboard', title: 'Dashboard', route: '/admin/dashboard', icon: '📊', roles: ['admin'] },
    { id: 'billing', title: 'Billing', route: '/admin/billing', icon: '🧾', roles: ['admin'] },
    { id: 'quick-bill', title: 'Quick Bill', route: '/admin/quick-bill', icon: '⚡', roles: ['admin'] },
    { id: 'tables', title: 'Active Tables', route: '/admin/tables', icon: '🍽️', roles: ['admin'] },
    { id: 'create-order', title: 'Create Order', route: '/admin/orders/create', icon: '➕', roles: ['admin'] },
    { id: 'sales', title: 'Sales Report', route: '/admin/sales', icon: '📈', roles: ['admin'] },
    { id: 'product-sales', title: 'Product Sales', route: '/admin/product-sales', icon: '🍔', roles: ['admin'] },
    { id: 'cashbook', title: 'Cashbook (Expenses)', route: '/admin/cashbook', icon: '💰', roles: ['admin'] },
    { id: 'gst-report', title: 'GST Report', route: '/admin/gst-report', icon: '📑', roles: ['admin'] },
    { id: 'attendance', title: 'Staff Attendance', route: '/admin/attendance', icon: '⏱️', roles: ['admin'] },
    { id: 'settings', title: 'Settings', route: '/admin/settings', icon: '⚙️', roles: ['admin'] },
    { id: 'financial-years', title: 'Financial Years', route: '/admin/settings/financial-years', icon: '📅', roles: ['admin'] },
    { id: 'pos', title: 'Salesman POS', route: '/salesman', icon: '📱', roles: ['admin', 'salesman'] },
    { id: 'kitchen', title: 'Kitchen Display', route: '/kitchen', icon: '👨‍🍳', roles: ['admin', 'kitchen', 'kitchen_staff'] },
    { id: 'menu', title: 'Customer Menu', route: '/menu', icon: '📖', roles: ['admin', 'salesman', 'customer', 'guest'] }
];

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();
    const { user } = useAuth();
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter commands based on role and search query
    const filteredCommands = ALL_COMMANDS.filter(cmd => {
        const userRole = user?.role || 'guest';
        const hasRole = cmd.roles.includes(userRole) || userRole === 'admin';
        const matchesQuery = cmd.title.toLowerCase().includes(query.toLowerCase()) || cmd.id.includes(query.toLowerCase());
        return hasRole && matchesQuery;
    });

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                setIsOpen(false);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands.length > 0) {
                    router.push(filteredCommands[selectedIndex].route);
                    setIsOpen(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex, router]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 9999,
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '10vh'
        }} onClick={() => setIsOpen(false)}>
            <div 
                style={{
                    backgroundColor: 'var(--bg-primary)',
                    width: '90%', maxWidth: '600px',
                    borderRadius: '8px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem', marginRight: '0.5rem', color: 'var(--text-secondary)' }}>🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search commands or pages..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{
                            width: '100%', border: 'none', background: 'transparent',
                            fontSize: '1.1rem', color: 'var(--text-primary)', outline: 'none'
                        }}
                    />
                    <kbd style={{ 
                        background: 'var(--bg-secondary)', padding: '0.2rem 0.4rem', 
                        borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' 
                    }}>ESC</kbd>
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0.5rem' }}>
                    {filteredCommands.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No results found.
                        </div>
                    ) : (
                        filteredCommands.map((cmd, index) => (
                            <div
                                key={cmd.id}
                                onClick={() => {
                                    router.push(cmd.route);
                                    setIsOpen(false);
                                }}
                                onMouseEnter={() => setSelectedIndex(index)}
                                style={{
                                    display: 'flex', alignItems: 'center', padding: '0.75rem 1rem',
                                    cursor: 'pointer', borderRadius: '6px',
                                    backgroundColor: index === selectedIndex ? 'var(--primary)' : 'transparent',
                                    color: index === selectedIndex ? 'white' : 'var(--text-primary)',
                                    transition: 'all 0.1s ease'
                                }}
                            >
                                <span style={{ marginRight: '1rem', fontSize: '1.2rem' }}>{cmd.icon}</span>
                                <span style={{ fontWeight: 500 }}>{cmd.title}</span>
                            </div>
                        ))
                    )}
                </div>
                
                <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
                    <span><kbd>Enter</kbd> to select</span>
                </div>
            </div>
        </div>
    );
}
