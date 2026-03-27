'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '@/components/DashboardShell';
import GlassCard from '@/components/GlassCard';
import StatCard from '@/components/StatCard';
import QueueTable, { type QueueColumn } from '@/components/QueueTable';
import StatusBadge from '@/components/StatusBadge';
import { useSocket } from '@/hooks/useSocket';
import { getTriageQueue, getNurseQueue, advancePatient, type PatientFlow } from '@/lib/api';
import { ClipboardList, UserCheck, RefreshCw, X, CheckCircle } from 'lucide-react';

export default function NurseDashboard() {
  const { lastUpdate } = useSocket();
  const [triageQueue, setTriageQueue] = useState<PatientFlow[]>([]);
  const [reviewQueue, setReviewQueue] = useState<PatientFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientFlow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchQueues = useCallback(async () => {
    try {
      const [triage, review] = await Promise.all([getTriageQueue(), getNurseQueue()]);
      setTriageQueue(triage);
      setReviewQueue(review);
    } catch (err) {
      console.error('Failed to fetch queues', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues, lastUpdate]);

  const handleAssignToDoctor = async (patientId: string) => {
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await advancePatient(patientId, 'AWAITING_DOCTOR');
      setSuccessMsg('Patient assigned to doctor');
      setSelectedPatient(null);
      fetchQueues();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to assign patient');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDischarge = async (patientId: string) => {
    setActionLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await advancePatient(patientId, 'DISCHARGED');
      setSuccessMsg('Patient discharged successfully');
      setSelectedPatient(null);
      fetchQueues();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to discharge');
    } finally {
      setActionLoading(false);
    }
  };

  const triageColumns: QueueColumn[] = [
    { key: 'patient.name', label: 'Patient' },
    { key: 'currentState', label: 'Status' },
    {
      key: 'queueEnteredAt',
      label: 'Waiting',
      render: (value) => {
        const mins = Math.floor((Date.now() - new Date(String(value)).getTime()) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
      },
    },
  ];

  const reviewColumns: QueueColumn[] = [
    { key: 'patient.name', label: 'Patient' },
    {
      key: 'queueEnteredAt',
      label: 'Waiting',
      render: (value) => {
        const mins = Math.floor((Date.now() - new Date(String(value)).getTime()) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
      },
    },
  ];

  return (
    <DashboardShell
      title="Nurse Dashboard"
      subtitle={`${triageQueue.length} awaiting triage • ${reviewQueue.length} for review`}
      headerActions={
        <button onClick={fetchQueues} className="btn btn-ghost btn-sm">
          <RefreshCw size={14} />
        </button>
      }
    >
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
          {successMsg}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard
          icon={<ClipboardList size={20} />}
          label="Awaiting Triage"
          value={triageQueue.length}
          subtitle="New patients"
          accentColor="var(--warning)"
          delay={0}
        />
        <StatCard
          icon={<UserCheck size={20} />}
          label="Awaiting Discharge"
          value={reviewQueue.length}
          subtitle="Post-pharmacy"
          accentColor="var(--success)"
          delay={50}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <GlassCard padding="none" delay={100}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Triage Queue
            </h3>
          </div>
          <QueueTable
            columns={triageColumns}
            data={triageQueue as unknown as Record<string, unknown>[]}
            emptyMessage="No patients awaiting triage"
            isLoading={loading}
            selectedId={selectedPatient?.patientId}
            onRowClick={(row) => setSelectedPatient(row as unknown as PatientFlow)}
          />
        </GlassCard>

        <GlassCard padding="none" delay={150}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Awaiting Doctor Review
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Post-pharmacy patients ready for discharge
            </p>
          </div>
          <QueueTable
            columns={reviewColumns}
            data={reviewQueue as unknown as Record<string, unknown>[]}
            emptyMessage="No patients awaiting review"
            isLoading={loading}
            selectedId={selectedPatient?.patientId}
            onRowClick={(row) => setSelectedPatient(row as unknown as PatientFlow)}
            actions={(row) => {
              const patient = row as unknown as PatientFlow;
              return (
                <button
                  className="btn btn-success btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDischarge(patient.patientId);
                  }}
                  disabled={actionLoading}
                >
                  <CheckCircle size={12} /> Discharge
                </button>
              );
            }}
          />
        </GlassCard>
      </div>

      {selectedPatient && (
        <GlassCard className="animate-fade-in-up" padding="md" delay={0} style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                {selectedPatient.patient?.name}
              </h3>
              <StatusBadge status={selectedPatient.currentState} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {selectedPatient.currentState === 'AWAITING_TRIAGE' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAssignToDoctor(selectedPatient.patientId)}
                  disabled={actionLoading}
                >
                  Assign to Doctor
                </button>
              )}
              {selectedPatient.currentState === 'AWAITING_DOCTOR_REVIEW' && (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleDischarge(selectedPatient.patientId)}
                  disabled={actionLoading}
                >
                  <CheckCircle size={14} /> Discharge Patient
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPatient(null)}>
                Close
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </DashboardShell>
  );
}
