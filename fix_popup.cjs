const fs = require('fs');
let code = fs.readFileSync('src/components/common/AuthModal.tsx', 'utf8');

code = code.replace(/\} catch \(err\) \{\n\s*console\.error\(err\);\n\s*setErrorMessage\(isAr \? 'فشل تسجيل الدخول بواسطة جوجل' : 'Google Sign-In failed'\);\n\s*\}/, 
`} catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setErrorMessage(null);
      } else {
        setErrorMessage(isAr ? 'فشل تسجيل الدخول بواسطة جوجل' : 'Google Sign-In failed');
      }
    }`);

code = code.replace(/\} catch \(err\) \{\n\s*console\.error\(err\);\n\s*setErrorMessage\(isAr \? 'فشل إنشاء الحساب بواسطة جوجل' : 'Google Sign-Up failed'\);\n\s*\}/, 
`} catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setErrorMessage(null);
      } else {
        setErrorMessage(isAr ? 'فشل إنشاء الحساب بواسطة جوجل' : 'Google Sign-Up failed');
      }
    }`);

fs.writeFileSync('src/components/common/AuthModal.tsx', code);
