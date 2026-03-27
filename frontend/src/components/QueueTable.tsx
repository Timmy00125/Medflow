'use client';

import React from 'react';
import StatusBadge from './StatusBadge';

export interface QueueColumn {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface QueueTableProps {
  columns: QueueColumn[];
  data: Record<string, unknown>[];
  emptyMessage?: string;
  onRowClick?: (row: Record<string, unknown>) => void;
  selectedId?: string | null;
  actions?: (row: Record<string, unknown>) => React.ReactNode;
  isLoading?: boolean;
}

export default function QueueTable({
  columns,
  data,
  emptyMessage = 'No items in queue',
  onRowClick,
  selectedId,
  actions,
  isLoading = false,
}: QueueTableProps) {
  if (isLoading) {
    return (
      <div
        style={{
          padding: '48px 24px',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div className="spinner-lg spinner" />
        <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
          Loading queue data…
        </span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center' as const,
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' as const }}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {actions && <th style={{ textAlign: 'right' as const }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const id = (row.id as string) || (row.patientId as string) || String(idx);
            const isSelected = selectedId === id || selectedId === (row.patientId as string);
            return (
              <tr
                key={id}
                onClick={() => onRowClick?.(row)}
                className="animate-fade-in-up"
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  animationDelay: `${idx * 40}ms`,
                  background: isSelected ? 'rgba(34, 211, 238, 0.06)' : undefined,
                }}
              >
                {columns.map((col) => {
                  const value = getNestedValue(row, col.key);
                  return (
                    <td key={col.key}>
                      {col.render
                        ? col.render(value, row)
                        : col.key === 'currentState' || col.key === 'status'
                          ? <StatusBadge status={String(value || '')} size="sm" />
                          : String(value ?? '—')}
                    </td>
                  );
                })}
                {actions && (
                  <td style={{ textAlign: 'right' as const }}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Helper: access nested keys like "patient.name"
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}
