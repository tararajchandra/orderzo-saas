import DutyTracker from '@/components/DutyTracker';

export default function SalesmanLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <DutyTracker />
            {children}
        </>
    );
}
