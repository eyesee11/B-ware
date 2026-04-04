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
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Unobserve after animation plays once
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={sectionRef}
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
