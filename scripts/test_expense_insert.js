
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testInsert() {
    try {
        const description = "Test Expense Script";
        const amount = 50.00;
        const category = "Expense";
        const date = new Date().toISOString().split('T')[0];
        const payment_method = "cash";
        const notes = "";
        const image_id = null;

        console.log("Attempting insert with:", { description, amount, category, date, payment_method, notes, image_id });

        const result = await pool.query(
            `INSERT INTO expenses (description, amount, category, date, payment_method, notes, receipt_image_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
            [description, amount, category, date, payment_method, notes, image_id]
        );

        console.log("Insert successful:", result.rows[0]);

    } catch (err) {
        console.error("Error inserting expense:", err);
    } finally {
        await pool.end();
    }
}

testInsert();
