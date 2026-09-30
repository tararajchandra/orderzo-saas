'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function DutyTracker() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState<string>('loading');
    const [duration, setDuration] = useState<string>('00:00');
    const [settings, setSettings] = useState<any>(null);
    const [warning, setWarning] = useState<string | null>(null);

    const checkInTimeRef = useRef<Date | null>(null);
    const outOfBoundsTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (user && (user.role === 'salesman' || user.role === 'kitchen_staff' || user.role === 'kitchen' || user.role === 'cashier')) {
            fetchStatus();
        } else {
            setStatus('not_applicable');
        }
    }, [user]);

    const fetchStatus = async () => {
        try {
            const res = await fetch(`/api/attendance?userId=${user?.id}`);
            const data = await res.json();
            if (data.success) {
                if (data.data.status === 'not_checked_in') {
                    setStatus('not_checked_in');
                } else {
                    setStatus(data.data.attendance.status);
                    setSettings(data.data.settings);
                    if (data.data.attendance.check_in_time) {
                        checkInTimeRef.current = new Date(data.data.attendance.check_in_time);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Timer for active duty formatting
    useEffect(() => {
        if (!checkInTimeRef.current || status === 'checked_out' || status === 'not_applicable') return;
        
        const interval = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now.getTime() - checkInTimeRef.current!.getTime()) / 1000);
            const hrs = Math.floor(diff / 3600).toString().padStart(2, '0');
            const mins = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            setDuration(`${hrs}:${mins}`);
        }, 60000); // Update every minute
        
        // Initial set
        const diff = Math.floor((new Date().getTime() - checkInTimeRef.current!.getTime()) / 1000);
        const hrs = Math.floor(diff / 3600).toString().padStart(2, '0');
        const mins = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        setDuration(`${hrs}:${mins}`);

        return () => clearInterval(interval);
    }, [status]);

    // Background Geolocation Watcher
    useEffect(() => {
        if (status !== 'present' && status !== 'on_break') return;
        if (!settings || !settings.restaurant_lat) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const rLat = parseFloat(settings.restaurant_lat);
                const rLng = parseFloat(settings.restaurant_lng);
                const radius = parseFloat(settings.allowed_radius) || 50;

                const distance = getDistanceInMeters(latitude, longitude, rLat, rLng);

                if (distance > radius) {
                    setWarning(`You are outside the allowed radius (${Math.round(distance)}m). Return within 15 minutes or you will be automatically logged out!`);
                    
                    // Start auto-logoff timer if not started
                    if (!outOfBoundsTimerRef.current) {
                        outOfBoundsTimerRef.current = setTimeout(() => {
                            handleAction('check_out', true);
                        }, 15 * 60 * 1000); // 15 mins
                    }
                } else {
                    setWarning(null);
                    if (outOfBoundsTimerRef.current) {
                        clearTimeout(outOfBoundsTimerRef.current);
                        outOfBoundsTimerRef.current = null;
                    }
                }
            },
            (err) => {
                console.error('Watch position error:', err);
                setWarning('Please enable GPS Location. Auto-logoff will trigger if location is completely disabled.');
            },
            { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [status, settings]);

    const handleAction = async (action: string, isAuto = false) => {
        try {
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, action, isAuto })
            });
            const data = await res.json();
            if (data.success) {
                if (action === 'check_out') {
                    logout();
                    router.push('/login');
                } else {
                    fetchStatus();
                }
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (status === 'loading' || status === 'not_applicable') return null;

    if (status === 'not_checked_in' || status === 'checked_out') {
        return (
            <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', textAlign: 'center', fontWeight: 'bold' }}>
                You are currently logged in but not checked-in for attendance. Please relogin to mark attendance.
            </div>
        );
    }

    return (
        <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
            {warning && (
                <div style={{ background: '#fef08a', color: '#854d0e', padding: '0.5rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                    ⚠️ {warning}
                </div>
            )}
            <div style={{ 
                background: status === 'on_break' ? '#ffedd5' : '#dcfce7', 
                padding: '0.75rem 1.5rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                        width: 10, height: 10, borderRadius: '50%', 
                        background: status === 'on_break' ? '#f97316' : '#22c55e',
                        animation: status === 'present' ? 'pulse 2s infinite' : 'none'
                    }} />
                    <span style={{ fontWeight: 600, color: status === 'on_break' ? '#c2410c' : '#166534' }}>
                        {status === 'on_break' ? '☕ On Break' : '🟢 Duty Active'}
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>({duration} hrs)</span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {status === 'present' && (
                        <button 
                            onClick={() => handleAction('start_break')}
                            style={{ padding: '0.4rem 0.8rem', background: '#f97316', color: 'white', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                        >
                            Start Break
                        </button>
                    )}
                    {status === 'on_break' && (
                        <button 
                            onClick={() => handleAction('end_break')}
                            style={{ padding: '0.4rem 0.8rem', background: '#22c55e', color: 'white', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                        >
                            End Break
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            if(confirm('Are you sure you want to end your duty and log out?')) {
                                handleAction('check_out');
                            }
                        }}
                        style={{ padding: '0.4rem 0.8rem', background: '#ef4444', color: 'white', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                    >
                        End Duty (Check Out)
                    </button>
                </div>
            </div>
        </div>
    );
}
