'use client';

import React from 'react';
import type { DepartmentState } from '@/lib/api';

const STATE_CONFIG: Record<DepartmentState, { label: string }> = {
  AWAITING_TRIAGE: { label: 'Awaiting Triage' },
  AWAITING_DOCTOR: { label: 'Awaiting Doctor' },
  AWAITING_LAB: { label: 'Awaiting Lab' },
  AWAITING_DOCTOR_REVIEW: { label: 'Doctor Review' },
  AWAITING_PHARMACY: { label: 'Awaiting Pharmacy' },
  DISCHARGED: { label: 'Discharged' },
};

const GENERIC_STATUS: Record<string, { label: string }> = {
  PENDING: { label: 'Pending' },
  IN_PROGRESS: { label: 'In Progress' },
  COMPLETED: { label: 'Completed' },
  DISPENSED: { label: 'Dispensed' },
  NOW_SERVING: { label: 'Now Serving' },
  ACTIVE: { label: 'Active' },
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  isActive?: boolean;
}

export default function StatusBadge({
  status,
  size = 'md',
  isActive = false,
}: StatusBadgeProps) {
  const config =
    STATE_CONFIG[status as DepartmentState] ||
    GENERIC_STATUS[status] ||
    { label: status };

  const isCompact = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: isCompact ? '2px 8px' : '4px 10px',
        fontSize: isCompact ? '0.5625rem' : '0.625rem',
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        lineHeight: 1.4,
        borderWidth: '1px',
        borderStyle: 'solid',
        background: isActive ? 'var(--accent)' : 'var(--bg)',
        borderColor: isActive ? 'var(--accent-border)' : 'var(--border)',
        color: isActive ? 'var(--accent-text)' : 'var(--text)',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
