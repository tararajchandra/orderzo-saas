const https = require('https');

console.log('🧪 Testing Railway Menu API\n');

const options = {
    hostname: 'ruchiv2-production.up.railway.app',
    path: '/api/menu?available=true',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    console.log('');

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Response:');
            console.log(`  Success: ${json.success}`);

            if (json.success && json.data) {
                console.log(`  Total Items: ${json.data.length}`);
                console.log(`  Items with images: ${json.data.filter(item => item.image_url).length}`);
                console.log('\nSample Items:');
                json.data.slice(0, 3).forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.name}`);
                    console.log(`     Category: ${item.category_name}`);
                    console.log(`     Price: ₹${item.price}`);
                    console.log(`     Has Image: ${item.image_url ? 'YES' : 'NO'}`);
                });
            } else {
                console.log('  Error:', json.error || 'Unknown error');
                console.log('  Full response:', JSON.stringify(json, null, 2));
            }
        } catch (error) {
            console.error('Error parsing response:', error.message);
            console.log('Raw response:', data.substring(0, 500));
        }
    });
});

req.on('error', (error) => {
    console.error('Request error:', error.message);
});

req.end();
