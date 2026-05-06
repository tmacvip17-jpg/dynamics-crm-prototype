const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('List.tsx'));

for (const f of files) {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the exact handleCommand block
  const startIdx = content.indexOf('const handleCommand = (action: string) => {');
  if (startIdx !== -1) {
    const endIdx = content.indexOf('};', startIdx) + 2;
    const block = content.substring(startIdx, endIdx);
    
    const newBlock = `const handleCommand = (action: string) => {
        if (action === 'New' && typeof onSelect === 'function') {
            onSelect();
        } else {
            alert(\`\${action} successful!\`);
        }
    };`;
    
    content = content.replace(block, newBlock);
    fs.writeFileSync(filePath, content, 'utf8');
  }
}
console.log("updated lists simply");
