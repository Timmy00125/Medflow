"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
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
import { ArrowLeft, User, HeartPulse, Stethoscope, FlaskConical } from "lucide-react";

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
      title={`Patient: ${flow?.patient?.name || "Loading..."}`}
      subtitle="Complete medical history"
      headerActions={
        <button className="btn btn-sm" onClick={() => router.back()}>
          <ArrowLeft size={12} /> Back
        </button>
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
          <GlassCard padding="md" style={{ background: 'var(--bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", fontWeight: 700, margin: '0 0 8px' }}>
                  {flow?.patient?.name}
                </h3>
                <StatusBadge status={flow?.currentState || "UNKNOWN"} />
              </div>

              <div style={{ border: '1px solid var(--border)', padding: '12px', minWidth: '250px' }}>
                <label>Assigned Doctor</label>
                <select 
                  value={flow?.assignedDoctorId || ""} 
                  onChange={handleReassign}
                  disabled={assigning}
                >
                  <option value="">No Doctor Assigned</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="none" style={{ background: 'var(--bg)' }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Vitals & Triage ({vitals.length})
              </h3>
            </div>
            <QueueTable columns={vitalCols} data={vitals as unknown as Record<string, unknown>[]} emptyMessage="No vitals recorded" />
          </GlassCard>

          <GlassCard padding="none" style={{ background: 'var(--bg)' }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Consultation Notes ({notes.length})
              </h3>
            </div>
            <QueueTable columns={noteCols} data={notes as unknown as Record<string, unknown>[]} emptyMessage="No notes on file" />
          </GlassCard>

          <GlassCard padding="none" style={{ background: 'var(--bg)' }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Laboratory Results ({labs.length})
              </h3>
            </div>
            <QueueTable columns={labCols} data={labs as unknown as Record<string, unknown>[]} emptyMessage="No lab tests ordered" />
          </GlassCard>
        </div>
      )}
    </DashboardShell>
  );
}
