import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Barcode, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Keyboard, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Product } from '../types';
import { sounds } from '../utils/audio';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onScanSuccess: (product: Product) => void;
  language: 'en' | 'kh';
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onScanSuccess,
  language
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = 'barcode-scanner-viewport';

  const isKh = language === 'kh';

  // Handle Barcode matching logic
  const handleBarcodeDetected = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    const matchedProduct = products.find(
      p => p.barcode.toLowerCase() === cleanCode.toLowerCase() ||
           p.id.toLowerCase() === cleanCode.toLowerCase() ||
           p.name.toLowerCase() === cleanCode.toLowerCase()
    );

    if (matchedProduct) {
      sounds.playBarcodeBeep();
      setScanMessage({
        text: `Found: ${matchedProduct.name} ($${matchedProduct.price.toFixed(2)}) - Added to Cart!`,
        type: 'success'
      });
      onScanSuccess(matchedProduct);
      setManualCode('');
      setTimeout(() => {
        setScanMessage(null);
      }, 3000);
    } else {
      setScanMessage({
        text: `Barcode "${cleanCode}" not found in product database.`,
        type: 'error'
      });
    }
  };

  // Listen to Global USB/Bluetooth Barcode Scanner keystrokes while modal is open
  useEffect(() => {
    if (!isOpen) return;

    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in manual text input
      if (document.activeElement?.tagName === 'INPUT') return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        barcodeBuffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.length > 2) {
          handleBarcodeDetected(barcodeBuffer);
          barcodeBuffer = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, products]);

  // Start Camera scanning
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let isMounted = true;

    const startCamera = async () => {
      try {
        setCameraError(null);
        const html5QrCode = new Html5Qrcode(scannerRegionId);
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 180 },
            aspectRatio: 1.333334,
          },
          (decodedText) => {
            if (isMounted) {
              handleBarcodeDetected(decodedText);
            }
          },
          () => {
            // Ignore frame scan failures
          }
        );
        if (isMounted) {
          setIsCameraActive(true);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setIsCameraActive(false);
          const errorMessage = err instanceof Error ? err.message : 'Camera permission not granted or camera not found.';
          setCameraError(errorMessage);
        }
      }
    };

    const timer = setTimeout(() => {
      startCamera();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
      } catch {
        // Safe catch
      }
      html5QrCodeRef.current = null;
      setIsCameraActive(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                {isKh ? 'ម៉ាស៊ីនស្កេនបាកូដ & QR Code' : 'Barcode & QR Scanner'}
              </h3>
              <p className="text-xs text-slate-400">
                {isKh ? 'ស្កេនជាមួយកាមេរ៉ា ឬឧបករណ៍បាញ់បាកូដ' : 'Real-time camera & USB scanner detection'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Status Message */}
          {scanMessage && (
            <div className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in ${
              scanMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {scanMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{scanMessage.text}</span>
            </div>
          )}

          {/* Camera Viewport Area */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] flex flex-col items-center justify-center border border-slate-800">
            <div id={scannerRegionId} className="w-full h-full" />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-60 h-40 border-2 border-dashed border-indigo-400/80 rounded-2xl relative flex items-center justify-center bg-indigo-500/5">
                {/* Laser animation bar */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-bounce shadow-md shadow-rose-500/50" />
                <span className="text-[11px] font-mono text-indigo-200 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                  Align Barcode Here
                </span>
              </div>
            </div>

            {/* Camera Error or Fallback */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 p-4 flex flex-col items-center justify-center text-center text-slate-300">
                <Camera className="w-10 h-10 text-slate-500 mb-2" />
                <p className="text-xs font-semibold text-slate-200 mb-1">
                  Camera Preview Unavailable
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mb-3">
                  Please grant camera permission in your browser or use manual barcode input / simulator below.
                </p>
              </div>
            )}
          </div>

          {/* Manual Barcode Input & USB reader hint */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-slate-500" />
                {isKh ? 'បញ្ចូលកូដ ឬបាញ់ពីម៉ាស៊ីនស្កេន' : 'Manual Code / USB Scanner Input'}
              </span>
              <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                <Volume2 className="w-3 h-3" /> Auto Beep Sound
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBarcodeDetected(manualCode);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Type or paste barcode (e.g. 885100000001)..."
                className="flex-1 text-xs font-mono font-bold px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Scan
              </button>
            </form>
          </div>

          {/* 1-Click Interactive Barcode Test Simulators */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                {isKh ? 'តេស្តស្កេនទំនិញគំរូ (Quick Test 1-Click)' : 'Quick Test Product Barcodes:'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {products.slice(0, 8).map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleBarcodeDetected(prod.barcode)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-[11px] font-medium transition-colors border border-slate-200/60 flex items-center gap-1.5 cursor-pointer"
                >
                  <Barcode className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold">{prod.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">({prod.barcode.slice(-4)})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Ready to receive hardware barcode input.</span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
          >
            {isKh ? 'បិទ' : 'Done / Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
