const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'api', 'orders', 'route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Insert getting FY logic before order number generation
const fyLogic = \
        // Get active financial year
        const fyResult = await client.query('SELECT id, name FROM financial_years WHERE is_active = true');
        let financial_year_id = null;
        let fy_name = '';
        if (fyResult.rows.length > 0) {
            financial_year_id = fyResult.rows[0].id;
            fy_name = fyResult.rows[0].name; // e.g., '2024-25'
        }

        // Generate daily sequential order number\;
content = content.replace('        // Generate daily sequential order number', fyLogic);

// 2. Add financial_year_id to orders insert
content = content.replace(
    /customer_lng, distance\)\\n\\s+VALUES \\(\\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\\\)/,
    'customer_lng, distance, financial_year_id)\\n           VALUES (, , , , , , , , , , , , , , , , , , , , , )'
);

content = content.replace(
    /customer_lat \\|\\| null, customer_lng \\|\\| null, distance \\|\\| null,\\n\\s+\\]/,
    'customer_lat || null, customer_lng || null, distance || null, financial_year_id,\\n                ]'
);

content = content.replace(
    /notes, table_number, order_status, payment_status\)\\n\\s+VALUES \\(\\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\, \\\\)/,
    'notes, table_number, order_status, payment_status, financial_year_id)\\n               VALUES (, , , , , , , , , , , , , , , , , , )'
);

content = content.replace(
    /notes \\|\\| null, table_number \\|\\| null, order_status \\|\\| 'pending', payment_status \\|\\| 'pending',\\n\\s+\\]/,
    'notes || null, table_number || null, order_status || \\'pending\\', payment_status || \\'pending\\', financial_year_id,\\n                    ]'
);

// 3. Update Invoice Generation
const invoiceLogic = \
              // Optimized invoice count query using FY
              let invoiceCount = 1;
              let invoiceNumber = '';
              
              if (financial_year_id && fy_name) {
                  const invoiceCountResult = await client.query(
                      \\\SELECT COUNT(*) as count FROM invoices 
                       WHERE financial_year_id = \\\, [financial_year_id]
                  );
                  invoiceCount = parseInt(invoiceCountResult.rows[0].count) + 1;
                  const shortFy = fy_name.replace('20', ''); // 2024-25 -> 24-25
                  invoiceNumber = \\\INV/\\\/\\\\\\;
              } else {
                  // Fallback
                  const invoiceDateStr = new Date().toISOString().split('T')[0];
                  const invoiceDate = invoiceDateStr.replace(/-/g, '');
                  const invoiceCountResult = await client.query(
                      \\\SELECT COUNT(*) as count FROM invoices 
                       WHERE generated_at >= CURRENT_DATE 
                       AND generated_at < (CURRENT_DATE + INTERVAL '1 day')\\\
                  );
                  invoiceCount = parseInt(invoiceCountResult.rows[0].count) + 1;
                  invoiceNumber = \\\INV-\\\-\\\\\\;
              }
\;

content = content.replace(
    /\\s+const invoiceDateStr = new Date\\(\\)\\.toISOString\\(\\)\\.split\\('T'\\)\\[0\\];[\\s\\S]*?invoiceNumber = \\\INV-\\\\\\$\\{invoiceDate\\}-\\\\\\$\\{String\\(invoiceCount\\)\\.padStart\\(4, '0'\\)\\}/\\\;/,
    invoiceLogic
);

// 4. Update Invoice insert query
content = content.replace(
    /INSERT INTO invoices \\(order_id, invoice_number, subtotal, tax, discount, total\\)\\n\\s+VALUES \\(\\, \\, \\, \\, \\, \\\\)/,
    'INSERT INTO invoices (order_id, invoice_number, subtotal, tax, discount, total, financial_year_id)\\n                   VALUES (, , , , , , )'
);
content = content.replace(
    /\\[order\\.id, invoiceNumber, subtotal, tax \\|\\| 0, discount \\|\\| 0, total_amount\\]/,
    '[order.id, invoiceNumber, subtotal, tax || 0, discount || 0, total_amount, financial_year_id]'
);

fs.writeFileSync(filePath, content);
console.log('Successfully updated routes.ts');
