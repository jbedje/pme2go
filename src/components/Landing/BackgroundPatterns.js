import React from 'react';

export const CirclePattern = ({ className = "" }) => (
  <div className={`absolute inset-0 ${className}`}>
    <svg width="100%" height="100%" viewBox="0 0 400 400" className="opacity-10">
      <defs>
        <pattern id="circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="2" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#circles)" />
    </svg>
  </div>
);

export const WavePattern = ({ className = "" }) => (
  <div className={`absolute inset-0 ${className}`}>
    <svg width="100%" height="100%" viewBox="0 0 1200 120" className="opacity-20">
      <path 
        d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" 
        fill="currentColor"
      />
    </svg>
  </div>
);

export const GeometricPattern = ({ className = "" }) => (
  <div className={`absolute inset-0 ${className}`}>
    <svg width="100%" height="100%" viewBox="0 0 200 200" className="opacity-5">
      <defs>
        <pattern id="geometric" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <polygon points="25,5 45,20 40,40 10,40 5,20" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#geometric)" />
    </svg>
  </div>
);