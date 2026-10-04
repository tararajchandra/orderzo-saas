const fs = require('fs');
let content = fs.readFileSync('app/admin/tables/page.tsx', 'utf8');

// Replace handlePrintAllKOTs with handlePrintLatestKOT
content = content.replace(
  '  // Print all KOTs for a table sequentially\n  const handlePrintAllKOTs = async (tableNo: string) => {\n    const group = tableGroups[tableNo];\n    if (!group || group.orders.length === 0) return;\n    for (const order of group.orders) {\n      await handlePrintKOT(order);\n      // add a small delay between prints to allow printer buffer to process\n      await new Promise(resolve => setTimeout(resolve, 1000));\n    }\n  };',
  '  // Print only the latest KOT for a table\n  const handlePrintLatestKOT = async (tableNo: string) => {\n    const group = tableGroups[tableNo];\n    if (!group || group.orders.length === 0) return;\n    // Get the most recent order (highest ID)\n    const latestOrder = [...group.orders].sort((a: any, b: any) => b.id - a.id)[0];\n    await handlePrintKOT(latestOrder);\n  };'
);

// Replace button in context menu
content = content.replace(
  'handlePrintAllKOTs(contextMenu.tableNo);',
  'handlePrintLatestKOT(contextMenu.tableNo);'
);

content = content.replace(
  '🖨️ Print All KOTs',
  '🖨️ Print KOT'
);

fs.writeFileSync('app/admin/tables/page.tsx', content);
console.log("Patched latest KOT feature successfully!");
