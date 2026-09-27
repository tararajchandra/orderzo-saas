const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL environment variable not set!');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Hash the password
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('🔐 Password hashed successfully');

        // Check if admin already exists
        const checkResult = await client.query(
            "SELECT id, email FROM users WHERE email = 'admin@restaurant.com'"
        );

        if (checkResult.rows.length > 0) {
            console.log('\n⚠️  Admin user already exists!');
            console.log('   Updating password...\n');

            // Update existing admin password
            await client.query(
                'UPDATE users SET password_hash = $1 WHERE email = $2',
                [hashedPassword, 'admin@restaurant.com']
            );

            console.log('✅ Admin password updated successfully!');
        } else {
            console.log('\n📝 Creating new admin user...\n');

            // Create new admin user
            await client.query(
                `INSERT INTO users (email, password_hash, name, role, is_active) 
                 VALUES ($1, $2, $3, $4, $5)`,
                ['admin@restaurant.com', hashedPassword, 'Admin', 'admin', true]
            );

            console.log('✅ Admin user created successfully!');
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Admin Credentials');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('  Email:    admin@restaurant.com');
        console.log('  Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n⚠️  Remember to change this password after first login!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

console.log('═══════════════════════════════════════════════════');
console.log('  Create/Update Admin User');
console.log('  RuchiV2 Restaurant Management System');
console.log('═══════════════════════════════════════════════════\n');

createAdminUser();
