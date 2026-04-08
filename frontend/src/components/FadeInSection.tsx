'use client';

import { HTMLAttributes } from 'react';

interface FadeInSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function FadeInSection({
  children,
  className = '',
  ...props
}: FadeInSectionProps) {
  return (
    <div
      className={`relative z-10 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
