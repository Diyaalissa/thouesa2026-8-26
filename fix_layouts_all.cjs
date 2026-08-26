const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let code = fs.readFileSync(fullPath, 'utf8');
      
      // Update grid-cols-2 and grid-cols-3 to be responsive
      code = code.replace(/grid grid-cols-2/g, 'grid grid-cols-1 md:grid-cols-2');
      code = code.replace(/grid grid-cols-3/g, 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3');
      code = code.replace(/grid grid-cols-4/g, 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4');

      // Replace sm:grid-cols-x with md:grid-cols-x
      code = code.replace(/sm:grid-cols-2/g, 'md:grid-cols-2 lg:grid-cols-2');
      code = code.replace(/sm:grid-cols-3/g, 'md:grid-cols-3 lg:grid-cols-3');
      code = code.replace(/sm:grid-cols-4/g, 'md:grid-cols-2 lg:grid-cols-4');
      
      // Replace sm:flex with md:flex (if appropriate, skip if it's already md:flex or lg:flex)
      code = code.replace(/sm:flex /g, 'md:flex ');
      
      // Replace non-responsive flex items-center justify-between with responsive ones
      code = code.replace(/className="flex items-center justify-between gap-4/g, 'className="flex flex-col md:flex-row md:items-center justify-between gap-4');
      code = code.replace(/className="flex items-center justify-between mb-6/g, 'className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6');

      fs.writeFileSync(fullPath, code);
    }
  }
}

processDir('src/components');
