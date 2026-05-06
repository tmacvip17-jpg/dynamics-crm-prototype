const fs = require('fs');
const path = require('path');
const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('List.tsx'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let c = fs.readFileSync(filePath, 'utf8');

  // Fix the missing bracket
  c = c.replace(/\} else \{\s*if \(action === 'Delete'\)/g, "} else if (action === 'Delete')");
  
  // Update background selection for TR
  // The varName is dynamically determined in the file by looking at array map
  const mapRegex = /\{([a-zA-Z]+)\.map\(\(([a-zA-Z]+),\s*i\)\s*=>\s*\(\s*<tr\s+key=\{[^\}]+\}\s+onClick=\{onSelect\}\s+className=\{`border-b border-slate-100 hover:bg-slate-50 cursor-pointer \$\{i % 2 !== 0 \? 'bg-slate-50\/50' : ''\} group`\}/g;
  
  c = c.replace(mapRegex, (match, arr, item) => {
    return `{${arr}.map((${item}, i) => (\n                            <tr key={${item}.id} onClick={onSelect} className={\`border-b border-slate-100 cursor-pointer \${selectedIds.includes(${item}.id) ? 'bg-blue-50/50 hover:bg-blue-50' : \`hover:bg-slate-50 \${i % 2 !== 0 ? 'bg-slate-50/50' : ''}\`} group\`}`;
  });

  fs.writeFileSync(filePath, c, 'utf8');
});
console.log("fixed missing bracket");
