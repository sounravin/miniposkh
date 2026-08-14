import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Barcode, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Zap, 
  RefreshCw,
  Eye
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { sounds } from '../utils/audio';

interface BarcodeAutoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeCaptured: (scannedBarcode: string) => void;
  language: 'en' | 'kh';
  initialBarcode?: string;
}

export const BarcodeAutoCaptureModal: React.FC<BarcodeAutoCaptureModalProps> = ({
  isOpen,
  onClose,
  onBarcodeCaptured,
  language,
  initialBarcode = ''
}) => {
  const [capturedCode, setCapturedCode] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [macroLensEnabled, setMacroLensEnabled] = useState(true);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = 'auto-barcode-capture-viewport';
  const isKh = language === 'kh';

  // Discover camera devices (including ultra-wide/macro lenses on iOS/Android)
  useEffect(() => {
    if (!isOpen) return;

    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          // Prefer back/macro camera
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('0') ||
            d.label.toLowerCase().includes('triple')
          ) || devices[0];
          setSelectedCameraId(backCam.id);
        }
      })
      .catch(() => {
        // Fallback to default facingMode
      });
  }, [isOpen]);

  const handleDetected = (rawCode: string) => {
    const cleanCode = rawCode.trim();
    if (!cleanCode) return;

    sounds.playBarcodeBeep();
    setCapturedCode(cleanCode);

    setTimeout(() => {
      stopCamera();
      onBarcodeCaptured(cleanCode);
      onClose();
    }, 450);
  };

  // Start Camera with iPhone macro lens / high-resolution autofocus focus mode
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

        // Camera configuration with advanced focus/macro optimization for iPhone & mobile
        const cameraConfig = selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: 'environment' };

        await html5QrCode.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.333334,
            videoConstraints: {
              facingMode: 'environment',
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
              // Advanced constraints for modern mobile cameras (e.g., iPhone Macro / Ultra Wide close-up)
              ...(macroLensEnabled ? {
                focusMode: 'continuous',
                advanced: [{ focusMode: 'continuous' }] as any
              } : {})
            } as any
          },
          (decodedText) => {
            if (isMounted) {
              handleDetected(decodedText);
            }
          },
          () => {
            // Frame scan failure ignore
          }
        );

        if (isMounted) {
          setIsCameraActive(true);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setIsCameraActive(false);
          const msg = err instanceof Error ? err.message : 'Camera could not be accessed.';
          setCameraError(msg);
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
  }, [isOpen, selectedCameraId, macroLensEnabled]);

  const stopCamera = () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
      } catch {
        // Ignore safe cleanup errors
      }
      html5QrCodeRef.current = null;
      setIsCameraActive(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
                <span>{isKh ? 'ស្កេនចាប់បាកូដស្វ័យប្រវត្ត' : 'Auto Barcode Scanner'}</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold border border-emerald-500/30">
                  {isKh ? 'Macro Focus' : 'Macro Ready'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isKh ? 'ស្កេនផ្ទាល់ពីកាមេរ៉ា iPhone/Android ឬវាយបញ្ចូល' : 'High-precision barcode scanning for products'}
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

        {/* Camera Selector / Macro Control Bar */}
        <div className="bg-slate-800 px-4 py-2 text-white flex items-center justify-between text-xs border-b border-slate-700">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{isKh ? 'iPhone Macro Autofocus' : 'Macro Autofocus'}</span>
          </div>

          {availableCameras.length > 1 && (
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-slate-900 text-[11px] text-indigo-300 px-2 py-1 rounded-lg border border-slate-700 focus:outline-none max-w-[140px] truncate"
            >
              {availableCameras.map((cam, i) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Camera ${i + 1}`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Viewport Area */}
        <div className="p-4 sm:p-5 space-y-4">
          {capturedCode ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-in fade-in zoom-in-95">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-800">
                  {isKh ? 'ចាប់បានលេខបាកូដជោគជ័យ!' : 'Barcode Captured Successfully!'}
                </div>
                <div className="text-sm font-mono font-extrabold text-emerald-900 mt-0.5">
                  #{capturedCode}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] flex flex-col items-center justify-center border border-slate-800 shadow-inner">
              <div id={scannerRegionId} className="w-full h-full" />

              {/* Laser Target Box Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-36 border-2 border-dashed border-indigo-400/90 rounded-2xl relative flex items-center justify-center bg-indigo-500/5 shadow-2xl">
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-bounce shadow-md shadow-rose-500/60" />
                  <span className="text-[10px] font-mono text-indigo-100 bg-black/80 px-2.5 py-1 rounded-lg backdrop-blur-xs border border-white/10 flex items-center gap-1.5">
                    <Barcode className="w-3 h-3 text-indigo-400" />
                    {isKh ? 'ដាក់បាកូដឱ្យចំប្រអប់ក្រហម' : 'Align Barcode Here'}
                  </span>
                </div>
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-slate-900/95 p-5 flex flex-col items-center justify-center text-center text-slate-300">
                  <Camera className="w-10 h-10 text-slate-500 mb-2" />
                  <p className="text-xs font-bold text-slate-200 mb-1">
                    {isKh ? 'មិនអាចបើកកាមេរ៉ាបាន' : 'Camera Unavailable'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mb-3">
                    {isKh 
                      ? 'សូមពិនិត្យមើលការអនុញ្ញាត Permission កាមេរ៉ាលើ Safari / Chrome ឬវាយលេខបាកូដខាងក្រោម' 
                      : 'Please allow camera permissions or type barcode manually below.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Manual Entry Fallback */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>{isKh ? 'វាយបញ្ចូលលេខបាកូដផ្ទាល់ (Manual Entry):' : 'Type Barcode / USB Scanner:'}</span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualCode.trim()) {
                  handleDetected(manualCode);
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={isKh ? "ឧ. 885123456789..." : "Enter barcode..."}
                className="flex-1 text-xs font-mono font-bold px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                {isKh ? 'ប្រើកូដនេះ' : 'Apply'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px] text-slate-400">
            {isKh ? 'ស្គាល់ UPC, EAN-13, QR, Code128' : 'Supports EAN-13, UPC, Code128, QR'}
          </span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
          >
            {isKh ? 'បិទ' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};
