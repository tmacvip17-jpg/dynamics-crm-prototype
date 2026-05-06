const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const f of files) {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('const handleCommand =')) {
      const parts = content.split('export default function');
      if (parts.length > 1) {
          const functionBodyStart = parts[1].indexOf('{') + 1;
          const newContent = parts[0] + 'export default function' + parts[1].slice(0, functionBodyStart) + '\n    const handleCommand = (action: string) => {\n        alert(\`\${action} successful!\`);\n    };\n' + parts[1].slice(functionBodyStart);
          content = newContent;
      }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log("Fixed handleCommand generally");
