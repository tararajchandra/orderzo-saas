const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function testLogin() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL environment variable not set!');
        console.log('\nUsage:');
        console.log('export DATABASE_URL="postgresql://user:pass@host:port/db"');
        console.log('npm run test-login');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected!\n');

        // Check if admin user exists
        console.log('📝 Checking for admin user...');
        const result = await client.query(
            "SELECT id, email, name, role, password_hash FROM users WHERE email = 'admin@restaurant.com'"
        );

        if (result.rows.length === 0) {
            console.log('❌ Admin user NOT found!');
            console.log('\n💡 Solution: Run npm run create-admin');
            process.exit(1);
        }

        const user = result.rows[0];
        console.log('✅ Admin user found!');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Password hash: ${user.password_hash.substring(0, 20)}...`);

        // Test password
        console.log('\n🔐 Testing password "admin123"...');
        const testPassword = 'admin123';
        const isValid = await bcrypt.compare(testPassword, user.password_hash);

        if (isValid) {
            console.log('✅ Password is CORRECT!');
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('  Login should work with:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('  Email:    admin@restaurant.com');
            console.log('  Password: admin123');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            console.log('💡 If login still fails in the app:');
            console.log('   1. Check browser console for errors');
            console.log('   2. Check Railway logs for API errors');
            console.log('   3. Verify DATABASE_URL is set in Railway');
            console.log('   4. Make sure app is connected to the right database\n');
        } else {
            console.log('❌ Password is WRONG!');
            console.log('\n💡 Solution: Update password hash');
            console.log('   Run this SQL on Railway:');
            console.log('   UPDATE users');
            console.log("   SET password_hash = '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im'");
            console.log("   WHERE email = 'admin@restaurant.com';");
            console.log('\n   Or run: npm run create-admin\n');
        }

        // Check database connection variables
        console.log('\n📊 Database Connection Info:');
        const dbInfo = await client.query('SELECT current_database(), current_user, version()');
        console.log(`   Database: ${dbInfo.rows[0].current_database}`);
        console.log(`   User: ${dbInfo.rows[0].current_user}`);
        console.log(`   Version: ${dbInfo.rows[0].version.split(',')[0]}`);

        // Check all users
        console.log('\n👥 All users in database:');
        const allUsers = await client.query('SELECT id, email, name, role FROM users ORDER BY id');
        if (allUsers.rows.length === 0) {
            console.log('   No users found!');
        } else {
            allUsers.rows.forEach(u => {
                console.log(`   ${u.id}. ${u.email} (${u.name}) - ${u.role}`);
            });
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Database connection refused');
            console.log('   Check if DATABASE_URL is correct');
        } else if (error.code === '42P01') {
            console.log('\n💡 Table does not exist');
            console.log('   Run: npm run migrate');
        }

        process.exit(1);
    } finally {
        await client.end();
    }
}

console.log('═══════════════════════════════════════════════════');
console.log('  Login Diagnostic Tool');
console.log('  RuchiV2 Restaurant Management System');
console.log('═══════════════════════════════════════════════════\n');

testLogin();
