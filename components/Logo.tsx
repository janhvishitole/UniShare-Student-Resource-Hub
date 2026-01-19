
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 48 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Blue 'U' Base */}
      <path 
        d="M25 20V60C25 73.8071 36.1929 85 50 85C63.8071 85 75 73.8071 75 60V20" 
        stroke="#1A73E8" 
        strokeWidth="12" 
        strokeLinecap="round"
      />
      
      {/* Circular Arrows Group */}
      <g>
        {/* Red Arrow Segment */}
        <path d="M50 10C65 10 78 18 85 30" stroke="#EA4335" strokeWidth="4" strokeLinecap="round" />
        <path d="M85 30L80 22M85 30L92 27" stroke="#EA4335" strokeWidth="4" strokeLinecap="round" />
        
        {/* Yellow Arrow Segment */}
        <path d="M90 50C90 65 82 78 70 85" stroke="#FBBC05" strokeWidth="4" strokeLinecap="round" />
        <path d="M70 85L78 80M70 85L73 92" stroke="#FBBC05" strokeWidth="4" strokeLinecap="round" />
        
        {/* Green Arrow Segment */}
        <path d="M10 50C10 35 18 22 30 15" stroke="#34A853" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 15L22 20M30 15L27 8" stroke="#34A853" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* Central Gear */}
      <circle cx="50" cy="50" r="10" fill="#1A73E8" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <rect 
          key={deg}
          x="47" y="35" width="6" height="8" 
          fill="#1A73E8" 
          transform={`rotate(${deg}, 50, 50)`} 
        />
      ))}
      <circle cx="50" cy="50" r="5" fill="white" />
    </svg>
  );
};

export default Logo;
