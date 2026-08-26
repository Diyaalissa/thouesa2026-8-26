const fs = require('fs');
let code = fs.readFileSync('src/components/traveler/TripManager.tsx', 'utf8');

code = code.replace("import { safeFetchJson } from '../../lib/constants';", "");

const helper = `
const safeFetchJson = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};
`;

code = code.replace("const isAr = locale === 'ar';", helper + "\n  const isAr = locale === 'ar';");

fs.writeFileSync('src/components/traveler/TripManager.tsx', code);
