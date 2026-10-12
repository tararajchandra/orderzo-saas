'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('open-keyboard-shortcuts', handleOpenEvent);

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // F1: Open Shortcuts Guide
      if (e.key === 'F1') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // F2 or Alt + T: Go to Active Tables
      if (e.key === 'F2' || (e.altKey && (e.key === 't' || e.key === 'T'))) {
        e.preventDefault();
        router.push('/admin/tables');
        return;
      }

      // F3 or Alt + O: Go to Orders
      if (e.key === 'F3' || (e.altKey && (e.key === 'o' || e.key === 'O'))) {
        e.preventDefault();
        router.push('/admin/orders');
        return;
      }

      // F4 or Alt + N: Create New Order
      if (e.key === 'F4' || (e.altKey && (e.key === 'n' || e.key === 'N'))) {
        e.preventDefault();
        router.push('/admin/orders/create');
        return;
      }

      // Alt + Q: Quick Bill
      if (e.altKey && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        router.push('/admin/quick-bill');
        return;
      }

      // Alt + D: Dashboard
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        router.push('/admin/dashboard');
        return;
      }

      // '?' when not in an input
      if (!isInput && e.key === '?') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      // Escape to close guide modal
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-keyboard-shortcuts', handleOpenEvent);
    };
  }, [router, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => setIsOpen(false)}
      style={{ zIndex: 999999 }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '620px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
        }}
      >
        <div
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⌨️</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                Keyboard Shortcuts (শর্টকাট কি)
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                মাউস ছাড়াই খুব দ্রুত কাজ করার শর্টকাট তালিকা
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setIsOpen(false)}
            style={{ padding: '0.3rem 0.6rem', fontSize: '1.2rem' }}
          >
            ✕
          </button>
        </div>

        <div
          className="modal-body"
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Global Navigation Section */}
          <div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.6rem',
              }}
            >
              🌐 Global Navigation (যে কোনো পেজ থেকে)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontWeight: 500 }}>Active Tables (টেবিল পেজ)</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <kbd className="kbd">Alt + T</kbd>
                  <kbd className="kbd">F2</kbd>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontWeight: 500 }}>Order Management (অর্ডার পেজ)</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <kbd className="kbd">Alt + O</kbd>
                  <kbd className="kbd">F3</kbd>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontWeight: 500 }}>Create New Order (নতুন অর্ডার)</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <kbd className="kbd">Alt + N</kbd>
                  <kbd className="kbd">F4</kbd>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontWeight: 500 }}>Quick Bill (কুইক বিলিং)</span>
                <kbd className="kbd">Alt + Q</kbd>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontWeight: 500 }}>Command Palette / Search</span>
                <kbd className="kbd">Ctrl + K</kbd>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span style={{ fontWeight: 500 }}>Shortcuts Help (এই তালিকা)</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <kbd className="kbd">F1</kbd>
                  <kbd className="kbd">?</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Active Tables Specific */}
          <div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#3b82f6',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.6rem',
              }}
            >
              🍽️ Active Tables Page (টেবিল পেজে)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>Select Table 1 - 9 (টেবিল নম্বর ওপেন)</span>
                <kbd className="kbd">1 - 9</kbd>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>⚡ Auto Settle (টেবিল সেটেলমেন্ট পপআপ)</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <kbd className="kbd">Enter</kbd>
                  <kbd className="kbd">S</kbd>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>🖨️ Print Draft Bill (ড্রাফট বিল প্রিন্ট)</span>
                <kbd className="kbd">P</kbd>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>✏️ Edit Items (অর্ডারের আইটেম এডিট)</span>
                <kbd className="kbd">E</kbd>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>🖨️ Print All KOTs (কিচেন স্লিপ প্রিন্ট)</span>
                <kbd className="kbd">K</kbd>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>Close Table Panel / Cancel (প্যানেল বন্ধ করুন)</span>
                <kbd className="kbd">Esc</kbd>
              </div>
            </div>
          </div>

          {/* Settle Modal Specific */}
          <div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#10b981',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.6rem',
              }}
            >
              ⚡ Settle Table Modal (সেটেলমেন্ট পপআপে)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>Switch Payment Mode (পেমেন্ট মোড পরিবর্তন)</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <kbd className="kbd">1 (Cash)</kbd>
                  <kbd className="kbd">2 (UPI)</kbd>
                  <kbd className="kbd">3 (Split)</kbd>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>💾 Save & Print Bill (সেভ ও বিল প্রিন্ট)</span>
                <kbd className="kbd">Enter</kbd>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>Close Modal (পপআপ বন্ধ করুন)</span>
                <kbd className="kbd">Esc</kbd>
              </div>
            </div>
          </div>

          {/* Orders Page Specific */}
          <div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#f59e0b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '0.6rem',
              }}
            >
              📋 Order Management Page (অর্ডার পেজে)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>Create New Order (নতুন অর্ডার)</span>
                <kbd className="kbd">N</kbd>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>Focus Search Bar (অর্ডার খোঁজা)</span>
                <kbd className="kbd">/</kbd>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  background: 'var(--glass-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <span>Refresh Orders (রিফ্রেশ)</span>
                <kbd className="kbd">R</kbd>
              </div>
            </div>
          </div>
        </div>

        <div
          className="modal-footer"
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsOpen(false)}
            style={{ width: '100%', fontWeight: 700 }}
          >
            Got It! (বুঝেছি)
          </button>
        </div>
      </div>
    </div>
  );
}
