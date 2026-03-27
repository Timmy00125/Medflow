'use client';

import React from 'react';
import type { DepartmentState } from '@/lib/api';

const STATE_CONFIG: Record<DepartmentState, { label: string; color: string; bg: string }> = {
  AWAITING_TRIAGE: {
    label: 'Awaiting Triage',
    color: 'var(--status-triage)',
    bg: 'var(--status-triage-bg)',
  },
  AWAITING_DOCTOR: {
    label: 'Awaiting Doctor',
    color: 'var(--status-doctor)',
    bg: 'var(--status-doctor-bg)',
  },
  AWAITING_LAB: {
    label: 'Awaiting Lab',
    color: 'var(--status-lab)',
    bg: 'var(--status-lab-bg)',
  },
  AWAITING_DOCTOR_REVIEW: {
    label: 'Doctor Review',
    color: 'var(--status-review)',
    bg: 'var(--status-review-bg)',
  },
  AWAITING_PHARMACY: {
    label: 'Awaiting Pharmacy',
    color: 'var(--status-pharmacy)',
    bg: 'var(--status-pharmacy-bg)',
  },
  DISCHARGED: {
    label: 'Discharged',
    color: 'var(--status-discharged)',
    bg: 'var(--status-discharged-bg)',
  },
};

// Also handle generic statuses like PENDING, COMPLETED, DISPENSED
const GENERIC_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: 'var(--status-triage)', bg: 'var(--status-triage-bg)' },
  IN_PROGRESS: { label: 'In Progress', color: 'var(--status-doctor)', bg: 'var(--status-doctor-bg)' },
  COMPLETED: { label: 'Completed', color: 'var(--success)', bg: 'var(--success-bg)' },
  DISPENSED: { label: 'Dispensed', color: 'var(--success)', bg: 'var(--success-bg)' },
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config =
    STATE_CONFIG[status as DepartmentState] ||
    GENERIC_STATUS[status] ||
    { label: status, color: 'var(--text-muted)', bg: 'rgba(107, 114, 128, 0.12)' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '2px 10px' : '4px 14px',
        fontSize: size === 'sm' ? '0.6875rem' : '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: config.color,
        background: config.bg,
        borderRadius: 'var(--radius-full)',
        whiteSpace: 'nowrap' as const,
        lineHeight: 1.4,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}
