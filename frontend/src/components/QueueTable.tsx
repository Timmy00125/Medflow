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
      <div className="loading-state">
        <div className="spinner spinner-lg" />
        <span>Loading queue data...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="empty-state">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {actions && <th style={{ textAlign: 'right' }}>Actions</th>}
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
                className={isSelected ? 'selected' : ''}
                style={{
                  cursor: onRowClick ? 'pointer' : 'default',
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
                  <td style={{ textAlign: 'right' }}>
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

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}
