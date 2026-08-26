const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

if (!code.includes('documents?: Record<string,')) {
  code = code.replace(/ticketDocUrl\?: string;/, "ticketDocUrl?: string;\n  documents?: Record<string, { url: string; fileName: string; uploadedAt: string }>;");
  fs.writeFileSync('src/types/index.ts', code);
  console.log("Updated Trip interface");
}
