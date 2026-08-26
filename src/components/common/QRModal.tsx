import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, ShieldCheck, Copy, Check, Lock, Plane, Box } from 'lucide-react';
import { Locale } from '../../types';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  handoverToken: string;
  manifestCode?: string;
  flightNumber?: string;
  totalWeightKg?: number;
  packageCount?: number;
  locale?: Locale;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  onClose,
  title,
  handoverToken,
  manifestCode,
  flightNumber,
  totalWeightKg,
  packageCount,
  locale = 'ar',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const isAr = locale === 'ar';

  useEffect(() => {
    if (isOpen && canvasRef.current && handoverToken) {
      QRCode.toCanvas(
        canvasRef.current,
        handoverToken,
        {
          width: 260,
          margin: 2,
          color: {
            dark: '#0F172A',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [isOpen, handoverToken]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(handoverToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 overflow-hidden relative"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'رمز تسليم/استلام مشفر بتوقيع HMAC لتوثيق انتقال العهدة رقمياً'
              : 'HMAC-SHA256 Cryptographic Chain-of-Custody Handover Token'}
          </p>
        </div>

        {/* QR Code Canvas */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
          <canvas ref={canvasRef} className="rounded-lg shadow-xs" />
          <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold mt-3">
            <ShieldCheck className="w-4 h-4" />
            <span>{isAr ? 'توقيع مشفر صالح ومعتمد من منصة ثويسا' : 'Cryptographically Verified Signature'}</span>
          </div>
        </div>

        {/* Manifest & Flight Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-slate-100/70 p-3 rounded-lg text-xs text-slate-700 mb-4">
          {manifestCode && (
            <div>
              <span className="text-slate-400 block">{isAr ? 'رمز المانيفست' : 'Manifest Code'}</span>
              <span className="font-bold text-slate-900">{manifestCode}</span>
            </div>
          )}
          {flightNumber && (
            <div>
              <span className="text-slate-400 block">{isAr ? 'الرحلة' : 'Flight'}</span>
              <span className="font-bold text-brand-600 flex items-center gap-1">
                <Plane className="w-3 h-3" />
                {flightNumber}
              </span>
            </div>
          )}
          {totalWeightKg !== undefined && (
            <div>
              <span className="text-slate-400 block">{isAr ? 'الوزن / الطرود' : 'Weight / Pkgs'}</span>
              <span className="font-bold text-slate-900">
                {totalWeightKg} كغم ({packageCount || 1})
              </span>
            </div>
          )}
        </div>

        {/* Copy Raw Token */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={handoverToken}
            className="w-full bg-slate-50 border border-slate-200 text-slate-600 text-xs px-3 py-2 rounded-lg font-mono truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ الرمز' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
