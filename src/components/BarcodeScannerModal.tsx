import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Barcode, 
  CheckCircle2, 
  AlertCircle, 
  Keyboard, 
  Sparkles,
  Volume2,
  ShoppingCart,
  Check,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Product } from '../types';
import { sounds } from '../utils/audio';

const SUPPORTED_SCAN_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onScanSuccess: (product: Product) => void;
  language: 'en' | 'kh';
  onOpenCartMobile?: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onScanSuccess,
  language,
  onOpenCartMobile
}) => {
  const [manualCode, setManualCode] = useState('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error'; product?: Product } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Option: Auto-add to cart on detection (Default true)
  const [autoAddToCart, setAutoAddToCart] = useState(true);
  // Option: Auto-close and jump straight to cart list on success
  const [autoCloseToCart, setAutoCloseToCart] = useState(false);
  // Last scanned item for immediate preview & feedback
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [recentScannedList, setRecentScannedList] = useState<{ product: Product; timestamp: number }[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = 'barcode-scanner-viewport';
  const isScanLockedRef = useRef<boolean>(false);
  const lastScannedCodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const isKh = language === 'kh';

  // Reset lock when modal opens
  useEffect(() => {
    if (isOpen) {
      isScanLockedRef.current = false;
      lastScannedCodeRef.current = { code: '', time: 0 };
    }
  }, [isOpen]);

  // Handle Barcode matching logic
  const handleBarcodeDetected = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    const now = Date.now();
    // Synchronous guard against x2 double scan
    if (isScanLockedRef.current) return;
    if (lastScannedCodeRef.current.code === cleanCode && now - lastScannedCodeRef.current.time < 2000) {
      return;
    }

    isScanLockedRef.current = true;
    lastScannedCodeRef.current = { code: cleanCode, time: now };

    const matchedProduct = products.find(
      p => p.barcode.toLowerCase() === cleanCode.toLowerCase() ||
           p.id.toLowerCase() === cleanCode.toLowerCase() ||
           p.name.toLowerCase() === cleanCode.toLowerCase()
    );

    if (matchedProduct) {
      sounds.playBarcodeBeep();
      setLastScannedProduct(matchedProduct);
      setRecentScannedList(prev => [{ product: matchedProduct, timestamp: Date.now() }, ...prev.slice(0, 4)]);

      setScanMessage({
        text: isKh 
          ? `បានរកឃើញ៖ "${matchedProduct.name}" ($${matchedProduct.price.toFixed(2)}) — បានបញ្ចូល +1 ក្នុងកន្ត្រកជោគជ័យ!` 
          : `Found: ${matchedProduct.name} ($${matchedProduct.price.toFixed(2)}) — Added +1 to cart!`,
        type: 'success',
        product: matchedProduct
      });

      // Execute Cart Add Callback exactly 1 time
      if (autoAddToCart) {
        onScanSuccess(matchedProduct);
      }

      setManualCode('');

      // Unlock after 1.8 seconds for smooth sequential item scanning
      setTimeout(() => {
        isScanLockedRef.current = false;
      }, 1800);

      if (autoCloseToCart) {
        setTimeout(() => {
          stopCamera();
          onClose();
          if (onOpenCartMobile) {
            onOpenCartMobile();
          }
        }, 500);
      } else {
        setTimeout(() => {
          setScanMessage(null);
        }, 3500);
      }
    } else {
      setScanMessage({
        text: isKh 
          ? `រកមិនឃើញបាកូដលេខ "${cleanCode}" ក្នុងបញ្ជីទំនិញទេ!` 
          : `Barcode "${cleanCode}" not found in product database.`,
        type: 'error'
      });
      setTimeout(() => {
        isScanLockedRef.current = false;
        setScanMessage(null);
      }, 2000);
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
  }, [isOpen, products, autoAddToCart, autoCloseToCart]);

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
        const html5QrCode = new Html5Qrcode(scannerRegionId, {
          formatsToSupport: SUPPORTED_SCAN_FORMATS,
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        });
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 20,
            disableFlip: false,
            videoConstraints: {
              facingMode: 'environment',
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
              focusMode: 'continuous',
              advanced: [{ focusMode: 'continuous' }] as any
            } as any
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
  }, [isOpen, autoAddToCart, autoCloseToCart]);

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
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Barcode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
                <span>{isKh ? 'ម៉ាស៊ីនស្កេនបាកូដ & QR Code' : 'Barcode & QR Scanner'}</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold border border-emerald-500/30">
                  {isKh ? 'ស្គាល់ស្វ័យប្រវត្តិ' : 'Auto Detect'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isKh ? 'ស្កេនទំនិញភ្លាមៗ បញ្ចូលទៅផ្ទាំងគិតលុយ (Cart)' : 'Scan barcode to automatically identify & add to cart list'}
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

        {/* Option Toggle Bar */}
        <div className="bg-indigo-900/90 px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2 border-b border-indigo-800 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-indigo-300" />
            <span className="font-medium">{isKh ? 'ជម្រើសស្កេន៖' : 'Scan Mode:'}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto Add Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={autoAddToCart}
                onChange={(e) => setAutoAddToCart(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-500 accent-indigo-500 cursor-pointer"
              />
              <span className="text-[11px] font-semibold flex items-center gap-1">
                <ShoppingCart className="w-3 h-3 text-indigo-300" />
                {isKh ? 'បញ្ចូលទៅកន្ត្រកភ្លាមៗ' : 'Auto Add to Cart'}
              </span>
            </label>

            {/* Auto Close Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={autoCloseToCart}
                onChange={(e) => setAutoCloseToCart(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-500 accent-indigo-500 cursor-pointer"
              />
              <span className="text-[11px] font-semibold flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-emerald-300" />
                {isKh ? 'ទៅកាន់ផ្ទាំងគិតលុយ' : 'Jump to Cart'}
              </span>
            </label>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[calc(85vh-160px)] overflow-y-auto">
          {/* Status Message Notification */}
          {scanMessage && (
            <div className={`p-3.5 rounded-2xl flex items-start gap-3 text-xs font-semibold animate-in fade-in slide-in-from-top-1 ${
              scanMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-xs'
                : 'bg-rose-50 text-rose-900 border border-rose-200 shadow-xs'
            }`}>
              {scanMessage.type === 'success' ? (
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="leading-snug">{scanMessage.text}</div>
                {scanMessage.product && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-emerald-700 bg-white/80 px-2 py-1 rounded-lg border border-emerald-100 w-fit font-mono">
                    <span>#{scanMessage.product.barcode}</span>
                    <span>•</span>
                    <span>Stock: {scanMessage.product.stock}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Camera Viewport Area */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] flex flex-col items-center justify-center border border-slate-800 shadow-inner">
            <div id={scannerRegionId} className="w-full h-full" />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-40 border-2 border-dashed border-indigo-400/80 rounded-2xl relative flex items-center justify-center bg-indigo-500/5 shadow-2xl">
                {/* Laser animation bar */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-bounce shadow-md shadow-rose-500/50" />
                <span className="text-[11px] font-mono text-indigo-100 bg-black/75 px-2.5 py-1 rounded-lg backdrop-blur-xs border border-white/10 flex items-center gap-1.5">
                  <Camera className="w-3 h-3 text-indigo-400" />
                  {isKh ? 'តម្រង់បាកូដក្នុងប្រអប់នេះ' : 'Align Barcode in Box'}
                </span>
              </div>
            </div>

            {/* Camera Error or Fallback */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/95 p-5 flex flex-col items-center justify-center text-center text-slate-300">
                <Camera className="w-10 h-10 text-slate-500 mb-2" />
                <p className="text-xs font-bold text-slate-200 mb-1">
                  {isKh ? 'កាមេរ៉ាមិនទាន់ដំណើរការ' : 'Camera Preview Unavailable'}
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mb-3 leading-relaxed">
                  {isKh 
                    ? 'សូមបើកសិទ្ធិប្រើប្រាស់ Camera ឬអាចវាយបញ្ចូលកូដ ឬប្រើម៉ាស៊ីនបាញ់ USB Barcode Scanner ខាងក្រោមបាន!' 
                    : 'Please allow camera permission in your browser or use USB scanner / manual code input below.'}
                </p>
              </div>
            )}
          </div>

          {/* Quick Scan Action / Manual Barcode Input */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-indigo-600" />
                {isKh ? 'បញ្ចូលបាកូដ ឬបាញ់ពីម៉ាស៊ីន Scanner' : 'Type Barcode or Use USB Scanner'}
              </span>
              <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
                <Volume2 className="w-3.5 h-3.5" /> Auto Beep Sound
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
                placeholder={isKh ? "បញ្ចូលលេខបាកូដ (ឧ. 885100000001)..." : "Type or paste barcode..."}
                className="flex-1 text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <Barcode className="w-4 h-4" />
                <span>{isKh ? 'ស្កេនទំនិញ' : 'Scan & Add'}</span>
              </button>
            </form>
          </div>

          {/* Recent Scanned Items in this session */}
          {recentScannedList.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                  {isKh ? 'ទំនិញដែលទើបស្កេនចូលកន្ត្រក (Scanned Items):' : 'Recently Scanned to Cart:'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {recentScannedList.length} items
                </span>
              </div>
              <div className="space-y-1.5">
                {recentScannedList.map((item, idx) => (
                  <div 
                    key={`${item.product.id}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="w-8 h-8 rounded-lg object-cover bg-white border border-slate-100 shrink-0" 
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                          <span>#{item.product.barcode}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-semibold">${item.product.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                      {isKh ? 'បានបន្ថែម' : 'Added'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1-Click Interactive Barcode Test Simulators */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                {isKh ? 'តេស្តចុចស្កេនទំនិញគំរូ (Quick Test 1-Click):' : 'Quick Test Product Barcodes:'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {products.slice(0, 8).map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleBarcodeDetected(prod.barcode)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl text-[11px] font-medium transition-colors border border-slate-200/60 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Barcode className="w-3 h-3 text-slate-400" />
                  <span className="font-semibold">{prod.name}</span>
                  <span className="font-mono text-[10px] text-slate-400">(${prod.price.toFixed(2)})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            {isKh ? 'គាំទ្រ Hardware Scanner & Camera' : 'Supports Hardware Barcode Guns'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopCamera();
                onClose();
                if (onOpenCartMobile) {
                  onOpenCartMobile();
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{isKh ? 'ទៅកាន់ផ្ទាំងគិតលុយ (Cart)' : 'View Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
