const fs = require('fs');
let code = fs.readFileSync('src/components/common/Header.tsx', 'utf8');

code = code.replace(/onOpenTopup\?: \(\) => void;/, "onOpenTopup?: () => void;\n  logoUrl?: string;");
code = code.replace(/export const Header: React\.FC<HeaderProps> = \(\{/, "export const Header: React.FC<HeaderProps> = ({\n  logoUrl,");
code = code.replace(/<img src="\/logo\.png"/, '<img src={logoUrl || "/logo.png"}');

fs.writeFileSync('src/components/common/Header.tsx', code);
