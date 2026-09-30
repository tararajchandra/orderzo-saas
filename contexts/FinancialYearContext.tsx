'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface FinancialYear {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

interface FinancialYearContextType {
    financialYears: FinancialYear[];
    selectedFY: FinancialYear | null;
    setSelectedFY: (fy: FinancialYear) => void;
    isLoading: boolean;
}

const FinancialYearContext = createContext<FinancialYearContextType | undefined>(undefined);

export function FinancialYearProvider({ children }: { children: ReactNode }) {
    const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
    const [selectedFY, setSelectedFY] = useState<FinancialYear | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFinancialYears = async () => {
            try {
                const response = await fetch('/api/financial-years');
                const result = await response.json();
                
                if (result.success && result.data && result.data.length > 0) {
                    setFinancialYears(result.data);
                    
                    // Try to load previously selected FY from localStorage
                    const savedFYId = localStorage.getItem('selected_fy_id');
                    let defaultFY = null;
                    
                    if (savedFYId) {
                        defaultFY = result.data.find((fy: FinancialYear) => fy.id.toString() === savedFYId);
                    }
                    
                    // If no saved FY, fallback to the active one
                    if (!defaultFY) {
                        defaultFY = result.data.find((fy: FinancialYear) => fy.is_active);
                    }
                    
                    // Fallback to the first one if neither found
                    if (!defaultFY) {
                        defaultFY = result.data[0];
                    }
                    
                    setSelectedFY(defaultFY);
                }
            } catch (error) {
                console.error('Failed to fetch financial years:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFinancialYears();
    }, []);

    const handleSetSelectedFY = (fy: FinancialYear) => {
        setSelectedFY(fy);
        localStorage.setItem('selected_fy_id', fy.id.toString());
    };

    return (
        <FinancialYearContext.Provider 
            value={{ 
                financialYears, 
                selectedFY, 
                setSelectedFY: handleSetSelectedFY,
                isLoading 
            }}
        >
            {children}
        </FinancialYearContext.Provider>
    );
}

export function useFinancialYear() {
    const context = useContext(FinancialYearContext);
    if (context === undefined) {
        throw new Error('useFinancialYear must be used within a FinancialYearProvider');
    }
    return context;
}
