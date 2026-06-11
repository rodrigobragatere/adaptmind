import React from 'react';
import { Brain } from 'lucide-react';

interface LogoProps {
  className?: string;
  url?: string;
}

export const Logo: React.FC<LogoProps> = ({ className, url }) => {
  // 1. Priority: Custom Image Uploaded by User (via Admin/LocalStorage)
  if (url && url.length > 5) {
    return (
      <>
        <img 
          src={url} 
          alt="AdaptMind Logo" 
          className={`object-contain ${className}`} 
          referrerPolicy="no-referrer"
          onError={(e) => {
            // If the image fails to load, hide it and show the fallback
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) {
              fallback.classList.remove('hidden');
            }
          }}
        />
        <div className={`relative hidden ${className}`}>
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="blue-cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" /> {/* Sky 500 */}
                <stop offset="100%" stopColor="#2dd4bf" /> {/* Teal 400 */}
              </linearGradient>
            </defs>
          </svg>
          <Brain 
            className="w-full h-full" 
            style={{ stroke: "url(#blue-cyan-gradient)" }} 
            strokeWidth={1.5}
          />
        </div>
      </>
    );
  }

  // 2. Definitive Default: Official "Blue Brain" Icon (Lucide React with Gradient)
  return (
    <div className={`relative ${className}`}>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="blue-cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" /> {/* Sky 500 */}
            <stop offset="100%" stopColor="#2dd4bf" /> {/* Teal 400 */}
          </linearGradient>
        </defs>
      </svg>
      <Brain 
        className="w-full h-full" 
        style={{ stroke: "url(#blue-cyan-gradient)" }} 
        strokeWidth={1.5}
      />
    </div>
  );
};
