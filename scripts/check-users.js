const { Client } = require('pg');

async function checkUsers() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL environment variable not set!');
        console.log('\nUsage:');
        console.log('1. Get your DATABASE_URL from Railway:');
        console.log('   Railway → PostgreSQL → Connect → Copy DATABASE_URL');
        console.log('2. Run:');
        console.log('   $env:DATABASE_URL="your_railway_database_url"');
        console.log('   node scripts/check-users.js');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔌 Connecting to Railway database...');
        await client.connect();
        console.log('✅ Connected!\n');

        // Check database info
        console.log('📊 Database Information:');
        const dbInfo = await client.query('SELECT current_database(), current_user');
        console.log(`   Database: ${dbInfo.rows[0].current_database}`);
        console.log(`   User: ${dbInfo.rows[0].current_user}\n`);

        // Check if users table exists
        console.log('🔍 Checking if users table exists...');
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('❌ Users table does NOT exist!');
            console.log('\n💡 Solution: Run database migration');
            console.log('   npm run migrate');
            process.exit(1);
        }

        console.log('✅ Users table exists!\n');

        // Get all users
        console.log('👥 Checking for users in database...');
        const result = await client.query(`
            SELECT id, email, name, role, 
                   LEFT(password_hash, 30) as hash_preview,
                   created_at
            FROM users 
            ORDER BY id
        `);

        if (result.rows.length === 0) {
            console.log('❌ NO USERS FOUND in the database!\n');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('  💡 SOLUTION: Create an admin user');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            console.log('Option 1: Run the create-admin script');
            console.log('  $env:DATABASE_URL="your_railway_url"');
            console.log('  npm run create-admin\n');
            console.log('Option 2: Run this SQL directly on Railway:');
            console.log('  Go to Railway → PostgreSQL → Data → Query\n');
            console.log('  INSERT INTO users (email, password_hash, name, role)');
            console.log('  VALUES (');
            console.log('    \'admin@restaurant.com\',');
            console.log('    \'$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im\',');
            console.log('    \'Admin\',');
            console.log('    \'admin\'');
            console.log('  );');
            console.log('\n  Then login with:');
            console.log('    Email: admin@restaurant.com');
            console.log('    Password: admin123');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        } else {
            console.log(`✅ Found ${result.rows.length} user(s):\n`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            result.rows.forEach((user, index) => {
                console.log(`\n${index + 1}. User ID: ${user.id}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Name: ${user.name}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Password Hash: ${user.hash_preview}...`);
                console.log(`   Created: ${user.created_at}`);
            });
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            // Check specifically for admin user
            const adminUser = result.rows.find(u => u.email === 'admin@restaurant.com');
            if (adminUser) {
                console.log('✅ Admin user exists!');
                console.log('\n   Login credentials:');
                console.log('   Email: admin@restaurant.com');
                console.log('   Password: admin123\n');

                // Verify password hash
                const correctHash = '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im';
                const fullHash = await client.query(
                    'SELECT password_hash FROM users WHERE email = $1',
                    ['admin@restaurant.com']
                );

                if (fullHash.rows[0].password_hash === correctHash) {
                    console.log('✅ Password hash is CORRECT!\n');
                    console.log('💡 If login still fails:');
                    console.log('   1. Check browser console (F12) for errors');
                    console.log('   2. Check Railway deployment logs');
                    console.log('   3. Verify app is using the correct DATABASE_URL');
                    console.log('   4. Try clearing browser cache/cookies\n');
                } else {
                    console.log('⚠️  Password hash is DIFFERENT!\n');
                    console.log('💡 To fix, run this SQL on Railway:');
                    console.log('   UPDATE users');
                    console.log('   SET password_hash = \'$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im\'');
                    console.log('   WHERE email = \'admin@restaurant.com\';\n');
                }
            } else {
                console.log('⚠️  No admin@restaurant.com user found!\n');
                console.log('💡 Create admin user with this SQL on Railway:');
                console.log('   INSERT INTO users (email, password_hash, name, role)');
                console.log('   VALUES (');
                console.log('     \'admin@restaurant.com\',');
                console.log('     \'$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im\',');
                console.log('     \'Admin\',');
                console.log('     \'admin\'');
                console.log('   );\n');
            }
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Database connection refused');
            console.log('   Check if DATABASE_URL is correct');
        } else if (error.code === '42P01') {
            console.log('\n💡 Table does not exist');
            console.log('   Run: npm run migrate');
        } else if (error.code === '42703') {
            console.log('\n💡 Column does not exist');
            console.log('   Your database schema might be outdated');
            console.log('   Run: npm run migrate');
        }

        console.log('\nFull error details:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Disconnected from database');
    }
}

console.log('═══════════════════════════════════════════════════');
console.log('  Railway Database User Checker');
console.log('  RuchiV2 Restaurant Management System');
console.log('═══════════════════════════════════════════════════\n');

checkUsers();
