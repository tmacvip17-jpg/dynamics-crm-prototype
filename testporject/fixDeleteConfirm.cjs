const fs = require('fs');
const path = require('path');
const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('List.tsx'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let c = fs.readFileSync(filePath, 'utf8');

  // We want to replace the `else { set...; setSelectedIds([]); }` within the action === 'Delete'
  // with a window.confirm block
  
  c = c.replace(/\} else \{\s+(set[A-Za-z]+\([A-Za-z]+\.filter\(item => !selectedIds.includes\(item\.id\)\)\);\s+setSelectedIds\(\[\]\);\s+)\}/g, 
  "} else {\n                if (window.confirm('Are you sure you want to delete the selected items?')) {\n                    $1                }\n            }");

  fs.writeFileSync(filePath, c, 'utf8');
});
console.log("fixed delete confirmation");
