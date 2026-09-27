
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// We can reuse the query function from existing utils if available,
// but since I don't want to hunt for the exact path of the 'query' utility right now
// and I know how to use pg directly or I can try to import it if I saw it earlier.
// Wait, I saw `import { query } from '@/lib/db'` or similar in other files?
// Let's check `app/api/menu/[id]/route.ts` imports.
// It uses `const result = await query(...)`.
// I should use the existing db utility.
// Use `grep` to find where `query` is defined.
