/**
 * Test Order Creation API
 * This script will test the /api/orders endpoint and show the exact error
 */

async function testOrderCreation() {
    console.log('🧪 Testing Order Creation API...\n');

    const testOrder = {
        customer_name: "Test Customer",
        customer_phone: "1234567890",
        customer_address: null,
        order_type: "takeaway",
        items: [
            {
                menuItem: {
                    id: 1,
                    name: "Test Item",
                    price: 100,
                    gst_rate: 5
                },
                quantity: 2
            }
        ],
        subtotal: 200,
        tax: 10,
        discount: 20,
        delivery_location_id: null,
        delivery_charge: 0,
        total_amount: 190,
        payment_method: "cash",
        notes: null,
        table_number: null,
        order_status: "pending",
        payment_status: "pending"
    };

    try {
        console.log('📤 Sending request to http://localhost:3000/api/orders');
        console.log('📦 Payload:', JSON.stringify(testOrder, null, 2));
        console.log('\n⏳ Waiting for response...\n');

        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testOrder)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ SUCCESS! Order created successfully');
            console.log('📄 Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('❌ ERROR! Status:', response.status);
            console.log('📄 Response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.log('❌ FETCH ERROR:', error.message);
        console.log('\nFull error:', error);
    }
}

// Run the test
testOrderCreation();
