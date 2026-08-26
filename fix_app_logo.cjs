const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/<Header/, '<Header\n        logoUrl="https://www.gstatic.com/mobilesdk/250721_mobilesdk/mono_firebase_dark.svg"');

fs.writeFileSync('src/App.tsx', code);
