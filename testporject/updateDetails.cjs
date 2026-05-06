const fs = require('fs');
const path = require('path');

const appContentMatch = fs.readFileSync('src/App.tsx', 'utf8');
let newAppContent = appContentMatch.replace(/<OpportunityDetail \/>/, "<OpportunityDetail onSave={() => setCurrentView('opportunities')} />");
newAppContent = newAppContent.replace(/<AccountDetail \/>/, "<AccountDetail onSave={() => setCurrentView('accounts')} />");
newAppContent = newAppContent.replace(/<ContactDetail \/>/, "<ContactDetail onSave={() => setCurrentView('contacts')} />");
newAppContent = newAppContent.replace(/<LeadDetail \/>/, "<LeadDetail onSave={() => setCurrentView('leads')} />");
newAppContent = newAppContent.replace(/<CompetitorDetail \/>/, "<CompetitorDetail onSave={() => setCurrentView('competitors')} />");
fs.writeFileSync('src/App.tsx', newAppContent, 'utf8');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Detail.tsx'));

for (const f of files) {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');

  // Update component signature
  const componentName = f.replace('.tsx', '');
  content = content.replace(
      new RegExp(`export default function ${componentName}\\(\\) \\{`),
      `export default function ${componentName}({ onSave }: { onSave?: () => void }) {`
  );

  // Update handleCommand
  const startIdx = content.indexOf('const handleCommand = (action: string) => {');
  if (startIdx !== -1) {
    const endIdx = content.indexOf('};', startIdx) + 2;
    const block = content.substring(startIdx, endIdx);
    
    const newBlock = `const handleCommand = (action: string) => {
        if (action === 'Save' && typeof onSave === 'function') {
            onSave();
        } else {
            alert(\`\${action} successful!\`);
        }
    };`;
    
    content = content.replace(block, newBlock);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log("Updated detail components and App.tsx");
