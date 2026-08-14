import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  variant?: 'badge' | 'compact';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  variant = 'badge'
}) => {
  // Determine dimensions based on size
  let pixelSize = 44;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'sm':
        pixelSize = 32;
        break;
      case 'md':
        pixelSize = 44;
        break;
      case 'lg':
        pixelSize = 64;
        break;
      case 'xl':
        pixelSize = 120;
        break;
    }
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div 
          style={{ width: pixelSize, height: pixelSize }} 
          className="relative shrink-0 rounded-full bg-white shadow-xs p-1 flex items-center justify-center border-2 border-[#0088b4]"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Base Concentric Radar Rings */}
            <ellipse cx="100" cy="148" rx="55" ry="14" stroke="#0088b4" strokeWidth="6" fill="none" />
            <ellipse cx="100" cy="148" rx="38" ry="9" stroke="#0088b4" strokeWidth="5" fill="none" />

            {/* Growth Arrows */}
            <path d="M102 54 L114 42 M114 42 L106 41 M114 42 L113 50" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M116 46 L130 32 M130 32 L122 31 M130 32 L129 40" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M130 38 L146 22 M146 22 L137 21 M146 22 L145 31" stroke="#f97316" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

            {/* POS Terminal Base & Screen */}
            <path d="M84 62 L132 62 C138 62 144 68 141 75 L124 135 C122 141 116 146 110 146 L74 146 C68 146 63 140 65 134 L80 69 C81 65 83 62 84 62 Z" fill="#0284c7" />
            {/* Screen Glass */}
            <path d="M88 70 L126 70 L115 110 L77 110 Z" fill="#e0f2fe" />
            <path d="M110 74 L122 74 L102 106 L90 106 Z" fill="white" opacity="0.6" />
            {/* Keypad Buttons */}
            <rect x="80" y="117" width="12" height="7" rx="2" fill="white" />
            <rect x="96" y="117" width="12" height="7" rx="2" fill="white" />
            <rect x="82" y="128" width="22" height="6" rx="2" fill="white" />

            {/* Orange Shopping Cart */}
            <g transform="translate(18, 12)">
              <path d="M38 78 L52 78 L62 108 L98 108 L106 85 L56 85" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="#f59e0b" fillOpacity="0.9" />
              <circle cx="68" cy="120" r="7" fill="#ea580c" />
              <circle cx="94" cy="120" r="7" fill="#ea580c" />
            </g>
          </svg>
        </div>

        {showText && (
          <div>
            <div className="font-extrabold text-base tracking-tight text-[#08426b] flex items-center gap-1.5">
              MINI-POS-KH
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Point of Sale System</p>
          </div>
        )}
      </div>
    );
  }

  // Full Badge View (Matches user's circular logo artwork)
  return (
    <div 
      style={{ width: pixelSize, height: pixelSize }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
    >
      <svg 
        viewBox="0 0 400 400" 
        className="w-full h-full drop-shadow-sm" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Circular Border */}
        <circle cx="200" cy="200" r="190" stroke="#0084b4" strokeWidth="18" fill="#ffffff" />

        {/* Concentric Base Pulse Rings */}
        <ellipse cx="200" cy="275" rx="100" ry="24" stroke="#0088b4" strokeWidth="8" fill="none" />
        <ellipse cx="200" cy="275" rx="72" ry="16" stroke="#0088b4" strokeWidth="7" fill="none" />

        {/* 3 Ascending Growth Arrows */}
        {/* Arrow 1 - Green */}
        <g stroke="#16a34a" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M205 110 L228 85" />
          <path d="M213 83 L228 85 L226 100" />
        </g>
        {/* Arrow 2 - Emerald/Teal */}
        <g stroke="#0d9488" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M232 96 L258 70" />
          <path d="M243 68 L258 70 L256 85" />
        </g>
        {/* Arrow 3 - Orange */}
        <g stroke="#f97316" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
          <path d="M258 80 L288 50" />
          <path d="M272 48 L288 50 L286 66" />
        </g>

        {/* POS Terminal Body */}
        <path 
          d="M170 120 L256 120 C268 120 276 130 272 142 L242 245 C238 256 228 264 216 264 L152 264 C140 264 130 254 134 242 L162 134 C164 126 167 120 170 120 Z" 
          fill="#0284c7" 
        />
        {/* Terminal Stand Shadow / Back */}
        <path d="M242 165 L275 185 L260 230 L235 220 Z" fill="#0369a1" />

        {/* Screen Bezel & Glass */}
        <path d="M178 132 L246 132 L228 200 L160 200 Z" fill="#e0f2fe" />
        {/* Screen Glare Highlight */}
        <path d="M218 136 L238 136 L204 196 L184 196 Z" fill="white" opacity="0.65" />

        {/* Keypad Buttons on POS */}
        <rect x="162" y="212" width="20" height="11" rx="3" fill="white" />
        <rect x="188" y="212" width="20" height="11" rx="3" fill="white" />
        <rect x="166" y="230" width="38" height="10" rx="3" fill="white" />

        {/* Shopping Cart (Golden Amber & Orange) */}
        <g transform="translate(26, 12)">
          {/* Cart Basket Body */}
          <path 
            d="M74 138 L96 138 L114 186 L168 186 L180 148 L104 148" 
            stroke="#f59e0b" 
            strokeWidth="14" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="#f59e0b" 
          />
          {/* Handle */}
          <path d="M72 138 L88 138" stroke="#ea580c" strokeWidth="12" strokeLinecap="round" />
          {/* Wheels */}
          <circle cx="120" cy="204" r="10" fill="#ea580c" />
          <circle cx="158" cy="204" r="10" fill="#ea580c" />
        </g>

        {/* Brand Text: MINI-POS-KH */}
        <text 
          x="200" 
          y="325" 
          textAnchor="middle" 
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
          fontWeight="900" 
          fontSize="36" 
          letterSpacing="1.5" 
          fill="#08426b"
        >
          MINI-POS-KH
        </text>
      </svg>
    </div>
  );
};
