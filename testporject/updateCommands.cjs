const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const f of files) {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace CommandButton definition
  content = content.replace(
    /function CommandButton\(\{ icon, label \}: \{ icon: string, label: string \}\) \{/,
    'function CommandButton({ icon, label, onClick }: { icon: string, label: string, onClick?: () => void }) {'
  );
  
  content = content.replace(
    /<button className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 text-slate-700 text-\[13px\] rounded transition-colors whitespace-nowrap">/,
    '<button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-slate-100 text-slate-700 text-[13px] rounded transition-colors whitespace-nowrap">'
  );

  content = content.replace(
    /<button className="flex items-center gap-1.5 px-2 py-1.5 text-\[13px\] text-slate-700 hover:bg-slate-100 rounded transition-colors outline-none shrink-0 group">/,
    '<button onClick={onClick} className="flex items-center gap-1.5 px-2 py-1.5 text-[13px] text-slate-700 hover:bg-slate-100 rounded transition-colors outline-none shrink-0 group">'
  );

  // Inject handleCommand if not exists
  if (!content.includes('const handleCommand = (action: string) => {') && (f.includes('Detail') || f.includes('List'))) {
     let componentName = f.replace('.tsx', '');
     if (content.includes(`export default function ${componentName}`)) {
        let inserted = false;
        
        // Find the start of the component function
        const activeTabMatch = content.match(/const \[activeTab, setActiveTab\] = useState\([^)]+\);/);
        if (activeTabMatch) {
            content = content.replace(activeTabMatch[0], 
            `${activeTabMatch[0]}\n\n    const handleCommand = (action: string) => {\n        alert(\`\${action} successful!\`);\n    };\n`);
            inserted = true;
        } else if (content.includes('const [selectedIds, setSelectedIds]')) {
            const match = content.match(/const \[selectedIds, setSelectedIds\] = useState<number\[\]>\(\[\]\);/);
            if (match) {
                content = content.replace(match[0],
                `${match[0]}\n\n    const handleCommand = (action: string) => {\n        alert(\`\${action} successful!\`);\n    };\n`);
                inserted = true;
            }
        }
     }
  }

  // Update CommandButtons occurrences in the JSX
  // e.g. <CommandButton icon="save" label="Save" /> -> <CommandButton icon="save" label="Save" onClick={() => handleCommand('Save')} />
  content = content.replace(/<CommandButton icon="[^"]+" label="([^"]+)" \/>/g, '<CommandButton icon="$&" label="$1" onClick={() => handleCommand(\'$1\')} />'.replace('$&', '$`').replace(/<CommandButton icon="[^"]+" label="[^"]+" \/>/, ''));
  // The replace with backreferences like this is tricky, let's do it with a callback
  content = content.replace(/<CommandButton icon="([^"]+)" label="([^"]+)" \/>/g, (match, icon, label) => {
      return `<CommandButton icon="${icon}" label="${label}" onClick={() => handleCommand('${label}')} />`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log("Done");
