const fs = require('fs');
let code = fs.readFileSync('src/components/common/Header.tsx', 'utf8');

code = code.replace(/className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-200 overflow-hidden p-0\.5"/, 'className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-200 overflow-hidden p-0.5 shrink-0"');

fs.writeFileSync('src/components/common/Header.tsx', code);
