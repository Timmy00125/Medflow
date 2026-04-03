"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import StatusBadge from "@/components/StatusBadge";
import { useSocket } from "@/hooks/useSocket";
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
} from "@/lib/api";
import {
  Users,
  UserPlus,
  Activity,
  Clock,
  Stethoscope,
  FlaskConical,
  Pill,
  RefreshCw,
} from "lucide-react";

export default function AdminDashboard() {
  const { lastUpdate } = useSocket();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [triageQueue, setTriageQueue] = useState<PatientFlow[]>([]);
  const [doctorQueue, setDoctorQueue] = useState<PatientFlow[]>([]);
  const [labQueue, setLabQueue] = useState<PatientFlow[]>([]);
  const [pharmQueue, setPharmQueue] = useState<PatientFlow[]>([]);
  const [loading, setLoading] = useState(true);

  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "DOCTOR" as Role,
  });
  const [patientForm, setPatientForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
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
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, lastUpdate]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);
    try {
      await createStaff(staffForm);
      setFormSuccess(`Staff member "${staffForm.name}" created`);
      setStaffForm({ name: "", email: "", password: "", role: "DOCTOR" });
      setShowStaffForm(false);
      fetchAll();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create staff");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);
    try {
      await createPatient(patientForm);
      setFormSuccess(`Patient "${patientForm.name}" registered`);
      setPatientForm({ name: "", email: "", password: "" });
      setShowPatientForm(false);
      fetchAll();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create patient");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvanceTriage = async (patientId: string, doctorId?: string) => {
    try {
      await advancePatient(patientId, "AWAITING_DOCTOR", doctorId);
      fetchAll();
    } catch (err) {
      console.error("Failed to advance patient", err);
    }
  };

  const totalInQueue = triageQueue.length + doctorQueue.length + labQueue.length + pharmQueue.length;
  const doctors = staff.filter((s) => s.role === "DOCTOR");
  const nurses = staff.filter((s) => s.role === "NURSE");

  const staffColumns: QueueColumn[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (value) => <StatusBadge status={String(value)} />,
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (value) => new Date(String(value)).toLocaleDateString(),
    },
  ];

  const triageColumns: QueueColumn[] = [
    { key: "patient.name", label: "Patient" },
    { key: "currentState", label: "Status" },
    {
      key: "queueEnteredAt",
      label: "Waiting Since",
      render: (value) => {
        const diff = Date.now() - new Date(String(value)).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
      },
    },
  ];

  return (
    <DashboardShell
      title="Admin Overview"
      subtitle={`${staff.length} staff · ${totalInQueue} in queue`}
      headerActions={
        <button onClick={fetchAll} className="btn btn-sm">
          <RefreshCw size={12} /> Refresh
        </button>
      }
    >
      {formSuccess && (
        <div className="alert alert-success" style={{ marginBottom: "16px" }}>
          <span>{formSuccess}</span>
        </div>
      )}
      {formError && (
        <div className="alert alert-error" style={{ marginBottom: "16px" }}>
          <span>{formError}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px", background: "var(--border)", marginBottom: "16px" }}>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<Users size={20} />} label="Total Staff" value={staff.length} subtitle={`${doctors.length} doctors`} />
        </div>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<Activity size={20} />} label="In Queue" value={totalInQueue} subtitle="Active patients" />
        </div>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<Clock size={20} />} label="Triage" value={triageQueue.length} subtitle="Awaiting" />
        </div>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<Stethoscope size={20} />} label="Doctor" value={doctorQueue.length} subtitle="In consultation" />
        </div>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<FlaskConical size={20} />} label="Lab" value={labQueue.length} subtitle="Pending tests" />
        </div>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<Pill size={20} />} label="Pharmacy" value={pharmQueue.length} subtitle="Pending rx" />
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button className="btn" onClick={() => { setShowStaffForm(!showStaffForm); setShowPatientForm(false); }}>
          <UserPlus size={12} /> Create Staff
        </button>
        <button className="btn" onClick={() => { setShowPatientForm(!showPatientForm); setShowStaffForm(false); }}>
          <UserPlus size={12} /> Register Patient
        </button>
      </div>

      {showStaffForm && (
        <GlassCard padding="md" style={{ marginBottom: "16px" }}>
          <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>
            Create Staff Member
          </h3>
          <form onSubmit={handleCreateStaff} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label>Full Name</label>
              <input type="text" value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} placeholder="Dr. John Smith" required />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} placeholder="john@hospital.com" required />
            </div>
            <div>
              <label>Password</label>
              <input type="password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} placeholder="Secure password" required />
            </div>
            <div>
              <label>Role</label>
              <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as Role })}>
                <option value="DOCTOR">Doctor</option>
                <option value="NURSE">Nurse</option>
                <option value="LAB_TECH">Lab Technician</option>
                <option value="PHARMACIST">Pharmacist</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={() => setShowStaffForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? <div className="spinner" /> : "Create"}</button>
            </div>
          </form>
        </GlassCard>
      )}

      {showPatientForm && (
        <GlassCard padding="md" style={{ marginBottom: "16px" }}>
          <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 16px" }}>
            Register Patient
          </h3>
          <form onSubmit={handleCreatePatient} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label>Full Name</label>
              <input type="text" value={patientForm.name} onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })} placeholder="Jane Doe" required />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={patientForm.email} onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })} placeholder="jane@example.com" required />
            </div>
            <div>
              <label>Password</label>
              <input type="password" value={patientForm.password} onChange={(e) => setPatientForm({ ...patientForm, password: e.target.value })} placeholder="Password" required />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={() => setShowPatientForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? <div className="spinner" /> : "Register"}</button>
            </div>
          </form>
        </GlassCard>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)", marginBottom: "16px" }}>
        <GlassCard padding="none" style={{ background: "var(--bg)" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
            <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              Triage Queue ({triageQueue.length})
            </h3>
          </div>
          <QueueTable
            columns={triageColumns}
            data={triageQueue as unknown as Record<string, unknown>[]}
            emptyMessage="No patients awaiting triage"
            isLoading={loading}
            actions={(row) => {
              const patientId = row.patientId as string;
              return (
                <select
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) handleAdvanceTriage(patientId, e.target.value); }}
                  style={{ padding: "4px 8px", fontSize: "0.75rem", maxWidth: "140px" }}
                >
                  <option value="">Assign Doctor…</option>
                  {doctors.map((doc) => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
                </select>
              );
            }}
          />
        </GlassCard>

        <GlassCard padding="none" style={{ background: "var(--bg)" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
            <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              Staff Directory ({staff.length})
            </h3>
          </div>
          <QueueTable columns={staffColumns} data={staff as unknown as Record<string, unknown>[]} emptyMessage="No staff" isLoading={loading} />
        </GlassCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)" }}>
        <GlassCard padding="none" style={{ background: "var(--bg)" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
            <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              Nurses ({nurses.length})
            </h3>
          </div>
          <QueueTable columns={staffColumns} data={nurses as unknown as Record<string, unknown>[]} emptyMessage="No nurses" isLoading={loading} />
        </GlassCard>

        <GlassCard padding="md" style={{ background: "var(--bg)" }}>
          <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
            Nurse Capabilities
          </h3>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "8px" }}>
            <p>• View patients in triage queue</p>
            <p>• Assign triage patients to doctors</p>
            <p>• View post-treatment review queue</p>
            <p>• Discharge patients after review</p>
          </div>
        </GlassCard>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          form[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardShell>
  );
}
