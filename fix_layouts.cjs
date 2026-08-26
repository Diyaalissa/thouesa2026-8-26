const fs = require('fs');
const files = [
  'src/components/sender/SenderPortal.tsx',
  'src/components/traveler/TravelerPortal.tsx',
  'src/components/hub/HubPortal.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');

  // Replace sm:grid-cols-2 with md:grid-cols-2
  code = code.replace(/sm:grid-cols-2/g, 'md:grid-cols-2 lg:grid-cols-2');
  
  // Replace sm:grid-cols-3 with md:grid-cols-3
  code = code.replace(/sm:grid-cols-3/g, 'md:grid-cols-3 lg:grid-cols-3');
  
  // Replace sm:flex with md:flex
  code = code.replace(/sm:flex /g, 'md:flex ');
  
  // Update generic grid layout to be responsive
  code = code.replace(/grid grid-cols-2/g, 'grid grid-cols-1 md:grid-cols-2');
  code = code.replace(/grid grid-cols-3/g, 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3');
  code = code.replace(/grid grid-cols-4/g, 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4');
  
  // flex-col to md:flex-row patterns
  code = code.replace(/className="flex items-center justify-between gap-4/g, 'className="flex flex-col md:flex-row md:items-center justify-between gap-4');
  code = code.replace(/className="flex items-center justify-between mb-6/g, 'className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6');
  
  // Ensure we don't break existing good layouts
  
  fs.writeFileSync(file, code);
}
