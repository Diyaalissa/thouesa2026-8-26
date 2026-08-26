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
  code = code.replace(/grid grid-cols-3/g, 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3');
  code = code.replace(/grid grid-cols-4/g, 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4');
  
  // Flex layout fixes (ensure flex-col on mobile, flex-row on desktop)
  // Look for flex items-center justify-between without flex-wrap or flex-col
  // Let's manually replace some common patterns
  code = code.replace(/className="flex items-center justify-between( mb-\d+)?"/g, 'className="flex flex-col md:flex-row md:items-center justify-between gap-3$1"');
  code = code.replace(/className="flex items-center justify-between gap-(\d+)"/g, 'className="flex flex-col md:flex-row md:items-center justify-between gap-$1"');
  
  // Revert specific cases that don't need flex-col (like simple toggles or headers with icons)
  // Let's just do grid-cols replacements which are safer.
  
  fs.writeFileSync(file, code);
}
