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
          className="relative shrink-0 rounded-full bg-white shadow-xs flex items-center justify-center border-2 border-[#0084b4] overflow-hidden"
        >
          <img 
            src="/favicon.svg" 
            alt="MINI MART POS" 
            className="w-full h-full object-contain"
          />
        </div>

        {showText && (
          <div>
            <div className="font-extrabold text-base tracking-tight text-[#08426b] flex items-center gap-1.5 leading-tight">
              <span>MINI MART POS</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Point of Sale System</p>
          </div>
        )}
      </div>
    );
  }

  // Full Badge View (Matches user's exact circular logo artwork)
  return (
    <div 
      style={{ width: pixelSize, height: pixelSize }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
    >
      <img 
        src="/favicon.svg" 
        alt="MINI MART POS" 
        className="w-full h-full object-contain drop-shadow-sm rounded-full"
      />
    </div>
  );
};
