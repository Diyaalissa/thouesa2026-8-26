const fs = require('fs');
let code = fs.readFileSync('src/components/common/AuthModal.tsx', 'utf8');

const importStatement = `import { signInWithPopup } from 'firebase/auth';\nimport { doc, getDoc, setDoc } from 'firebase/firestore';\nimport { auth, db, googleProvider } from '../../lib/firebase';\n`;

code = code.replace(/import \{ SignUp \} from '.\/SignUp';/, importStatement + "import { SignUp } from './SignUp';");

const googleSignInLogic = `
  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      const appUser = {
        id: fbUser.uid,
        fullName: fbUser.displayName || 'Google User',
        email: fbUser.email || '',
        phone: fbUser.phoneNumber || '',
        role: 'SENDER' as UserRole,
        kycStatus: 'UNVERIFIED' as const,
        isActive: true,
        preferredLocale: locale,
        avatarUrl: fbUser.photoURL || undefined,
        createdAt: new Date().toISOString()
      };

      const res = await fetch('/api/auth/sync-firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: appUser })
      }).then(r => r.json());

      if (res.success && res.user) {
        // Save to Firestore for data persistence requirement
        await setDoc(doc(db, 'users', fbUser.uid), res.user, { merge: true });
        
        setSuccessMessage(isAr ? 'تم تسجيل الدخول بواسطة جوجل بنجاح!' : 'Google Sign-In successful!');
        setTimeout(() => {
          onLoginSuccess(res.user, res.wallet);
          onClose();
        }, 500);
      } else {
        setErrorMessage(isAr ? 'فشل تسجيل الدخول بواسطة جوجل' : 'Google Sign-In failed');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(isAr ? 'فشل تسجيل الدخول بواسطة جوجل' : 'Google Sign-In failed');
    } finally {
      setIsSubmitting(false);
    }
  };
`;

code = code.replace(/const handleSignInSubmit = async/, googleSignInLogic + "\n  const handleSignInSubmit = async");

const googleButton = `
            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>{isAr ? 'تسجيل الدخول بواسطة Google' : 'Sign in with Google'}</span>
              </button>
            </div>
`;

code = code.replace(/<\/form>\s*<\/div>\s*\)\}\s*\{\/\* 3\. EMPLOYEE LOGIN \*\/\}/s, "</form>\n" + googleButton + "\n          )}\n\n          {/* 3. EMPLOYEE LOGIN */}");
// Apply the same google button to the SignUp form footer.
code = code.replace(/<SignUp[\s\S]*?\/>/, (match) => {
  return match + "\n" + googleButton;
});


fs.writeFileSync('src/components/common/AuthModal.tsx', code);
