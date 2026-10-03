const fs = require('fs');
const path = require('path');

const globalsPath = path.join(__dirname, 'app/globals.css');
let globalsContent = fs.readFileSync(globalsPath, 'utf8');

if (!globalsContent.includes('select.input optgroup')) {
    globalsContent = globalsContent.replace(
        /select\.input option \{/g,
        'select.input optgroup {\n  background: var(--bg-secondary);\n  color: var(--primary);\n  font-weight: bold;\n  font-style: normal;\n}\n\nselect.input option {'
    );

    globalsContent = globalsContent.replace(
        /\[data-theme="dark"\] select\.input option \{/g,
        '[data-theme="dark"] select.input optgroup {\n  background: hsl(240, 12%, 12%);\n  color: var(--primary);\n}\n\n[data-theme="dark"] select.input option {'
    );

    globalsContent = globalsContent.replace(
        /\[data-theme="light"\] select\.input option \{/g,
        '[data-theme="light"] select.input optgroup {\n  background: hsl(0, 0%, 95%);\n  color: var(--primary);\n}\n\n[data-theme="light"] select.input option {'
    );

    globalsContent = globalsContent.replace(
        /\[data-theme="nature"\] select\.input option \{/g,
        '[data-theme="nature"] select.input optgroup {\n  background: hsl(150, 12%, 12%);\n  color: var(--primary);\n}\n\n[data-theme="nature"] select.input option {'
    );

    fs.writeFileSync(globalsPath, globalsContent);
    console.log('Patched globals.css for optgroup');
}
