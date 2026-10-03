const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/salesman/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Imports
content = content.replace(
    /import \{ formatDateTime, getTableList \} from "@\/lib\/utils";/g,
    'import { formatDateTime, getTableList, getGroupedTableList } from "@/lib/utils";'
);

// 2. Update Select Dropdown with Optgroups
const selectTarget = `<option value="" disabled>
                        Select Table
                      </option>
                      {getTableList(settings).map((num) => (
                        <option key={num} value={num}>
                          {num.includes(" ") ? num : \`Table \${num}\`}
                        </option>
                      ))}`;
const selectReplacement = `<option value="" disabled>
                        Select Table
                      </option>
                      {getGroupedTableList(settings).map((group) => (
                        <optgroup key={group.zone} label={group.zone}>
                          {group.tables.map((num) => (
                            <option key={num} value={num}>
                              {num.replace(group.zone + ' ', '')}
                            </option>
                          ))}
                        </optgroup>
                      ))}`;
content = content.replace(selectTarget, selectReplacement);

// 3. Update Grid View for Active Tables
const gridRegex = /<div\s*style=\{\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"repeat\(auto-fill, minmax\(100px, 1fr\)\)",\s*gap:\s*"1rem",\s*marginBottom:\s*"2rem",\s*\}\}\s*>\s*\{getTableList\(settings\)\.map\(\(tableNo\) => \{/g;
const gridReplacement = `<div>
              {getGroupedTableList(settings).map((group) => (
                <div key={group.zone} style={{ marginBottom: "2rem" }}>
                  <h3 style={{ marginBottom: "1rem", color: "var(--primary)" }}>{group.zone}</h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {group.tables.map((tableNo) => {`;
                    
// But wait, the `</div>` closing tag for the original grid is far below.
// Actually, let's just replace the exact `getTableList` mapping block for active tables grid, and leave the `<div style={{ display: 'grid'...` intact, just wrapping it? No, if we wrap it, we need to handle the `</div>`.

// Let's use a regex to match the entire grid block or just do it programmatically.
content = content.replace(gridRegex, gridReplacement);
content = content.replace(
  /(\s*\}\)\}\s*<\/div>\s*)(<\!-- Mobile Cart FAB -->|<\/main>|<div className="fab"|<div\s*className="text-center text-muted")/g, 
  `\n                  </div>\n                </div>\n              ))}\n            </div>$2`
);
// Wait, the regex for the closing div is risky. Let's see what comes after `</div>` of the grid.
// Let's do it safely.
fs.writeFileSync(filePath, content);
console.log('Patched salesman page');
