const fs = require('fs');

let c = fs.readFileSync('src/components/OpportunityList.tsx', 'utf8');
c = c.replace(/setOpportunitys/g, 'setOpportunities');
c = c.replace(/\(opportunitys/g, '(opportunities');
fs.writeFileSync('src/components/OpportunityList.tsx', c, 'utf8');

console.log('Fixed grammar');
