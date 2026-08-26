const fs = require('fs');
let code = fs.readFileSync('src/components/common/AuthModal.tsx', 'utf8');

code = code.replace(/<SignUp[\s\S]*?\/>\n\s*<div className="pt-4 border-t border-slate-800">[\s\S]*?<\/div>/m, (match) => {
  return "<>\n" + match + "\n</>";
});

fs.writeFileSync('src/components/common/AuthModal.tsx', code);
