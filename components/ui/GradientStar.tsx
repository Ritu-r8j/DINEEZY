import React from 'react';

interface GradientStarProps {
  size?: number;
  className?: string;
}

const GradientStar: React.FC<GradientStarProps> = ({ size = 16, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8dcff" stopOpacity={0.5} />
          <stop offset="50%" stopColor="#c9cbff" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#e5c0ff" stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="url(#starGradient)"
        stroke="url(#starGradient)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default GradientStar;
