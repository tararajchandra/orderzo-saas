// using native fetch
async function testMenuImages() {
    console.log('🧪 Testing Menu API and Images...\n');

    try {
        // 1. Fetch Menu
        console.log('1️⃣ Fetching /api/menu?available=true');
        const menuRes = await fetch('http://localhost:3000/api/menu?available=true');
        const menuData = await menuRes.json();

        console.log('   Status:', menuRes.status);
        if (!menuData.success) {
            console.error('   ❌ API failed:', menuData.error);
            return;
        }

        const items = menuData.data;
        console.log(`   Fetched ${items.length} items`);

        const itemsWithImage = items.filter(i => i.image_url);
        console.log(`   Items with image_url: ${itemsWithImage.length}`);

        if (itemsWithImage.length === 0) {
            console.log('   ❌ No items have image_url!');
            // Let's inspect one item to see what it has
            if (items.length > 0) {
                console.log('Sample item:', JSON.stringify(items[0], null, 2));
            }
            return;
        }

        console.log('   ✅ Menu API returns image_url\n');

        // 2. Fetch One Image
        const sampleItem = itemsWithImage[0];
        const imageUrl = `http://localhost:3000${sampleItem.image_url}`;
        console.log(`2️⃣ Fetching image for "${sampleItem.name}"`);
        console.log(`   URL: ${imageUrl}`);

        const imageRes = await fetch(imageUrl);
        console.log('   Status:', imageRes.status);
        console.log('   Content-Type:', imageRes.headers.get('content-type'));
        console.log('   Content-Length:', imageRes.headers.get('content-length'));

        if (imageRes.status === 200 && imageRes.headers.get('content-type')?.startsWith('image/')) {
            console.log('   ✅ Image fetched successfully!');
        } else {
            console.log('   ❌ Failed to fetch image.');
            const text = await imageRes.text();
            console.log('   Response preview:', text.substring(0, 100));
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testMenuImages();
