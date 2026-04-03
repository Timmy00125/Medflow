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
      await recordVitals(selectedIntakePatient.patientId, vitalsData);
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
      title="Nurse Desk"
      subtitle={`${triageQueue.length} awaiting triage · ${reviewQueue.length} for review`}
      headerActions={
        <button onClick={fetchQueues} className="btn btn-sm">
          <RefreshCw size={12} />
          Refresh
        </button>
      }
    >
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          <span>{successMsg}</span>
          <button
            onClick={() => setSuccessMsg("")}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--text)',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>{errorMsg}</span>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1px",
          background: "var(--border)",
          border: "1px solid var(--border)",
          marginBottom: "24px",
        }}
      >
        <div style={{ background: "var(--bg)" }}>
          <StatCard
            icon={<ClipboardList size={20} />}
            label="Awaiting Triage"
            value={triageQueue.length}
            subtitle="New patients"
          />
        </div>
        <div style={{ background: "var(--bg)" }}>
          <StatCard
            icon={<UserCheck size={20} />}
            label="Awaiting Discharge"
            value={reviewQueue.length}
            subtitle="Post-pharmacy"
          />
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px", background: "var(--border)" }}
      >
        <GlassCard padding="none" style={{ background: "var(--bg)" }}>
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-muted)",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: 0,
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
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="btn btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIntakePatient(patient);
                      setVitalsModalOpen(true);
                    }}
                    disabled={actionLoading || doctors.length === 0}
                  >
                    Intake
                  </button>
                </div>
              );
            }}
          />
        </GlassCard>

        <GlassCard padding="none" style={{ background: "var(--bg)" }}>
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-muted)",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: 0,
              }}
            >
              Awaiting Doctor Review
            </h3>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.5625rem",
                color: "var(--text-muted)",
                margin: "4px 0 0",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
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
                  className="btn btn-sm"
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

      {vitalsModalOpen && selectedIntakePatient && (
        <div className="modal-overlay" onClick={() => setVitalsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: 0,
                }}
              >
                Patient Intake
              </h3>
              <button
                onClick={() => setVitalsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    margin: "0 0 4px 0",
                  }}
                >
                  {selectedIntakePatient.patient?.name}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6875rem",
                    color: "var(--text-muted)",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Capture vitals and assign to a doctor to proceed.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
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
                  <label>Blood Pressure</label>
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

              <div style={{ marginBottom: '16px' }}>
                <label>Assign to Doctor</label>
                <select 
                  value={intakeDoctorId} 
                  onChange={e => setIntakeDoctorId(e.target.value)}
                >
                  <option value="">Select Doctor...</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn"
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
