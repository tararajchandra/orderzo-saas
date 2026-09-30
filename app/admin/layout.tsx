import DutyTracker from '@/components/DutyTracker';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <DutyTracker />
            {children}
        </>
    );
}
