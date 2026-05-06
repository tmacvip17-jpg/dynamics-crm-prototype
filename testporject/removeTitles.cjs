const fs = require('fs');
const files = ['AccountDetail.tsx', 'CompetitorDetail.tsx', 'ContactDetail.tsx', 'LeadDetail.tsx', 'OpportunityDetail.tsx'];
for (const f of files) {
   let content = fs.readFileSync('src/components/' + f, 'utf8');
   content = content.replace(/<div className="text-\[13px\] text-slate-800 font-medium mr-4">.*?<\/div>\n\s*/, "");
   fs.writeFileSync('src/components/' + f, content, 'utf8');
}
console.log("Fixed titles");
