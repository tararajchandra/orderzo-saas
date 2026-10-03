const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/admin/qr-codes/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
    /if \(data\.data\.restaurantName\) \{/g,
    'setSettings(data.data);\n          if (data.data.restaurantName) {'
);

fs.writeFileSync(filePath, content);
console.log('Fixed settings injection');
