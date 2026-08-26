const fs = require('fs');
let code = fs.readFileSync('src/components/common/Header.tsx', 'utf8');

code = code.replace(
  /<div className="w-10 h-10 rounded-xl bg-gradient-to-br bg-white flex items-center justify-center shadow-sm border border-slate-200 overflow-hidden">[\s\S]*?<\/div>/m,
  `<div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-200 overflow-hidden p-0.5">
            <img src="/logo.png" alt="Thouesa" className="w-full h-full object-contain" />
          </div>`
);

fs.writeFileSync('src/components/common/Header.tsx', code);
