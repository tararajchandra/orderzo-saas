// Test script to verify export API functionality
// Run with: node scripts/test_export_api.js

const http = require('http');

async function testExport(type, format = 'json') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/api/admin/data-management/export?type=${type}&format=${format}`,
            method: 'GET',
        };

        console.log(`\n🧪 Testing export: ${type} (${format})`);
        console.log(`URL: http://${options.hostname}:${options.port}${options.path}`);

        const req = http.request(options, (res) => {
            console.log(`Status Code: ${res.statusCode}`);
            console.log(`Headers:`, res.headers);

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ Success! Data length: ${data.length} bytes`);
                    if (format === 'json' && data.length < 500) {
                        console.log('Sample data:', data.substring(0, 200));
                    }
                    resolve({ success: true, length: data.length });
                } else {
                    console.log(`❌ Failed! Response:`, data);
                    resolve({ success: false, error: data });
                }
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Request error:`, error.message);
            reject(error);
        });

        req.end();
    });
}

async function runTests() {
    console.log('🚀 Starting Export API Tests\n');
    console.log('='.repeat(50));

    const tests = [
        { type: 'menu_items', format: 'json' },
        { type: 'menu_items', format: 'csv' },
        { type: 'categories', format: 'json' },
        { type: 'delivery_locations', format: 'json' },
        { type: 'users', format: 'json' },
        { type: 'orders', format: 'json' },
    ];

    for (const test of tests) {
        try {
            await testExport(test.type, test.format);
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait between tests
        } catch (error) {
            console.error(`Test failed:`, error.message);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
}

runTests().catch(console.error);
