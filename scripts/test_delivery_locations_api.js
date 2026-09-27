// using native fetch

async function testDeliveryLocationAPI() {
    console.log('🧪 Testing Delivery Location API...\n');

    try {
        // Test 1: GET all locations
        console.log('1️⃣ Testing GET /api/admin/delivery-locations');
        const getResponse = await fetch('http://localhost:3000/api/admin/delivery-locations');
        const getData = await getResponse.json();
        console.log('   Status:', getResponse.status);
        console.log('   Success:', getData.success);
        console.log('   Locations found:', getData.data?.length || 0);
        console.log('   ✅ GET test passed\n');

        // Test 2: POST new location
        console.log('2️⃣ Testing POST /api/admin/delivery-locations');
        const testLocation = {
            location_name: `Test Location ${Date.now()}`,
            delivery_charge: 45.00,
            is_active: true
        };

        const postResponse = await fetch('http://localhost:3000/api/admin/delivery-locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testLocation)
        });

        const postData = await postResponse.json();
        console.log('   Status:', postResponse.status);
        console.log('   Success:', postData.success);
        console.log('   Message:', postData.message);

        if (postData.success) {
            console.log('   Created location:', postData.data.location_name);
            console.log('   ✅ POST test passed\n');

            // Test 3: DELETE the test location
            console.log('3️⃣ Testing DELETE /api/admin/delivery-locations/' + postData.data.id);
            const deleteResponse = await fetch(`http://localhost:3000/api/admin/delivery-locations/${postData.data.id}`, {
                method: 'DELETE'
            });

            const deleteData = await deleteResponse.json();
            console.log('   Status:', deleteResponse.status);
            console.log('   Success:', deleteData.success);
            console.log('   ✅ DELETE test passed\n');
        } else {
            console.log('   ❌ POST test failed:', postData.error);
        }

        console.log('✅ All tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run tests
testDeliveryLocationAPI();
