const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') && !file.includes('dashboard')) results.push(file);
        }
    });
    return results;
}

const files = walk('app/admin');
let changed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let hasChanges = false;
    
    if (content.includes("fetch('/api/orders") || content.includes("fetch('/api/invoices") || content.includes("fetch('/api/expenses")) {
        
        if (!content.includes('useFinancialYear')) {
            content = content.replace(
                /import .*? from 'react';/,
                match => match + "\nimport { useFinancialYear } from '@/contexts/FinancialYearContext';"
            );
            
            if (!content.includes('useFinancialYear')) {
                content = content.replace(
                    /import .*?;/,
                    match => match + "\nimport { useFinancialYear } from '@/contexts/FinancialYearContext';"
                );
            }
            
            content = content.replace(
                /const \[loading, setLoading\] = useState\(true\);/,
                match => match + "\n    const { selectedFY } = useFinancialYear();"
            );
            
            content = content.replace(/fetch\('\/api\/orders'\)/g, 'fetch(`/api/orders?fy_id=${selectedFY?.id || \'\'}`)');
            content = content.replace(/fetch\('\/api\/orders\?(.*?)'\)/g, 'fetch(`/api/orders?$1&fy_id=${selectedFY?.id || \'\'}`)');
            
            content = content.replace(/fetch\('\/api\/invoices'\)/g, 'fetch(`/api/invoices?fy_id=${selectedFY?.id || \'\'}`)');
            content = content.replace(/fetch\('\/api\/invoices\?(.*?)'\)/g, 'fetch(`/api/invoices?$1&fy_id=${selectedFY?.id || \'\'}`)');
            
            content = content.replace(/fetch\('\/api\/expenses'\)/g, 'fetch(`/api/expenses?fy_id=${selectedFY?.id || \'\'}`)');
            content = content.replace(/fetch\('\/api\/expenses\?(.*?)'\)/g, 'fetch(`/api/expenses?$1&fy_id=${selectedFY?.id || \'\'}`)');
            
            content = content.replace(
                /fetchData\(\);\r?\n\s*\}, \[\]\);/g,
                'if(selectedFY) fetchData();\n    }, [selectedFY]);'
            );
            content = content.replace(
                /fetchOrders\(\);\r?\n\s*\}, \[\]\);/g,
                'if(selectedFY) fetchOrders();\n    }, [selectedFY]);'
            );
            content = content.replace(
                /loadData\(\);\r?\n\s*\}, \[\]\);/g,
                'if(selectedFY) loadData();\n    }, [selectedFY]);'
            );
            
            content = content.replace(
                /fetchData\(\);\r?\n\s*\}, \[dateFilter, paymentFilter\]\);/g,
                'if(selectedFY) fetchData();\n    }, [dateFilter, paymentFilter, selectedFY]);'
            );

            hasChanges = true;
        }
    }
    
    if (hasChanges) {
        fs.writeFileSync(file, content);
        changed++;
        console.log('Updated', file);
    }
});

console.log('Total files changed:', changed);
