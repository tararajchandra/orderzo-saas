const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/admin/qr-codes/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('import { getTableList }')) {
    content = content.replace(/import Link from "next\/link";/, 'import Link from "next/link";\nimport { getTableList } from "@/lib/utils";');
    fs.writeFileSync(filePath, content);
    console.log('Added missing import');
}
