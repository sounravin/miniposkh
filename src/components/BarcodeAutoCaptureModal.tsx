import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Barcode, 
  CheckCircle2, 
  Zap, 
  Sparkles,
  Flashlight,
  ZoomIn,
  ZoomOut,
  Upload,
  RefreshCw,
  Sliders,
  ScanLine
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { sounds } from '../utils/audio';

interface BarcodeAutoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeCaptured: (scannedBarcode: string) => void;
  language: 'en' | 'kh';
  initialBarcode?: string;
}

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
  
  // Camera & Lens controls
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [maxZoom, setMaxZoom] = useState<number>(3);
  const [hasZoomSupport, setHasZoomSupport] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorchSupport, setHasTorchSupport] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerRegionId = 'auto-barcode-capture-viewport';
  const isKh = language === 'kh';

  // Reset states on open
  useEffect(() => {
    if (isOpen) {
      isProcessingRef.current = false;
      setCapturedCode(null);
      setCameraError(null);
      setTorchOn(false);
      setZoomLevel(1);
    }
  }, [isOpen]);

  // Discover camera devices
  useEffect(() => {
    if (!isOpen) return;

    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length > 0) {
          setAvailableCameras(devices);
          // Prefer back/macro/environment camera
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
    if (!cleanCode || isProcessingRef.current) return;

    isProcessingRef.current = true;
    sounds.playBarcodeBeep();
    setCapturedCode(cleanCode);

    setTimeout(() => {
      stopCamera();
      onBarcodeCaptured(cleanCode);
      onClose();
    }, 450);
  };

  // Start Camera with hardware barcode acceleration & continuous focus
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let isMounted = true;
    isProcessingRef.current = false;

    const startCamera = async () => {
      try {
        setCameraError(null);
        
        // Use comprehensive format configuration & experimental fast BarcodeDetector
        const html5QrCode = new Html5Qrcode(scannerRegionId, {
          formatsToSupport: SUPPORTED_SCAN_FORMATS,
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        });
        html5QrCodeRef.current = html5QrCode;

        const cameraConfig = selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: 'environment' };

        await html5QrCode.start(
          cameraConfig,
          {
            fps: 20, // High scan rate for instant detection
            disableFlip: false,
            videoConstraints: {
              facingMode: 'environment',
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
              focusMode: 'continuous',
              advanced: [
                { focusMode: 'continuous' },
                { zoom: 1 }
              ] as any
            } as any
          },
          (decodedText) => {
            if (isMounted && !isProcessingRef.current) {
              handleDetected(decodedText);
            }
          },
          () => {
            // Ignore frame-by-frame non-matches
          }
        );

        if (isMounted) {
          setIsCameraActive(true);

          // Check for hardware zoom and torch capabilities on the active video track
          try {
            const videoElem = document.querySelector(`#${scannerRegionId} video`) as HTMLVideoElement;
            if (videoElem && videoElem.srcObject) {
              const stream = videoElem.srcObject as MediaStream;
              const track = stream.getVideoTracks()[0];
              if (track) {
                videoTrackRef.current = track;
                const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
                
                if (capabilities.zoom) {
                  setHasZoomSupport(true);
                  setMaxZoom(capabilities.zoom.max || 3);
                }
                if (capabilities.torch) {
                  setHasTorchSupport(true);
                }
              }
            }
          } catch {
            // Non-blocking capability check
          }
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
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, selectedCameraId]);

  const stopCamera = () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
      } catch {
        // Safe cleanup
      }
      html5QrCodeRef.current = null;
      videoTrackRef.current = null;
      setIsCameraActive(false);
    }
  };

  // Adjust camera hardware zoom (e.g. 1x, 1.5x, 2x for tight barcodes)
  const applyZoom = async (newZoom: number) => {
    setZoomLevel(newZoom);
    try {
      if (videoTrackRef.current && hasZoomSupport) {
        await videoTrackRef.current.applyConstraints({
          advanced: [{ zoom: newZoom }] as any
        });
      }
    } catch {
      // Zoom fallback
    }
  };

  // Toggle hardware flashlight
  const toggleTorch = async () => {
    const nextState = !torchOn;
    setTorchOn(nextState);
    try {
      if (videoTrackRef.current && hasTorchSupport) {
        await videoTrackRef.current.applyConstraints({
          advanced: [{ torch: nextState }] as any
        });
      }
    } catch {
      // Torch fallback
    }
  };

  // Scan from gallery/image upload fallback
  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerRegionId, {
          formatsToSupport: SUPPORTED_SCAN_FORMATS,
          verbose: false,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        });
      }
      const scannedResult = await html5QrCodeRef.current.scanFile(file, true);
      if (scannedResult) {
        handleDetected(scannedResult);
      }
    } catch {
      alert(isKh ? 'មិនអាចរកឃើញបាកូដក្នុងរូបភាពនេះទេ។ សូមសាកល្បងម្ដងទៀត។' : 'No readable barcode found in this image.');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
                <span>{isKh ? 'ម៉ាស៊ីនស្កេនបាកូដទំនិញ' : 'Product Barcode Scanner'}</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  AI Fast Scan
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isKh ? 'ស្កេនបាកូដរហ័សគ្រប់ប្រភេទ (EAN-13, UPC, Code128, QR)' : 'High-speed auto scanner with autofocus & zoom'}
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

        {/* Toolbar: Lens selection, Zoom, Torch, Image Upload */}
        <div className="bg-slate-800 px-4 py-2.5 text-white flex items-center justify-between gap-2 border-b border-slate-700 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            {availableCameras.length > 1 && (
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="bg-slate-900 text-[11px] text-indigo-300 px-2 py-1 rounded-lg border border-slate-700 focus:outline-none max-w-[130px] truncate"
              >
                {availableCameras.map((cam, i) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            )}

            {/* Quick Zoom presets */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-700">
              {[1, 1.5, 2].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => applyZoom(z)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    zoomLevel === z ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {z}x
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {hasTorchSupport && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  torchOn 
                    ? 'bg-amber-500 text-slate-950 border-amber-400' 
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title={isKh ? "ពិលជំនួយពន្លឺ" : "Flashlight"}
              >
                <Flashlight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title={isKh ? "ស្កេនពីរូបភាព" : "Upload image"}
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline text-[11px]">{isKh ? 'រូបភាព' : 'Image'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileScan}
            />
          </div>
        </div>

        {/* Viewport Area */}
        <div className="p-4 sm:p-5 space-y-4">
          {capturedCode ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-in fade-in zoom-in-95">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
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
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div className="w-full max-w-[280px] h-36 border-2 border-indigo-400/90 rounded-2xl relative flex items-center justify-center bg-indigo-500/5 shadow-2xl">
                  {/* Corner Accent marks */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400 rounded-br-xl" />

                  {/* Laser line animation */}
                  <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse shadow-md shadow-rose-500/60" />
                  
                  <span className="text-[10px] font-mono text-indigo-100 bg-black/85 px-3 py-1 rounded-lg backdrop-blur-xs border border-white/10 flex items-center gap-1.5 shadow-lg">
                    <Barcode className="w-3.5 h-3.5 text-indigo-400" />
                    {isKh ? 'ដាក់បាកូដក្នុងប្រអប់នេះ' : 'Point camera at barcode'}
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
                      ? 'សូមពិនិត្យមើលការអនុញ្ញាត Permission កាមេរ៉ា ឬជ្រើសរើសរូបថតបាកូដខាងក្រោម' 
                      : 'Please check camera permissions or upload a barcode image.'}
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs"
              >
                {isKh ? 'ប្រើកូដនេះ' : 'Apply'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px] text-slate-400">
            {isKh ? 'គាំទ្រ UPC, EAN-13, QR, Code128, Code39' : 'Supports EAN-13, UPC, Code128, QR'}
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
