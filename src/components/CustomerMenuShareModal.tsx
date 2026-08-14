import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  Sparkles, 
  X, 
  Smartphone, 
  MessageCircle, 
  Send, 
  Printer, 
  Download,
  Info
} from 'lucide-react';
import QRCode from 'qrcode';
import { ShopSettings } from '../types';
import { Logo } from './Logo';

interface CustomerMenuShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  language: 'en' | 'kh';
  onOpenPreview: () => void;
  currentUserId?: string;
}

export const CustomerMenuShareModal: React.FC<CustomerMenuShareModalProps> = ({
  isOpen,
  onClose,
  settings,
  language,
  onOpenPreview,
  currentUserId
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isKh = language === 'kh';

  // Build the shareable link for customer self-order menu scoped to this store/user account
  const storeParam = currentUserId ? `&storeId=${encodeURIComponent(currentUserId)}` : '';
  const menuUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?mode=customer_menu${storeParam}`
    : `https://miniposkh.app/?mode=customer_menu${storeParam}`;

  // Generate QR Code image
  useEffect(() => {
    if (isOpen && menuUrl) {
      QRCode.toDataURL(menuUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff'
        }
      })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate QR code:', err);
      });
    }
  }, [isOpen, menuUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(menuUrl);
      } else {
        const input = document.createElement('input');
        input.value = menuUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareTelegram = () => {
    const text = encodeURIComponent(
      isKh 
        ? `សូមចូលកុម្ម៉ង់ទំនិញតាមតំណភ្ជាប់នេះពីហាង ${settings.shopNameKh || settings.shopName}:\n${menuUrl}`
        : `Order online from ${settings.shopName}:\n${menuUrl}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(menuUrl)}&text=${text}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      isKh 
        ? `សូមចូលកុម្ម៉ង់ទំនិញពីហាង ${settings.shopNameKh || settings.shopName}: ${menuUrl}`
        : `Order online from ${settings.shopName}: ${menuUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `minipos-menu-qr-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintQr = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Menu - ${settings.shopName}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
              padding: 40px 20px;
              color: #1e293b;
            }
            .card {
              max-width: 380px;
              margin: 0 auto;
              border: 2px dashed #6366f1;
              border-radius: 24px;
              padding: 30px 20px;
            }
            h1 { font-size: 22px; margin: 10px 0 4px 0; color: #1e1b4b; }
            p { font-size: 13px; color: #64748b; margin: 4px 0 20px 0; }
            img { width: 240px; height: 240px; margin-bottom: 15px; }
            .badge {
              display: inline-block;
              background: #e0e7ff;
              color: #4338ca;
              font-weight: bold;
              font-size: 12px;
              padding: 6px 14px;
              border-radius: 999px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">${isKh ? 'ស្កេនកុម្ម៉ង់ទំនិញភ្លាមៗ' : 'SCAN TO ORDER ONLINE'}</span>
            <h1>${isKh ? settings.shopNameKh || settings.shopName : settings.shopName}</h1>
            <p>${isKh ? 'បើកកាមេរ៉ាស្កេន QR Code ដើម្បីមើលមុខទំនិញ & កុម្ម៉ង់' : 'Scan this QR code with phone camera to order'}</p>
            <img src="${qrDataUrl}" alt="QR Code" />
            <p style="font-size: 11px; font-weight: bold; color: #4f46e5;">MINI MART POS • Customer Self-Order</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-xs text-amber-300">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg tracking-tight">
                {isKh ? 'តំណភ្ជាប់ម៉ឺនុយអតិថិជន (Customer Menu Link)' : 'Customer Self-Order Link & QR'}
              </h3>
              <p className="text-xs text-indigo-200 font-medium">
                {isKh ? 'ចែករំលែក Link ឬ QR Code ទៅកាន់អតិថិជន' : 'Share QR code or link for self-ordering'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Main QR Card */}
          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/70 shrink-0">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Customer Menu QR Code"
                  className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                  <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {isKh ? 'ដំណើរការ Live 24/7' : 'Live Self-Order'}
                </span>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {isKh ? 'ស្កេនកុម្ម៉ង់ទំនិញភ្លាមៗ' : 'Scan to View & Order'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isKh 
                    ? 'អតិថិជនអាចស្កេន QR នេះដោយទូរស័ព្ទដៃ ដើម្បីជ្រើសរើសទំនិញ និងផ្ញើចូលប្រព័ន្ធគិតលុយរបស់លោកអ្នកដោយផ្ទាល់។' 
                    : 'Customers scan this QR code with their mobile phone to browse all products and place orders directly into POS.'}
                </p>
              </div>

              {/* Action Buttons for QR */}
              <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isKh ? 'ទាញយក QR' : 'Download QR'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintQr}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isKh ? 'បោះពុម្ពបិទលើតុ' : 'Print Table QR'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 1-Click Copy Direct Link Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              {isKh ? 'តំណភ្ជាប់ផ្ទាល់ (Direct Customer URL)' : 'Direct Customer Ordering Link'}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-mono text-slate-700 truncate select-all">
                {menuUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0 ${
                  copied 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{isKh ? 'បានចម្លង!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{isKh ? 'ចម្លង Link' : 'Copy Link'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-600">
              {isKh ? 'ផ្ញើទៅកាន់អតិថិជនតាមបណ្តាញសង្គម' : 'Quick Share to Customers'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleShareTelegram}
                className="py-2.5 px-3 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#229ED9]/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#25D366]/20"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(menuUrl, '_blank');
                }}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isKh ? 'បើកផ្ទាំងថ្មី' : 'New Tab'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPreview();
                }}
                className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isKh ? 'មើលសាកល្បង' : 'In-App View'}</span>
              </button>
            </div>
          </div>

          {/* Guide Tips */}
          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold">{isKh ? 'របៀបដំណើរការ:' : 'How it works:'}</strong>{' '}
              {isKh 
                ? 'នៅពេលអតិថិជនចុច "ផ្ញើការកុម្ម៉ង់ទៅហាង" នៅលើទូរស័ព្ទរបស់គាត់ ប្រព័ន្ធ POS របស់អ្នកនឹងបន្លឺសំឡេងរោទិ៍ ហើយបង្ហាញផ្ទាំងកុម្ម៉ង់ភ្លាមៗ ជាមួយប៊ូតុង "បញ្ចូលក្នុង Current Order ដើម្បីគិតលុយ" តែម្តង!'
                : 'When customers tap "Send Order to Store" on their phones, your POS receives a real-time notification with a 1-click button to load items straight into your checkout cart!'}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {isKh ? 'បិទ' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
