const fs = require('fs');
let content = fs.readFileSync('app/api/orders/route.ts', 'utf8');

content = content.replace(
    /const since = searchParams\.get\('since'\);/,
    `const since = searchParams.get('since');\n        const fy_id = searchParams.get('fy_id');`
);

content = content.replace(
    /let paramCount = 1;/,
    `let paramCount = 1;\n\n        if (fy_id) {\n            queryText += \` AND o.financial_year_id = $\${paramCount}\`;\n            params.push(fy_id);\n            paramCount++;\n        }`
);

fs.writeFileSync('app/api/orders/route.ts', content);
