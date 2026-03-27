'use client';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animate?: boolean;
  delay?: number;
}

const paddingMap = {
  none: '',
  sm: 'padding: 12px;',
  md: 'padding: 20px;',
  lg: 'padding: 28px;',
};

export default function GlassCard({
  children,
  className = '',
  glow = false,
  padding = 'md',
  animate = true,
  delay = 0,
}: GlassCardProps) {
  return (
    <div
      className={`glass ${glow ? 'glass-glow' : ''} ${animate ? 'animate-fade-in-up' : ''} ${className}`}
      style={{
        ...(padding !== 'none' ? { padding: padding === 'sm' ? '12px' : padding === 'lg' ? '28px' : '20px' } : {}),
        ...(delay > 0 ? { animationDelay: `${delay}ms` } : {}),
      }}
    >
      {children}
    </div>
  );
}
