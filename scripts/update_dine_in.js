const fs = require('fs');

let content = fs.readFileSync('app/dine-in-checkout/page.tsx', 'utf8');

const newSubmit = `    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!tableNumber) return;

        setLoading(true);

        const placeOrder = async (lat: number | null, lng: number | null) => {
            try {
                const orderData = {
                    user_id: user?.id,
                    customer_name: user?.name || 'Walk-in Customer',
                    customer_phone: user?.phone || 'N/A',
                    customer_address: null,
                    order_type: 'dine_in',
                    table_number: tableNumber,
                    items: cart.map(item => ({
                        menuItem: {
                            id: item.menuItem.id,
                            name: item.menuItem.name,
                            price: item.menuItem.price,
                            gst_rate: item.menuItem.gst_rate
                        },
                        quantity: item.quantity
                    })),
                    subtotal,
                    tax,
                    discount: 0,
                    delivery_location_id: null,
                    delivery_charge: 0,
                    total_amount: total,
                    payment_method: 'cash',
                    notes: formData.notes,
                    customer_lat: lat,
                    customer_lng: lng,
                    distance: null,
                };

                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData),
                });

                const data = await response.json();

                if (data.success) {
                    clearCart();
                    localStorage.removeItem('tableNumber');
                    router.push('/order-success');
                } else {
                    alert(data.error || 'Failed to place order');
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error placing order:', error);
                alert('An error occurred. Please try again.');
                setLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    placeOrder(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    alert('You must allow Location Access (GPS) to place a Dine-in table order.');
                    setLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
            setLoading(false);
        }
    };`;

content = content.replace(/const handleSubmit = async \([^)]+\) => \{[\s\S]*?catch \(error\) \{[\s\S]*?finally \{[\s\S]*?\}\n    \};/, newSubmit);

fs.writeFileSync('app/dine-in-checkout/page.tsx', content);
