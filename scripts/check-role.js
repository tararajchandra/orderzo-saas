const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const res = await client.query("SELECT role FROM users WHERE email = 'kitchen@test.com'");
    console.log(res.rows[0]);
    process.exit(0);
}
run();
