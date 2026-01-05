'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 32, text: 'text-xs' },
  md: { icon: 40, text: 'text-sm' },
  lg: { icon: 56, text: 'text-base' },
  xl: { icon: 80, text: 'text-lg' },
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const s = sizes[size];
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Car Icon */}
      <svg 
        width={s.icon} 
        height={s.icon} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Circle background */}
        <circle cx="50" cy="50" r="48" fill="#1948b3" fillOpacity="0.1" stroke="#1948b3" strokeWidth="2"/>
        
        {/* Car body */}
        <path 
          d="M25 55 L30 42 Q32 38 38 38 L62 38 Q68 38 70 42 L75 55 Q77 58 77 62 L77 68 Q77 70 75 70 L25 70 Q23 70 23 68 L23 62 Q23 58 25 55Z" 
          fill="#1948b3"
        />
        
        {/* Windows */}
        <path 
          d="M33 45 L37 40 Q38 39 40 39 L50 39 L50 50 L33 50 Q32 50 32 48 L33 45Z" 
          fill="#e8f0fe"
        />
        <path 
          d="M52 39 L60 39 Q62 39 63 40 L67 45 L68 48 Q68 50 67 50 L52 50 L52 39Z" 
          fill="#e8f0fe"
        />
        
        {/* Wheels */}
        <circle cx="33" cy="68" r="8" fill="#1e293b"/>
        <circle cx="33" cy="68" r="4" fill="#64748b"/>
        <circle cx="67" cy="68" r="8" fill="#1e293b"/>
        <circle cx="67" cy="68" r="4" fill="#64748b"/>
        
        {/* Headlights */}
        <rect x="23" y="56" width="4" height="3" rx="1" fill="#fbbf24"/>
        <rect x="73" y="56" width="4" height="3" rx="1" fill="#fbbf24"/>
      </svg>
      
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-bold text-primary-600 tracking-tight ${s.text}`}>
            MY NEXT RIDE
          </span>
          <span className={`font-semibold text-slate-500 tracking-widest ${size === 'sm' ? 'text-[8px]' : 'text-[10px]'}`}>
            ONTARIO
          </span>
        </div>
      )}
    </div>
  );
}

export function LogoIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="48" fill="#1948b3" fillOpacity="0.15"/>
      <path 
        d="M25 55 L30 42 Q32 38 38 38 L62 38 Q68 38 70 42 L75 55 Q77 58 77 62 L77 68 Q77 70 75 70 L25 70 Q23 70 23 68 L23 62 Q23 58 25 55Z" 
        fill="#1948b3"
      />
      <path d="M33 45 L37 40 Q38 39 40 39 L50 39 L50 50 L33 50 Q32 50 32 48 L33 45Z" fill="#e8f0fe"/>
      <path d="M52 39 L60 39 Q62 39 63 40 L67 45 L68 48 Q68 50 67 50 L52 50 L52 39Z" fill="#e8f0fe"/>
      <circle cx="33" cy="68" r="8" fill="#1e293b"/>
      <circle cx="33" cy="68" r="4" fill="#64748b"/>
      <circle cx="67" cy="68" r="8" fill="#1e293b"/>
      <circle cx="67" cy="68" r="4" fill="#64748b"/>
      <rect x="23" y="56" width="4" height="3" rx="1" fill="#fbbf24"/>
      <rect x="73" y="56" width="4" height="3" rx="1" fill="#fbbf24"/>
    </svg>
  );
}




