const fs = require('fs');
const path = require('path');
const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('List.tsx'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let c = fs.readFileSync(filePath, 'utf8');
  
  if (!c.includes('useState')) {
    c = c.replace("import React from 'react';", "import React, { useState } from 'react';");
  }

  const dataMatch = c.match(/const ([a-zA-Z]+) = \[\s*\{/);
  if (dataMatch) {
    const varName = dataMatch[1];
    
    const initMatch = c.match(new RegExp(`const ${varName} = \\[(\\s|.)*?\\];`));
    if (initMatch) {
      const CapitalizedName = varName.charAt(0).toUpperCase() + varName.slice(1);
      const replacement = `const initial${CapitalizedName} = ${initMatch[0].replace(new RegExp(`const ${varName} = `), '').replace(/;$/, '')};\n    const [${varName}, set${CapitalizedName}] = useState(initial${CapitalizedName});\n    const [selectedIds, setSelectedIds] = useState<number[]>([]);`;
      c = c.replace(initMatch[0], replacement);
    }

    const cmdRegex = /const handleCommand = \(action: string\) => \{([\s\S]*?\} else \{)([\s\S]*?)alert\(`\$\{action\} successful!`\);([\s\S]*?)\}\s*\};/;
    c = c.replace(cmdRegex, (match, p1, p2, p3) => {
      const setter = `set${varName.charAt(0).toUpperCase() + varName.slice(1)}`;
      return `const handleCommand = (action: string) => {${p1}
        if (action === 'Delete') {
            if (selectedIds.length === 0) {
                alert('Please select at least one item to delete.');
            } else {
                ${setter}(${varName}.filter(item => !selectedIds.includes(item.id)));
                setSelectedIds([]);
            }
        } else {
            alert(\`\${action} successful!\`);
        }${p3}
    };`;
    });

    const checkAllRegex = /<th className="py-2.5 pl-4 pr-2 w-10 font-normal"><span className="material-symbols-outlined text-\[18px\] text-slate-400">check_box_outline_blank<\/span><\/th>/;
    const allCheckedCond = `${varName}.length > 0 && selectedIds.length === ${varName}.length`;
    c = c.replace(checkAllRegex, 
        `<th className="py-2.5 pl-4 pr-2 w-10 font-normal cursor-pointer" onClick={() => setSelectedIds(${allCheckedCond} ? [] : ${varName}.map(item => item.id))}>
            <span className={\`material-symbols-outlined text-[18px] \${${allCheckedCond} ? 'text-[#0072c6]' : 'text-slate-400'}\`}>
                {${allCheckedCond} ? 'check_box' : 'check_box_outline_blank'}
            </span>
        </th>`
    );

    const trowRegex = /<tr key=\{([a-zA-Z]+)\.id\}([^>]*)>(\s*)<td className="py-3 pl-4 pr-2"><span className="material-symbols-outlined text-\[18px\] text-slate-300 group-hover:text-slate-400">check_box_outline_blank<\/span><\/td>/s;
    
    // Instead of replacing just the td, we also want to update the tr className for background changes... it's a bit harder.
    // The existing row looks like:
    // <tr key={opp.id} onClick={onSelect} className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${i % 2 !== 0 ? 'bg-slate-50/50' : ''} group`}>
    // let's just make the td replacement first:
    c = c.replace(trowRegex, (match, itemVar, attrs, leading) => {
      const isCheckedCond = `selectedIds.includes(${itemVar}.id)`;
      return `<tr key={${itemVar}.id}${attrs}>${leading}<td className="py-3 pl-4 pr-2" onClick={(e) => { e.stopPropagation(); setSelectedIds(prev => prev.includes(${itemVar}.id) ? prev.filter(id => id !== ${itemVar}.id) : [...prev, ${itemVar}.id]); }}>
            <span className={\`material-symbols-outlined text-[18px] cursor-pointer \${${isCheckedCond} ? 'text-[#0072c6]' : 'text-slate-300 group-hover:text-slate-400'}\`}>
                {${isCheckedCond} ? 'check_box' : 'check_box_outline_blank'}
            </span>
        </td>`;
    });

    // To add the selected background state, we find `className={\`border-b ` and modify it
    c = c.replace(/className={`border-b([^`]*)`}/g, (match, classes) => {
      if (classes.includes('cursor-pointer')) {
        // extract the item variable name, well, it's mapped typically so we don't know the exact var inside.
        // The tr has `key={item.id}` so no easy way. We'll skip TR background for selection for now, unless we do it correctly.
        // Actually we can: `${selectedIds.includes(opp.id) ? 'bg-blue-50' : (i % 2 !== 0 ? 'bg-slate-50/50' : '')}` inside map. But variable name varies. Let's just keep the checkbox colored.
        return match;
      }
      return match;
    });

    fs.writeFileSync(filePath, c, 'utf8');
  }
});
console.log("updated");
