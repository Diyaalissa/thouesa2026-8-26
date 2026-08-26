import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw, CheckCircle2, AlertCircle, Scan, Sparkles } from 'lucide-react';
import { Locale } from '../../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (token: string) => void;
  title?: string;
  locale?: Locale;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title,
  locale = 'ar',
}) => {
  const isAr = locale === 'ar';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Sample tokens for instant one-click testing
  const sampleTokens = [
    {
      name: isAr ? 'مانيفست رحلة الأردن ➔ الجزائر (RJ-511)' : 'Manifest Jordan ➔ Algeria (RJ-511)',
      token: 'THOUESA_SECURE_HMAC_v1:bWFuLTg4MDF8dXNyLXRyYXZlbGVyLTIwMnx1c3ItYWdlbnQtMzAzfDIuM3wxfDIwMjYtMDgtMjVUMTU6MzA6MDAuMDAwWg==:4A79BF10',
    },
    {
      name: isAr ? 'طرد إلكترونيات مفحوص (SEAL-AMM-98231)' : 'Sealed iPad Package (SEAL-AMM-98231)',
      token: 'THOUESA_SECURE_HMAC_v1:c2hpcC0xMDF8dXNyLXRyYXZlbGVyLTIwMnx1c3ItYWdlbnQtMzAzfDIuM3wxfDIwMjYtMDgtMjVUMTU6MzU6MDAuMDAwWg==:3C81EE02',
    },
  ];

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen) {
      setIsScanning(true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'environment' } })
          .then((mediaStream) => {
            stream = mediaStream;
            setHasCamera(true);
            setCameraError(null);
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
            }
          })
          .catch((err) => {
            console.warn('Camera access error (simulated scanner available):', err);
            setHasCamera(false);
            setCameraError(
              isAr
                ? 'تعذر الوصول المباشر لكاميرا المتصفح. يمكنك استخدام أزرار المحاكاة السريعة أو إدخال الرمز أدناه.'
                : 'Direct camera feed unavailable in current frame. You can use instant simulation presets or paste token.'
            );
          });
      } else {
        setHasCamera(false);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, isAr]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      onScanSuccess(manualToken.trim());
      onClose();
    }
  };

  const handleSampleSelect = (token: string) => {
    onScanSuccess(token);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden relative"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-brand-100 text-brand-600 mb-2">
            <Scan className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {title || (isAr ? 'ماسح رمز الاستلام والتسليم الميداني (QR Scanner)' : 'Field QR Handover Scanner')}
          </h3>
          <p className="text-xs text-slate-500">
            {isAr
              ? 'وجه الكاميرا نحو رمز QR الخاص بالمسافر أو الموظف لتوثيق العهدة اللوجستية'
              : 'Point camera at traveler or hub agent QR code to digitally authenticate custody'}
          </p>
        </div>

        {/* Video / Camera Box */}
        <div className="relative aspect-4/3 w-full bg-slate-950 rounded-xl overflow-hidden mb-4 border border-slate-800 flex items-center justify-center">
          {hasCamera ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {/* Scan Reticle */}
              <div className="absolute inset-0 border-2 border-emerald-500/80 rounded-xl m-10 pointer-events-none animate-pulse flex items-center justify-center">
                <div className="w-full h-0.5 bg-emerald-400/90 absolute top-1/2 shadow-lg shadow-emerald-500/50" />
              </div>
            </>
          ) : (
            <div className="text-center p-6 text-slate-300">
              <Camera className="w-10 h-10 mx-auto mb-2 text-slate-500" />
              <p className="text-xs text-slate-400 max-w-xs">{cameraError || (isAr ? 'الكاميرا جاهزة للعمل' : 'Camera ready')}</p>
            </div>
          )}
        </div>

        {/* Quick Simulation Presets */}
        <div className="mb-4 bg-brand-50/70 border border-brand-200 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-900 mb-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            <span>{isAr ? 'محاكاة المسح السريع للاختبار الفوري:' : 'Instant Scan Simulation Presets:'}</span>
          </div>
          <div className="space-y-1.5">
            {sampleTokens.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSampleSelect(item.token)}
                className="w-full text-right bg-white hover:bg-brand-500 hover:text-white text-slate-700 text-xs px-3 py-2 rounded-lg border border-brand-100 font-medium transition-colors flex items-center justify-between"
              >
                <span>{item.name}</span>
                <CheckCircle2 className="w-3.5 h-3.5 opacity-70 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Manual Token Input */}
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            {isAr ? 'أو أدخل الرمز المشفر يدوياً:' : 'Or enter cryptographic token manually:'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="THOUESA_SECURE_HMAC_v1:..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="submit"
              disabled={!manualToken.trim()}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
            >
              {isAr ? 'تحقق ومتابعة' : 'Verify'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
