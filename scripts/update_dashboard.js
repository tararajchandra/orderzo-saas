const fs = require('fs');
let content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

if (!content.includes('useFinancialYear')) {
    content = content.replace(
        "import { formatDate } from '@/lib/utils';",
        "import { formatDate } from '@/lib/utils';\nimport { useFinancialYear } from '@/contexts/FinancialYearContext';"
    );
    
    content = content.replace(
        "const [loading, setLoading] = useState(true);",
        "const [loading, setLoading] = useState(true);\n    const { selectedFY } = useFinancialYear();"
    );

    content = content.replace(
        "fetchDashboardData();\n    }, []); // Empty dependency - only run on mount",
        "if (selectedFY) {\n            fetchDashboardData();\n        }\n    }, [selectedFY]); // Run when selectedFY changes"
    );

    content = content.replace(
        "const response = await fetch('/api/orders', { cache: 'no-store' });",
        "const url = selectedFY ? \/api/orders?fy_id=\\ : '/api/orders';\n            const response = await fetch(url, { cache: 'no-store' });"
    );

    fs.writeFileSync('app/admin/dashboard/page.tsx', content);
    console.log('Dashboard updated');
}
