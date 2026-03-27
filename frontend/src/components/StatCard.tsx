'use client';

import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor?: string;
  delay?: number;
}

export default function StatCard({
  icon,
  label,
  value,
  subtitle,
  accentColor = 'var(--accent)',
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className="glass animate-fade-in-up"
      style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-md)',
          background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            color: 'var(--text-muted)',
            marginBottom: '4px',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '4px',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
