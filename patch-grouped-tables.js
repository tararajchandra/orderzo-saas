const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, 'lib/utils.ts');
let utilsContent = fs.readFileSync(utilsPath, 'utf8');

if (!utilsContent.includes('export function getGroupedTableList')) {
    utilsContent += `
export function getGroupedTableList(settings: any): { zone: string, tables: string[] }[] {
    if (!settings) return [];
  
    if (
      settings.tableZones &&
      typeof settings.tableZones === "string" &&
      settings.tableZones.trim() !== ""
    ) {
      try {
        const zones = settings.tableZones
          .split(",")
          .map((z: string) => z.trim())
          .filter(Boolean);
        const groups: { zone: string, tables: string[] }[] = [];
  
        zones.forEach((zone: string) => {
          const parts = zone.split(":");
          if (parts.length === 2) {
            const zoneName = parts[0].trim();
            const count = parseInt(parts[1].trim(), 10);
            if (!isNaN(count) && count > 0) {
              const tables = [];
              for (let i = 1; i <= count; i++) {
                tables.push(\`\${zoneName} \${i}\`);
              }
              groups.push({ zone: zoneName, tables });
            }
          }
        });
  
        if (groups.length > 0) return groups;
      } catch (e) {
        console.error("Error parsing table zones for groups:", e);
      }
    }
  
    // Fallback
    const total = parseInt(settings.totalTables || "16", 10);
    const tables = Array.from({ length: total }, (_, i) => (i + 1).toString());
    return [{ zone: "Main", tables }];
}
`;
    fs.writeFileSync(utilsPath, utilsContent);
    console.log('Added getGroupedTableList to utils.ts');
}
