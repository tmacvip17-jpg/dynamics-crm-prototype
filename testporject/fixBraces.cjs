const fs = require('fs');
const files = ['AccountList.tsx', 'CompetitorList.tsx', 'ContactList.tsx', 'Layout.tsx', 'LeadList.tsx', 'OpportunityList.tsx'];
for (const f of files) {
   let content = fs.readFileSync('src/components/' + f, 'utf8');
   content = content.replace(/\{\n    const handleCommand = \(action: string\) => \{\n        alert\(`\$\{action\} successful!`\);\n    \};\n([\s\S]*?)\}\) \{/, "{ $1 }) {\n    const handleCommand = (action: string) => {\n        alert(`\\${action} successful!`);\n    };\n");
   fs.writeFileSync('src/components/' + f, content, 'utf8');
}
console.log("Fixed");
