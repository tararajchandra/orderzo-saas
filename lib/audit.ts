import { query } from './db';

export async function logAction(
    userId: number | null, 
    action: string, 
    entityType: string | null = null, 
    entityId: string | null = null, 
    details: any = null
) {
    try {
        await query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
            [userId, action, entityType, entityId, details ? JSON.stringify(details) : null]
        );
    } catch (e) {
        console.error('Audit Log Error:', e);
    }
}
