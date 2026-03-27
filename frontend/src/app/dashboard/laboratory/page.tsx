'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '@/components/DashboardShell';
import GlassCard from '@/components/GlassCard';
import StatCard from '@/components/StatCard';
import QueueTable, { type QueueColumn } from '@/components/QueueTable';
import { useSocket } from '@/hooks/useSocket';
import { getLabWorklist, uploadLabResult, type LabTest } from '@/lib/api';
import { FlaskConical, Upload, CheckCircle, RefreshCw, X, FileText } from 'lucide-react';

export default function LaboratoryDashboard() {
  const { lastUpdate } = useSocket();
  const [worklist, setWorklist] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [resultData, setResultData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchWorklist = useCallback(async () => {
    try {
      const data = await getLabWorklist();
      setWorklist(data);
    } catch (err) {
      console.error('Failed to fetch lab worklist', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorklist();
  }, [fetchWorklist, lastUpdate]);

  const handleUploadResult = async () => {
    if (!selectedTest || !resultData.trim()) return;
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await uploadLabResult(selectedTest.id, resultData);
      setSuccessMsg(`Result for "${selectedTest.testName}" uploaded. Patient returned to doctor.`);
      setSelectedTest(null);
      setResultData('');
      fetchWorklist();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload result');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: QueueColumn[] = [
    { key: 'patient.name', label: 'Patient' },
    { key: 'testName', label: 'Test' },
    { key: 'status', label: 'Status' },
    {
      key: 'createdAt',
      label: 'Ordered',
      render: (value) => {
        const date = new Date(String(value));
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      },
    },
  ];

  return (
    <DashboardShell
      title="Laboratory Dashboard"
      subtitle={`${worklist.length} pending tests`}
      headerActions={
        <button onClick={fetchWorklist} className="btn btn-ghost btn-sm">
          <RefreshCw size={14} />
        </button>
      }
    >
      {/* Feedback */}
      {successMsg && (
        <div
          className="animate-fade-in-down"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--success-bg)',
            color: 'var(--success)',
            fontSize: '0.8125rem',
            marginBottom: '20px',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} /> {successMsg}
          </span>
          <button className="btn-ghost btn-icon" onClick={() => setSuccessMsg('')}>
            <X size={14} />
          </button>
        </div>
      )}
      {errorMsg && (
        <div
          className="animate-fade-in-down"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-bg)',
            color: 'var(--error)',
            fontSize: '0.8125rem',
            marginBottom: '20px',
            border: '1px solid rgba(248, 113, 113, 0.2)',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          icon={<FlaskConical size={20} />}
          label="Pending Tests"
          value={worklist.length}
          subtitle="Awaiting results"
          accentColor="var(--status-lab)"
          delay={0}
        />
        <StatCard
          icon={<FileText size={20} />}
          label="Selected Test"
          value={selectedTest ? selectedTest.testName : '—'}
          subtitle={selectedTest ? `Patient: ${selectedTest.patient?.name}` : 'Select a test'}
          accentColor="var(--accent)"
          delay={50}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
        {/* Worklist table */}
        <GlassCard padding="none" delay={100}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Test Worklist
            </h3>
          </div>
          <QueueTable
            columns={columns}
            data={worklist as unknown as Record<string, unknown>[]}
            emptyMessage="No pending lab tests"
            isLoading={loading}
            selectedId={selectedTest?.id}
            onRowClick={(row) => {
              setSelectedTest(row as unknown as LabTest);
              setResultData('');
              setSuccessMsg('');
              setErrorMsg('');
            }}
          />
        </GlassCard>

        {/* Result upload panel */}
        <div>
          {selectedTest ? (
            <GlassCard glow padding="md" className="animate-fade-in-up" delay={0}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                Upload Result
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                Test: <strong style={{ color: 'var(--accent)' }}>{selectedTest.testName}</strong>
                {' · '}Patient: {selectedTest.patient?.name}
              </p>

              <label htmlFor="result-data">Result Data</label>
              <textarea
                id="result-data"
                value={resultData}
                onChange={(e) => setResultData(e.target.value)}
                placeholder="Enter test results, values, observations…"
                rows={8}
                style={{ resize: 'vertical' as const }}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedTest(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleUploadResult}
                  disabled={submitting || !resultData.trim()}
                >
                  {submitting ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <Upload size={14} /> Upload Result
                    </>
                  )}
                </button>
              </div>
            </GlassCard>
          ) : (
            <GlassCard padding="lg" delay={100}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 0',
                  color: 'var(--text-muted)',
                  gap: '12px',
                }}
              >
                <FlaskConical size={40} strokeWidth={1} />
                <p style={{ fontSize: '0.9375rem', fontWeight: 500, margin: 0 }}>
                  Select a test to upload results
                </p>
                <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                  Click on a pending test from the worklist
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 400px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </DashboardShell>
  );
}
