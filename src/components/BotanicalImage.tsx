import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface BotanicalImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectClass?: string;
  fallbackTitle?: string;
}

export const BotanicalImage: React.FC<BotanicalImageProps> = ({
  src,
  alt,
  className = '',
  aspectClass = 'aspect-[4/3]',
  fallbackTitle,
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#F8F6EF] via-[#EAE4D3] to-[#D5E0D0] flex flex-col items-center justify-center p-6 text-center ${aspectClass} ${className}`}
      >
        <div className="w-12 h-12 rounded-full border border-[#C6A76A]/50 flex items-center justify-center mb-3 text-[#173D32]">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="font-serif-display text-sm font-semibold tracking-wider text-[#173D32] uppercase">
          {fallbackTitle || alt}
        </span>
        <span className="text-xs text-[#245B45] mt-1">DXN Organic Point</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#F3EFE6] ${aspectClass}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${className}`}
      />
    </div>
  );
};
