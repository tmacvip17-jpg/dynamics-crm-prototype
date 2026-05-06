const fs = require('fs');
const path = require('path');
const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('List.tsx') || f.endsWith('Detail.tsx') || f === 'Dashboards.tsx');

files.forEach(f => {
  const filePath = path.join(dir, f);
  let c = fs.readFileSync(filePath, 'utf8');

  // Add imports if missing
  if (!c.includes('ConfirmationDialog')) {
      // Find last import
      const lastImportIdx = c.lastIndexOf("import ");
      const insertIdx = c.indexOf("\n", lastImportIdx) + 1;
      
      c = c.slice(0, insertIdx) + 
          "import ConfirmationDialog from './ConfirmationDialog';\nimport AlertDialog from './AlertDialog';\n" + 
          c.slice(insertIdx);
  }

  // Check if component has state
  const componentMatch = c.match(/export default function ([A-Za-z]+)\(/);
  if (componentMatch) {
      const isList = f.endsWith('List.tsx');
      
      // Inject states
      const stateHookSpot = c.indexOf("const handleCommand");
      if (stateHookSpot !== -1 && !c.includes('showConfirmDialog')) {
         const statesToInject = `
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showAlertDialog, setShowAlertDialog] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertTitle, setAlertTitle] = useState('Information');
`;
         c = c.slice(0, stateHookSpot) + statesToInject + c.slice(stateHookSpot);
      }

      // Handle Component Return
      const returnSpot = c.lastIndexOf("</div>\n    );\n}");
      if (returnSpot !== -1 && !c.includes('<ConfirmationDialog')) {
          let dialogs = `
            <ConfirmationDialog 
                isOpen={showConfirmDialog} 
                title="Confirm Delete" 
                message="Are you sure you want to delete the selected items?" 
                onConfirm={() => {
                    ${isList ? `set${componentMatch[1].replace('List', 's')}(${componentMatch[1].replace('List', 's').toLowerCase()}.filter(item => !selectedIds.includes(item.id)));\n                    setSelectedIds([]);` : ''}
                    setShowConfirmDialog(false);
                }}
                onCancel={() => setShowConfirmDialog(false)}
            />
            <AlertDialog 
                isOpen={showAlertDialog}
                title={alertTitle}
                message={alertMessage}
                onClose={() => setShowAlertDialog(false)}
            />`;
          
          c = c.slice(0, returnSpot) + dialogs + "\n        " + c.slice(returnSpot);
      }

      // Replace standard alert/confirm usages
      // 1. Alert for "Delete" no items selected
      c = c.replace(/alert\('Please select at least one item to delete.'\);/g, "setAlertTitle('Warning'); setAlertMessage('Please select at least one item to delete.'); setShowAlertDialog(true);");
      // 2. window.confirm
      c = c.replace(/if \(window.confirm\('Are you sure you want to delete the selected items\?'\)\) \{([\s\S]*?setSelectedIds\(\[\]\);\s*)\}/g, "setShowConfirmDialog(true);");
      // 3. Fallback alert for action success
      c = c.replace(/alert\(`\$\{action\} successful!`\);/g, "setAlertTitle('Action Failed'); setAlertMessage(`Action \"${action}\" is not fully implemented yet.`); setShowAlertDialog(true);");
      // Detail save alert
      c = c.replace(/alert\(.*\);/g, "setAlertTitle('Information'); setAlertMessage(`Action successful!`); setShowAlertDialog(true);");
      // Detail alert in else block
      // Just some general catches
  }


  fs.writeFileSync(filePath, c, 'utf8');
});
console.log("Dialogs injected");
