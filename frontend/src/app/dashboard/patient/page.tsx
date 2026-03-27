'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '@/components/DashboardShell';
import GlassCard from '@/components/GlassCard';
import StatusBadge from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { getPatientState, type PatientFlow, type DepartmentState } from '@/lib/api';
import { Activity, Clock, Stethoscope, FlaskConical, Pill, CheckCircle, Heart } from 'lucide-react';

const FLOW_STEPS: { state: DepartmentState; label: string; icon: React.ReactNode }[] = [
  { state: 'AWAITING_TRIAGE', label: 'Triage', icon: <Clock size={20} /> },
  { state: 'AWAITING_DOCTOR', label: 'Doctor', icon: <Stethoscope size={20} /> },
  { state: 'AWAITING_LAB', label: 'Laboratory', icon: <FlaskConical size={20} /> },
  { state: 'AWAITING_DOCTOR_REVIEW', label: 'Review', icon: <Stethoscope size={20} /> },
  { state: 'AWAITING_PHARMACY', label: 'Pharmacy', icon: <Pill size={20} /> },
  { state: 'DISCHARGED', label: 'Discharged', icon: <CheckCircle size={20} /> },
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
    <DashboardShell title="My Dashboard" subtitle="Track your visit in real-time">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner-lg spinner" />
        </div>
      ) : error ? (
        <GlassCard padding="lg"><p style={{ color: 'var(--error)', textAlign: 'center' as const }}>{error}</p></GlassCard>
      ) : flow ? (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '24px' }}>
          {/* Current status card */}
          <GlassCard glow padding="lg" delay={0}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const }}>
              <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg,var(--accent-dim),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Heart size={26} color="var(--bg-deep)" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Welcome, {user?.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Current Status:</span>
                  <StatusBadge status={flow.currentState} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--success)' }}>
                <Activity size={14} />
                <span>Live updates active</span>
              </div>
            </div>
          </GlassCard>

          {/* Progress tracker */}
          <GlassCard padding="lg" delay={100}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 24px', color: 'var(--text-primary)' }}>
              Visit Progress
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, position: 'relative' as const }}>
              {FLOW_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;
                const isFuture = idx > currentStep;
                return (
                  <div key={step.state} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', position: 'relative' as const }}>
                    {/* Connector line */}
                    {idx > 0 && (
                      <div style={{
                        position: 'absolute' as const, top: 20, right: '50%', width: '100%', height: 3,
                        background: isCompleted || isCurrent ? 'linear-gradient(90deg,var(--accent-dim),var(--accent))' : 'var(--border-strong)',
                        transition: 'background 0.5s ease',
                        zIndex: 0,
                      }} />
                    )}
                    {/* Circle */}
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isCurrent ? 'linear-gradient(135deg,var(--accent-dim),var(--accent))' : isCompleted ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      border: isCurrent ? '2px solid var(--accent)' : isCompleted ? '2px solid var(--accent-dim)' : '2px solid var(--border-strong)',
                      color: isCurrent || isCompleted ? 'var(--bg-deep)' : 'var(--text-muted)',
                      position: 'relative' as const, zIndex: 1,
                      boxShadow: isCurrent ? '0 0 20px var(--accent-glow-strong)' : 'none',
                      transition: 'all 0.4s ease',
                    }}>
                      {isCompleted ? <CheckCircle size={18} /> : step.icon}
                    </div>
                    {/* Label */}
                    <span style={{
                      marginTop: 8, fontSize: '0.6875rem', fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? 'var(--accent)' : isCompleted ? 'var(--text-secondary)' : 'var(--text-muted)',
                      textAlign: 'center' as const, letterSpacing: '0.02em',
                    }}>
                      {step.label}
                    </span>
                    {isCurrent && (
                      <div className="animate-pulse-glow" style={{
                        position: 'absolute' as const, top: 0, width: 42, height: 42, borderRadius: '50%',
                        zIndex: 0,
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Info cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
            <GlassCard padding="md" delay={200}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 8 }}>Queue Entered</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {new Date(flow.queueEnteredAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </GlassCard>
            <GlassCard padding="md" delay={250}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 8 }}>Assigned Doctor</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: flow.assignedDoctorId ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {flow.assignedDoctorId ? `Dr. (${flow.assignedDoctorId.slice(0, 8)}…)` : 'Not yet assigned'}
              </div>
            </GlassCard>
            <GlassCard padding="md" delay={300}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 8 }}>Time in Queue</div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {(() => { const m = Math.floor((Date.now() - new Date(flow.queueEnteredAt).getTime()) / 60000); return m < 60 ? `${m} min` : `${Math.floor(m/60)}h ${m%60}m`; })()}
              </div>
            </GlassCard>
          </div>

          {flow.currentState === 'DISCHARGED' && (
            <GlassCard padding="lg" glow delay={350}>
              <div style={{ textAlign: 'center' as const, padding: '16px 0' }}>
                <CheckCircle size={48} color="var(--success)" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--success)', margin: '0 0 8px' }}>You have been discharged</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Your visit is complete. Please collect any prescribed medication from the pharmacy.</p>
              </div>
            </GlassCard>
          )}
        </div>
      ) : null}
    </DashboardShell>
  );
}
