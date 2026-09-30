'use client';

import { useFinancialYear } from '@/contexts/FinancialYearContext';

export default function FinancialYearSelector() {
    const { financialYears, selectedFY, setSelectedFY, isLoading } = useFinancialYear();

    if (isLoading || financialYears.length === 0) return null;

    return (
        <div className="fy-selector" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="fy-select" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                FY:
            </label>
            <select 
                id="fy-select"
                value={selectedFY?.id || ''} 
                onChange={(e) => {
                    const fy = financialYears.find(f => f.id.toString() === e.target.value);
                    if (fy) setSelectedFY(fy);
                }}
                style={{ 
                    padding: '0.3rem 0.5rem', 
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                }}
            >
                {financialYears.map((fy) => (
                    <option key={fy.id} value={fy.id}>
                        {fy.name} {fy.is_active ? '(Active)' : ''}
                    </option>
                ))}
            </select>
        </div>
    );
}
