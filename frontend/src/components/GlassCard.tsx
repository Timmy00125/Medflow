'use client';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export default function GlassCard({
  children,
  className = '',
  padding = 'md',
  style,
}: GlassCardProps) {
  const paddingMap = {
    none: '0',
    sm: '12px',
    md: '16px',
    lg: '24px',
  };

  return (
    <div
      className={`card ${className}`}
      style={{
        padding: paddingMap[padding],
        ...style,
      }}
    >
      {children}
    </div>
  );
}
