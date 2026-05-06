const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const getIcon = (label) => {
  const l = label.toLowerCase();
  if (l === 'new') return 'add';
  if (l === 'delete') return 'delete';
  if (l === 'refresh') return 'refresh';
  if (l.includes('excel')) return 'download';
  if (l.includes('email')) return 'mail';
  if (l === 'flow') return 'account_tree';
  if (l === 'share') return 'share';
  if (l === 'save') return 'save';
  if (l.includes('run report')) return 'assessment';
  if (l === 'export') return 'download';
  return 'star';
};

for (const f of files) {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the malformed CommandButtons
  content = content.replace(/<CommandButton icon="<CommandButton icon="" label="([^"]+)" onClick=\{\(\) => handleCommand\('([^']+)'\)\} \/>/g, (match, label1, label2) => {
      const icon = getIcon(label1);
      return `<CommandButton icon="${icon}" label="${label1}" onClick={() => handleCommand('${label1}')} />`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

console.log("Fixed files");
