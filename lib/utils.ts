export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    // metrics: 'en-IN' uses dd/mm/yyyy
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}
