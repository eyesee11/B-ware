'use client';

import { useEffect, useRef, useState, HTMLAttributes } from 'react';

interface FadeInSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function FadeInSection({
  children,
  className = '',
  ...props
}: FadeInSectionProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade in on mount immediately
    setIsVisible(true);
  }, []);

  return (
    <div
      className={`relative z-10 transition-all duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      }}
      {...props}
    >
      {children}
    </div>
  );
}
