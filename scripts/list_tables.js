const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const client = new Client({ connectionString: process.env.DATABASE_URL.trim() });
client.connect().then(() => {
    return client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
}).then(res => {
    console.log(res.rows.map(r => r.table_name).join(', '));
    client.end();
}).catch(console.error);
