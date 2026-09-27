
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkTable() {
    try {
        const res = await pool.query("SELECT to_regclass('public.expenses');");
        console.log("Table exists:", res.rows[0].to_regclass);

        if (res.rows[0].to_regclass) {
            const columns = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'expenses';");
            console.log("Columns:", columns.rows);
        }
    } catch (err) {
        console.error("Error checking table:", err);
    } finally {
        await pool.end();
    }
}

checkTable();
