'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '@/components/DashboardShell';
import GlassCard from '@/components/GlassCard';
import StatCard from '@/components/StatCard';
import QueueTable, { type QueueColumn } from '@/components/QueueTable';
import StatusBadge from '@/components/StatusBadge';
import { useSocket } from '@/hooks/useSocket';
import {
  getStaff,
  createStaff,
  createPatient,
  getTriageQueue,
  getDoctorQueue,
  getLabQueue,
  getPharmacyQueue,
  advancePatient,
  type StaffMember,
  type PatientFlow,
  type Role,
  type DepartmentState,
} from '@/lib/api';
import {
  Users,
  UserPlus,
  Activity,
  Clock,
  Stethoscope,
  FlaskConical,
  Pill,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

export default function AdminDashboard() {
  const { lastUpdate } = useSocket();

  // State
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [triageQueue, setTriageQueue] = useState<PatientFlow[]>([]);
  const [doctorQueue, setDoctorQueue] = useState<PatientFlow[]>([]);
  const [labQueue, setLabQueue] = useState<PatientFlow[]>([]);
  const [pharmQueue, setPharmQueue] = useState<PatientFlow[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'DOCTOR' as Role });
  const [patientForm, setPatientForm] = useState({ name: '', email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [s, tq, dq, lq, pq] = await Promise.all([
        getStaff(),
        getTriageQueue(),
        getDoctorQueue(),
        getLabQueue(),
        getPharmacyQueue(),
      ]);
      setStaff(s);
      setTriageQueue(tq);
      setDoctorQueue(dq);
      setLabQueue(lq);
      setPharmQueue(pq);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, lastUpdate]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);
    try {
      await createStaff(staffForm);
      setFormSuccess(`Staff member "${staffForm.name}" created successfully`);
      setStaffForm({ name: '', email: '', password: '', role: 'DOCTOR' });
      setShowStaffForm(false);
      fetchAll();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);
    try {
      await createPatient(patientForm);
      setFormSuccess(`Patient "${patientForm.name}" registered successfully`);
      setPatientForm({ name: '', email: '', password: '' });
      setShowPatientForm(false);
      fetchAll();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvanceTriage = async (patientId: string, doctorId?: string) => {
    try {
      await advancePatient(patientId, 'AWAITING_DOCTOR', doctorId);
      fetchAll();
    } catch (err) {
      console.error('Failed to advance patient', err);
    }
  };

  const totalInQueue = triageQueue.length + doctorQueue.length + labQueue.length + pharmQueue.length;
  const doctors = staff.filter((s) => s.role === 'DOCTOR');

  const staffColumns: QueueColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--accent-secondary)',
            background: 'var(--accent-secondary-glow)',
            padding: '2px 10px',
            borderRadius: 'var(--radius-full)',
          }}
        >
          {String(value).replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (value) => new Date(String(value)).toLocaleDateString(),
    },
  ];

  const triageColumns: QueueColumn[] = [
    { key: 'patient.name', label: 'Patient' },
    { key: 'currentState', label: 'Status' },
    {
      key: 'queueEnteredAt',
      label: 'Waiting Since',
      render: (value) => {
        const diff = Date.now() - new Date(String(value)).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
      },
    },
  ];

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="System overview and management"
      headerActions={
        <button onClick={fetchAll} className="btn btn-ghost btn-sm" title="Refresh">
          <RefreshCw size={14} />
        </button>
      }
    >
      {/* Success/Error toast */}
      {formSuccess && (
        <div
          className="animate-fade-in-down"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--success-bg)',
            color: 'var(--success)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            marginBottom: '20px',
            border: '1px solid rgba(52, 211, 153, 0.2)',
          }}
        >
          {formSuccess}
        </div>
      )}
      {formError && (
        <div
          className="animate-fade-in-down"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-bg)',
            color: 'var(--error)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            marginBottom: '20px',
            border: '1px solid rgba(248, 113, 113, 0.2)',
          }}
        >
          {formError}
        </div>
      )}

      {/* Stat cards row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <StatCard
          icon={<Users size={20} />}
          label="Total Staff"
          value={staff.length}
          subtitle={`${doctors.length} doctors`}
          accentColor="var(--accent)"
          delay={0}
        />
        <StatCard
          icon={<Activity size={20} />}
          label="In Queue"
          value={totalInQueue}
          subtitle="Active patients"
          accentColor="var(--status-triage)"
          delay={50}
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Triage"
          value={triageQueue.length}
          subtitle="Awaiting triage"
          accentColor="var(--status-triage)"
          delay={100}
        />
        <StatCard
          icon={<Stethoscope size={20} />}
          label="With Doctor"
          value={doctorQueue.length}
          accentColor="var(--status-doctor)"
          delay={150}
        />
        <StatCard
          icon={<FlaskConical size={20} />}
          label="In Lab"
          value={labQueue.length}
          accentColor="var(--status-lab)"
          delay={200}
        />
        <StatCard
          icon={<Pill size={20} />}
          label="Pharmacy"
          value={pharmQueue.length}
          accentColor="var(--status-pharmacy)"
          delay={250}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' as const }}>
        <button
          className="btn btn-primary"
          onClick={() => { setShowStaffForm(!showStaffForm); setShowPatientForm(false); }}
        >
          <UserPlus size={16} />
          Create Staff
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => { setShowPatientForm(!showPatientForm); setShowStaffForm(false); }}
        >
          <UserPlus size={16} />
          Register Patient
        </button>
      </div>

      {/* Staff creation form */}
      {showStaffForm && (
        <GlassCard className="animate-fade-in-down" padding="lg" delay={0}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Create New Staff Member
          </h3>
          <form onSubmit={handleCreateStaff} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label htmlFor="staff-name">Full Name</label>
              <input
                id="staff-name"
                type="text"
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                placeholder="Dr. John Smith"
                required
              />
            </div>
            <div>
              <label htmlFor="staff-email">Email</label>
              <input
                id="staff-email"
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                placeholder="john@hospital.com"
                required
              />
            </div>
            <div>
              <label htmlFor="staff-password">Password</label>
              <input
                id="staff-password"
                type="password"
                value={staffForm.password}
                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                placeholder="Secure password"
                required
              />
            </div>
            <div>
              <label htmlFor="staff-role">Role</label>
              <select
                id="staff-role"
                value={staffForm.role}
                onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as Role })}
              >
                <option value="DOCTOR">Doctor</option>
                <option value="NURSE">Nurse</option>
                <option value="LAB_TECH">Lab Technician</option>
                <option value="PHARMACIST">Pharmacist</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowStaffForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <div className="spinner" /> : 'Create Staff'}
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Patient registration form */}
      {showPatientForm && (
        <GlassCard className="animate-fade-in-down" padding="lg" delay={0}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Register New Patient
          </h3>
          <form onSubmit={handleCreatePatient} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              <label htmlFor="patient-name">Full Name</label>
              <input
                id="patient-name"
                type="text"
                value={patientForm.name}
                onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                placeholder="Jane Doe"
                required
              />
            </div>
            <div>
              <label htmlFor="patient-email">Email</label>
              <input
                id="patient-email"
                type="email"
                value={patientForm.email}
                onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                placeholder="jane@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="patient-password">Password</label>
              <input
                id="patient-password"
                type="password"
                value={patientForm.password}
                onChange={(e) => setPatientForm({ ...patientForm, password: e.target.value })}
                placeholder="Password"
                required
              />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowPatientForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <div className="spinner" /> : 'Register Patient'}
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Two-column layout: Triage Queue + Staff List */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginTop: '20px',
        }}
      >
        {/* Triage Queue */}
        <GlassCard padding="none" delay={100}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Triage Queue
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {triageQueue.length} waiting
            </span>
          </div>
          <QueueTable
            columns={triageColumns}
            data={triageQueue as unknown as Record<string, unknown>[]}
            emptyMessage="No patients awaiting triage"
            isLoading={loading}
            actions={(row) => {
              const patientId = row.patientId as string;
              return (
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <select
                    id={`assign-doctor-${patientId}`}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAdvanceTriage(patientId, e.target.value);
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      maxWidth: '140px',
                    }}
                  >
                    <option value="">Assign Doctor…</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }}
          />
        </GlassCard>

        {/* Staff List */}
        <GlassCard padding="none" delay={150}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Staff Directory
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {staff.length} members
            </span>
          </div>
          <QueueTable
            columns={staffColumns}
            data={staff as unknown as Record<string, unknown>[]}
            emptyMessage="No staff members yet"
            isLoading={loading}
          />
        </GlassCard>
      </div>

      {/* Responsive override */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          form[style*="grid-template-columns: 1fr 1fr 1fr"],
          form[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </DashboardShell>
  );
}
