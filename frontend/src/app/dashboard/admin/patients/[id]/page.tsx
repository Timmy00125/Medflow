"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatusBadge from "@/components/StatusBadge";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import {
  getPatientState,
  getPatientNotes,
  getPatientLabResults,
  getPatientVitals,
  getDoctors,
  assignPatientToDoctor,
  type PatientFlow,
  type ConsultationNote,
  type LabTestResult,
  type Vitals,
  type StaffMember
} from "@/lib/api";
import { ArrowLeft, User, Activity, FileText, FlaskConical, Stethoscope, HeartPulse } from "lucide-react";

export default function AdminPatientDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [flow, setFlow] = useState<PatientFlow | null>(null);
  const [notes, setNotes] = useState<ConsultationNote[]>([]);
  const [labs, setLabs] = useState<LabTestResult[]>([]);
  const [vitals, setVitals] = useState<Vitals[]>([]);
  const [doctors, setDoctors] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [f, n, l, v, docs] = await Promise.all([
        getPatientState(id),
        getPatientNotes(id),
        getPatientLabResults(id),
        getPatientVitals(id),
        getDoctors()
      ]);
      setFlow(f);
      setNotes(n);
      setLabs(l);
      setVitals(v);
      setDoctors(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleReassign = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const doctorId = e.target.value;
    if (!doctorId) return;
    setAssigning(true);
    try {
      await assignPatientToDoctor(id, doctorId);
      await fetchData();
    } catch (err) {
      console.error("Failed to reassign doctor", err);
    } finally {
      setAssigning(false);
    }
  };

  const noteCols: QueueColumn[] = [
    { key: "doctor.name", label: "Doctor" },
    { key: "notes", label: "Notes", render: (val) => String(val) },
    { key: "createdAt", label: "Date", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  const labCols: QueueColumn[] = [
    { key: "testName", label: "Test" },
    { key: "status", label: "Status", render: (val) => <StatusBadge status={String(val)} /> },
    { key: "resultData", label: "Result", render: (val) => val ? String(val) : "-" },
    { key: "createdAt", label: "Date Ordered", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  const vitalCols: QueueColumn[] = [
    { key: "nurse.name", label: "Nurse" },
    { key: "bloodPressure", label: "BP", render: (val) => val ? String(val) : "N/A" },
    { key: "heartRate", label: "HR", render: (val) => val ? `${val} bpm` : "N/A" },
    { key: "temperature", label: "Temp", render: (val) => val ? `${val}°C` : "N/A" },
    { key: "createdAt", label: "Recorded", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  return (
    <DashboardShell
      title={`Patient File: ${flow?.patient?.name || "Loading..."}`}
      subtitle="Complete medical history and current status"
      headerActions={
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <ArrowLeft size={16} /> Back
        </button>
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner-lg spinner" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status & Reassignment Card */}
          <GlassCard padding="lg" delay={0}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={20} color="var(--accent)" />
                  {flow?.patient?.name}
                </h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Current State:</span>
                  <StatusBadge status={flow?.currentState || "UNKNOWN"} />
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', minWidth: '250px' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Assigned Doctor
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select 
                    value={flow?.assignedDoctorId || ""} 
                    onChange={handleReassign}
                    disabled={assigning}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.875rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    <option value="">No Doctor Assigned</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name}</option>
                    ))}
                  </select>
                  {assigning && <div className="spinner spinner-sm" />}
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Vitals */}
          <GlassCard padding="none" delay={100} className="animate-slide-up">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartPulse size={18} color="var(--status-triage)" />
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Vitals & Triage</h3>
            </div>
            <QueueTable columns={vitalCols} data={vitals as unknown as Record<string, unknown>[]} emptyMessage="No vitals recorded" />
          </GlassCard>

          {/* Consultations */}
          <GlassCard padding="none" delay={150} className="animate-slide-up">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={18} color="var(--status-doctor)" />
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Consultation Notes</h3>
            </div>
            <QueueTable columns={noteCols} data={notes as unknown as Record<string, unknown>[]} emptyMessage="No notes on file" />
          </GlassCard>

          {/* Lab Results */}
          <GlassCard padding="none" delay={200} className="animate-slide-up">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FlaskConical size={18} color="var(--status-lab)" />
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Laboratory Results</h3>
            </div>
            <QueueTable columns={labCols} data={labs as unknown as Record<string, unknown>[]} emptyMessage="No lab tests ordered" />
          </GlassCard>

        </div>
      )}
    </DashboardShell>
  );
}
