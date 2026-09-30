import DutyTracker from '@/components/DutyTracker';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <DutyTracker />
            {children}
        </>
    );
}
