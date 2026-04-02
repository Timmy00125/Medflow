"use client";

import React, { useState, useEffect, useCallback } from "react";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import { useSocket } from "@/hooks/useSocket";
import {
  getTriageQueue,
  getNurseQueue,
  getDoctors,
  ApiError,
  advancePatient,
  assignPatientToDoctor,
  recordVitals,
  type PatientFlow,
  type StaffMember,
  type Vitals,
} from "@/lib/api";
import {
  ClipboardList,
  UserCheck,
  RefreshCw,
  X,
  CheckCircle,
} from "lucide-react";

export default function NurseDashboard() {
  const { lastUpdate } = useSocket();
  const [triageQueue, setTriageQueue] = useState<PatientFlow[]>([]);
  const [reviewQueue, setReviewQueue] = useState<PatientFlow[]>([]);
  const [doctors, setDoctors] = useState<StaffMember[]>([]);
  const [doctorSelectionByPatient, setDoctorSelectionByPatient] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [selectedIntakePatient, setSelectedIntakePatient] = useState<PatientFlow | null>(null);
  const [intakeDoctorId, setIntakeDoctorId] = useState("");
  const [vitalsData, setVitalsData] = useState<Partial<Vitals>>({
    temperature: undefined,
    bloodPressure: "",
    heartRate: undefined,
    weight: undefined,
  });

  const fetchQueues = useCallback(async () => {
    try {
      const [triage, review] = await Promise.all([
        getTriageQueue(),
        getNurseQueue(),
      ]);

      let doctorList: StaffMember[] = [];
      try {
        doctorList = await getDoctors();
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setErrorMsg(
            `Unable to load doctors list (${err.status}): ${err.message}`,
          );
        } else {
          setErrorMsg("Unable to load doctors list. Please try again.");
        }
      }

      setTriageQueue(triage);
      setReviewQueue(review);
      setDoctors(doctorList);
      if (doctorList.length === 0 && triage.length > 0) {
        setErrorMsg(
          (prev) =>
            prev ||
            "No doctors are available yet. Create doctor accounts first.",
        );
      }
    } catch (err) {
      console.error("Failed to fetch queues", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues, lastUpdate]);

  const handleIntakeSubmit = async () => {
    if (!selectedIntakePatient || !intakeDoctorId) {
      setErrorMsg("Please select a doctor before assigning the patient");
      return;
    }
    setActionLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      // First record vitals
      await recordVitals(selectedIntakePatient.patientId, vitalsData);
      // Then assign doctor (which advances state)
      await assignPatientToDoctor(selectedIntakePatient.patientId, intakeDoctorId);
      
      setSuccessMsg("Patient intake complete. Vitals recorded and assigned to doctor.");
      setVitalsModalOpen(false);
      setSelectedIntakePatient(null);
      setVitalsData({ temperature: undefined, bloodPressure: "", heartRate: undefined, weight: undefined });
      fetchQueues();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to process intake",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDischarge = async (patientId: string) => {
    setActionLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await advancePatient(patientId, "DISCHARGED");
      setSuccessMsg("Patient discharged successfully");
      fetchQueues();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to discharge");
    } finally {
      setActionLoading(false);
    }
  };

  const triageColumns: QueueColumn[] = [
    { key: "patient.name", label: "Patient" },
    { key: "currentState", label: "Status" },
    {
      key: "queueEnteredAt",
      label: "Waiting",
      render: (value) => {
        const mins = Math.floor(
          (Date.now() - new Date(String(value)).getTime()) / 60000,
        );
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
      },
    },
  ];

  const reviewColumns: QueueColumn[] = [
    { key: "patient.name", label: "Patient" },
    {
      key: "queueEnteredAt",
      label: "Waiting",
      render: (value) => {
        const mins = Math.floor(
          (Date.now() - new Date(String(value)).getTime()) / 60000,
        );
        if (mins < 1) return "Just now";
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
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--success-bg)",
            color: "var(--success)",
            fontSize: "0.8125rem",
            marginBottom: "20px",
            border: "1px solid rgba(52, 211, 153, 0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {successMsg}
          <button
            className="btn-ghost btn-icon"
            onClick={() => setSuccessMsg("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {errorMsg && (
        <div
          className="animate-fade-in-down"
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--error-bg)",
            color: "var(--error)",
            fontSize: "0.8125rem",
            marginBottom: "20px",
            border: "1px solid rgba(248, 113, 113, 0.2)",
          }}
        >
          {errorMsg}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
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

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        <GlassCard padding="none" delay={100}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                margin: 0,
                color: "var(--text-primary)",
              }}
            >
              Triage Queue
            </h3>
          </div>
          <QueueTable
            columns={triageColumns}
            data={triageQueue as unknown as Record<string, unknown>[]}
            emptyMessage="No patients awaiting triage"
            isLoading={loading}
            actions={(row) => {
              const patient = row as unknown as PatientFlow;
              return (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIntakePatient(patient);
                      setVitalsModalOpen(true);
                    }}
                    disabled={actionLoading || doctors.length === 0}
                  >
                    Intake Patient
                  </button>
                </div>
              );
            }}
          />
        </GlassCard>

        <GlassCard padding="none" delay={150}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                margin: 0,
                color: "var(--text-primary)",
              }}
            >
              Awaiting Doctor Review
            </h3>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                margin: "4px 0 0",
              }}
            >
              Post-pharmacy patients ready for discharge
            </p>
          </div>
          <QueueTable
            columns={reviewColumns}
            data={reviewQueue as unknown as Record<string, unknown>[]}
            emptyMessage="No patients awaiting review"
            isLoading={loading}
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

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: var(--bg-primary);
          padding: 24px;
          border-radius: var(--radius-lg);
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
        }
      `}</style>
      
      {vitalsModalOpen && selectedIntakePatient && (
        <div className="modal-overlay animate-fade-in" onClick={() => setVitalsModalOpen(false)}>
          <div className="modal-content animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Patient Intake</h3>
              <button className="btn-icon" onClick={() => setVitalsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>{selectedIntakePatient.patient?.name}</p>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Capture vitals and assign to a doctor to proceed.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label>Temperature (°C)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={vitalsData.temperature || ''} 
                  onChange={e => setVitalsData({...vitalsData, temperature: parseFloat(e.target.value)})}
                  placeholder="e.g. 37.2"
                />
              </div>
              <div>
                <label>Blood Pressure (mmHg)</label>
                <input 
                  type="text" 
                  value={vitalsData.bloodPressure || ''} 
                  onChange={e => setVitalsData({...vitalsData, bloodPressure: e.target.value})}
                  placeholder="e.g. 120/80"
                />
              </div>
              <div>
                <label>Heart Rate (bpm)</label>
                <input 
                  type="number" 
                  value={vitalsData.heartRate || ''} 
                  onChange={e => setVitalsData({...vitalsData, heartRate: parseInt(e.target.value)})}
                  placeholder="e.g. 75"
                />
              </div>
              <div>
                <label>Weight (kg)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={vitalsData.weight || ''} 
                  onChange={e => setVitalsData({...vitalsData, weight: parseFloat(e.target.value)})}
                  placeholder="e.g. 70.5"
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label>Assign to Doctor</label>
              <select 
                value={intakeDoctorId} 
                onChange={e => setIntakeDoctorId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                <option value="">Select Doctor...</option>
                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => setVitalsModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleIntakeSubmit}
                disabled={actionLoading || !intakeDoctorId}
              >
                {actionLoading ? 'Saving...' : 'Complete Intake'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
