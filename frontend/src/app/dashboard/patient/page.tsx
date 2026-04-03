'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '@/components/DashboardShell';
import GlassCard from '@/components/GlassCard';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { getPatientState, type PatientFlow, type DepartmentState } from '@/lib/api';
import { Activity, CheckCircle, Heart } from 'lucide-react';

const FLOW_STEPS: { state: DepartmentState; label: string }[] = [
  { state: 'AWAITING_TRIAGE', label: 'Triage' },
  { state: 'AWAITING_DOCTOR', label: 'Doctor' },
  { state: 'AWAITING_LAB', label: 'Lab' },
  { state: 'AWAITING_DOCTOR_REVIEW', label: 'Review' },
  { state: 'AWAITING_PHARMACY', label: 'Pharmacy' },
  { state: 'DISCHARGED', label: 'Done' },
];

function getStepIndex(state: DepartmentState): number {
  const idx = FLOW_STEPS.findIndex((s) => s.state === state);
  return idx >= 0 ? idx : 0;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const { lastUpdate } = useSocket(user?.id);
  const [flow, setFlow] = useState<PatientFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchState = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getPatientState(user.id);
      setFlow(data);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load your status');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchState(); }, [fetchState, lastUpdate]);

  const currentStep = flow ? getStepIndex(flow.currentState) : 0;

  return (
    <DashboardShell title="My Dashboard" subtitle="Track your visit status">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : error ? (
        <GlassCard padding="md">
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--error)', textAlign: 'center', margin: 0 }}>{error}</p>
        </GlassCard>
      ) : flow ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
          <GlassCard padding="md" style={{ background: 'var(--bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ width: 48, height: 48, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Heart size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  Welcome, {user?.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status:</span>
                  <StatusBadge status={flow.currentState} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="status-dot" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="md" style={{ background: 'var(--bg)' }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px' }}>
              Visit Progress
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {FLOW_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step.state} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {idx > 0 && (
                      <div style={{
                        position: 'absolute', top: 12, left: '-50%', width: '100%', height: 2,
                        background: isCompleted ? 'var(--text)' : 'var(--border)',
                      }} />
                    )}
                    <div style={{
                      width: 24, height: 24, border: `2px solid ${isCurrent ? 'var(--accent-border)' : isCompleted ? 'var(--text)' : 'var(--border)'}`,
                      background: isCurrent ? 'var(--accent)' : isCompleted ? 'var(--text)' : 'var(--bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', zIndex: 1,
                    }}>
                      {isCompleted && <CheckCircle size={12} color="white" />}
                      {isCurrent && <div style={{ width: 8, height: 8, background: 'var(--accent-text)' }} />}
                    </div>
                    <span style={{
                      marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: '0.5rem', fontWeight: isCurrent ? 700 : 400,
                      color: isCurrent ? 'var(--accent-text)' : isCompleted ? 'var(--text)' : 'var(--text-muted)',
                      textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.02em',
                    }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--border)' }}>
            <div style={{ background: 'var(--bg)' }}>
              <StatCard 
                icon={<Activity size={16} />} 
                label="Queue Entered" 
                value={new Date(flow.queueEnteredAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                subtitle={new Date(flow.queueEnteredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              />
            </div>
            <div style={{ background: 'var(--bg)' }}>
              <StatCard 
                icon={<Activity size={16} />} 
                label="Assigned" 
                value={flow.assignedDoctorId ? 'Yes' : 'No'}
                subtitle={flow.assignedDoctorId ? `ID: ${flow.assignedDoctorId.slice(0, 6)}…` : 'Pending'}
              />
            </div>
            <div style={{ background: 'var(--bg)' }}>
              <StatCard 
                icon={<Activity size={16} />} 
                label="Time in Queue" 
                value={(() => { const m = Math.floor((Date.now() - new Date(flow.queueEnteredAt).getTime()) / 60000); return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`; })()}
              />
            </div>
          </div>

          {flow.currentState === 'DISCHARGED' && (
            <GlassCard padding="md" style={{ background: 'var(--bg)' }}>
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle size={32} style={{ marginBottom: 12 }} />
                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
                  Discharged
                </h3>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Your visit is complete. Collect medication from pharmacy if prescribed.
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      ) : null}
    </DashboardShell>
  );
}
