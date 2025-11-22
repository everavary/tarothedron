
import React, { useRef } from 'react';
import { Suit, CARD_WIDTH, CARD_HEIGHT, CARD_BORDER_RADIUS, TAROT_BACK_URL } from '../constants';

export interface CornerLabels {
  tl?: string | number;
  tr?: string | number;
  bl?: string | number;
  br?: string | number;
}

interface PlayingCardProps {
  suit: Suit;
  rank: string;
  imageUrl?: string;
  className?: string;
  style?: React.CSSProperties;
  isFaceUp?: boolean;
  label?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onMouseMove?: (e: React.MouseEvent, sector: number) => void; // 0:TL, 1:TR, 2:BL, 3:BR
  children?: React.ReactNode;
  cornerLabels?: CornerLabels;
  showAllCorners?: boolean;
}

const PlayingCard: React.FC<PlayingCardProps> = ({
  imageUrl,
  className = '',
  style = {},
  isFaceUp = true,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  children,
  cornerLabels,
  showAllCorners = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent) => {
      if (!onMouseMove || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const isRight = x > rect.width / 2;
      const isBottom = y > rect.height / 2;

      // 0: TL, 1: TR, 2: BL, 3: BR
      let sector = 0;
      if (!isRight && !isBottom) sector = 0;
      if (isRight && !isBottom) sector = 1;
      if (!isRight && isBottom) sector = 2;
      if (isRight && isBottom) sector = 3;

      onMouseMove(e, sector);
  };

  // Only used for Step Visualization Overlay
  const CornerOverlay = ({ val, top, bottom, left, right }: any) => (
      <div 
        className="absolute z-40 flex items-center justify-center w-6 h-6 rounded-full bg-pink-600 text-white shadow-lg border border-white/20"
        style={{ top, bottom, left, right }}
      >
        <span className="text-[10px] font-bold leading-none">
          {val}
        </span>
      </div>
  );

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={handleMouseMove}
      className={`relative bg-[#1a1a1a] select-none transition-transform will-change-transform ${className}`}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: CARD_BORDER_RADIUS,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {/* Card Border */}
      <div className="absolute inset-0 border border-black/60 rounded-[12px] pointer-events-none z-20" />

      {isFaceUp ? (
        <div className="w-full h-full relative overflow-hidden rounded-[11px]">
          {/* Full Bleed Image */}
          {imageUrl ? (
             <img 
                src={imageUrl} 
                alt="Tarot Card"
                className="w-full h-full object-cover block"
                draggable={false}
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.classList.add('bg-slate-800', 'flex', 'items-center', 'justify-center');
                    target.parentElement!.innerHTML = `<span class="text-slate-400 text-xs text-center p-2">${imageUrl.split('/').pop()}</span>`;
                }}
             />
          ) : (
             <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                 No Image
             </div>
          )}

          {/* Step Overlays (Only render if cornerLabels provided for Visualizer) */}
          {cornerLabels?.tl !== undefined && <CornerOverlay val={cornerLabels.tl} top={4} left={4} />}
          {cornerLabels?.tr !== undefined && <CornerOverlay val={cornerLabels.tr} top={4} right={4} />}
          {cornerLabels?.bl !== undefined && <CornerOverlay val={cornerLabels.bl} bottom={4} left={4} />}
          {cornerLabels?.br !== undefined && <CornerOverlay val={cornerLabels.br} bottom={4} right={4} />}

          {/* Children (Heatmap Overlays) */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {children}
          </div>
        </div>
      ) : (
        /* Card Back Design */
        <div className="w-full h-full relative overflow-hidden rounded-[11px]">
            <img 
                src={TAROT_BACK_URL}
                alt="Card Back"
                className="w-full h-full object-cover block"
                draggable={false}
            />
        </div>
      )}
    </div>
  );
};

export default PlayingCard;
