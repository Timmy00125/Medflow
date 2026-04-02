"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/hooks/useSocket";
import {
  getDoctorQueue,
  getLabQueue,
  getNurseQueue,
  getPatientState,
  getPatientLabResults,
  getPatientNotes,
  getPatientVitals,
  getPharmacyQueue,
  getStaff,
  getStaffHistory,
  getTriageQueue,
  type ConsultationNote,
  type LabTestResult,
  type DepartmentState,
  type PatientFlow,
  type Role,
  type StaffHistory,
  type Vitals,
} from "@/lib/api";
import { History, RefreshCw, Search, Users } from "lucide-react";

interface PatientQueueRow {
  patientId: string;
  currentState: DepartmentState;
  queueEnteredAt: string;
  patient?: { id: string; name: string; email?: string };
  sourceQueues: string[];
}

function canReadFullHistory(role: Role): boolean {
  return role === "ADMIN" || role === "DOCTOR";
}

function canOpenPage(role: Role): boolean {
  return role === "ADMIN" || role === "DOCTOR" || role === "NURSE";
}

function toQueueRow(row: PatientFlow, source: string): PatientQueueRow {
  return {
    patientId: row.patientId,
    currentState: row.currentState,
    queueEnteredAt: row.queueEnteredAt,
    patient: row.patient,
    sourceQueues: [source],
  };
}

function uniqueByPatient(
  rows: PatientFlow[],
  source: string,
): Map<string, PatientQueueRow> {
  const map = new Map<string, PatientQueueRow>();
  rows.forEach((row) => {
    const existing = map.get(row.patientId);
    if (!existing) {
      map.set(row.patientId, toQueueRow(row, source));
      return;
    }
    map.set(row.patientId, {
      ...existing,
      sourceQueues: Array.from(new Set([...existing.sourceQueues, source])),
    });
  });
  return map;
}

function getHistoryPatientIds(history: StaffHistory): string[] {
  return Array.from(
    new Set([
      ...history.consultations.map((item) => item.patientId),
      ...history.labTests.map((item) => item.patientId),
      ...history.prescriptions.map((item) => item.patientId),
      ...history.vitals.map((item) => item.patientId),
    ]),
  );
}

export default function CheckPatientsPage() {
  const { user } = useAuth();
  const { lastUpdate } = useSocket();

  const [queueRows, setQueueRows] = useState<PatientQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [consultationNotes, setConsultationNotes] = useState<
    ConsultationNote[]
  >([]);
  const [labResults, setLabResults] = useState<LabTestResult[]>([]);
  const [vitals, setVitals] = useState<Vitals[]>([]);

  const selectedPatient = useMemo(
    () =>
      queueRows.find((item) => item.patientId === selectedPatientId) ?? null,
    [queueRows, selectedPatientId],
  );

  const fetchQueues = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const merged = new Map<string, PatientQueueRow>();

      if (user.role === "ADMIN") {
        const [triage, doctor, lab, pharmacy] = await Promise.all([
          getTriageQueue(),
          getDoctorQueue(),
          getLabQueue(),
          getPharmacyQueue(),
        ]);

        [
          uniqueByPatient(triage, "Triage"),
          uniqueByPatient(doctor, "Doctor"),
          uniqueByPatient(lab, "Laboratory"),
          uniqueByPatient(pharmacy, "Pharmacy"),
        ].forEach((part) => {
          part.forEach((row, patientId) => {
            const existing = merged.get(patientId);
            if (!existing) {
              merged.set(patientId, row);
              return;
            }
            merged.set(patientId, {
              ...existing,
              sourceQueues: Array.from(
                new Set([...existing.sourceQueues, ...row.sourceQueues]),
              ),
            });
          });
        });
      }

      if (user.role === "DOCTOR") {
        const doctorQueue = await getDoctorQueue();
        uniqueByPatient(doctorQueue, "Doctor").forEach((row, patientId) => {
          merged.set(patientId, row);
        });

        const doctorHistory = await getStaffHistory(user.id);
        getHistoryPatientIds(doctorHistory).forEach((patientId) => {
          const existing = merged.get(patientId);
          if (!existing) return;
          merged.set(patientId, {
            ...existing,
            sourceQueues: Array.from(
              new Set([...existing.sourceQueues, "History"]),
            ),
          });
        });
      }

      if (user.role === "NURSE") {
        const [triageQueue, reviewQueue] = await Promise.all([
          getTriageQueue(),
          getNurseQueue(),
        ]);
        [
          uniqueByPatient(triageQueue, "Triage"),
          uniqueByPatient(reviewQueue, "Review"),
        ].forEach((part) => {
          part.forEach((row, patientId) => {
            const existing = merged.get(patientId);
            if (!existing) {
              merged.set(patientId, row);
              return;
            }
            merged.set(patientId, {
              ...existing,
              sourceQueues: Array.from(
                new Set([...existing.sourceQueues, ...row.sourceQueues]),
              ),
            });
          });
        });

        const nurseHistory = await getStaffHistory(user.id);
        getHistoryPatientIds(nurseHistory).forEach((patientId) => {
          const existing = merged.get(patientId);
          if (!existing) return;
          merged.set(patientId, {
            ...existing,
            sourceQueues: Array.from(
              new Set([...existing.sourceQueues, "History"]),
            ),
          });
        });
      }

      if (user.role === "ADMIN") {
        const staff = await getStaff();
        const clinicians = staff.filter(
          (item) => item.role !== "ADMIN" && item.role !== "PATIENT",
        );
        const historyResults = await Promise.allSettled(
          clinicians.map((member) => getStaffHistory(member.id)),
        );

        const historyPatientIds = new Set<string>();
        historyResults.forEach((result) => {
          if (result.status !== "fulfilled") return;
          getHistoryPatientIds(result.value).forEach((patientId) =>
            historyPatientIds.add(patientId),
          );
        });

        Array.from(historyPatientIds).forEach((patientId) => {
          const existing = merged.get(patientId);
          if (!existing) {
            return;
          }
          merged.set(patientId, {
            ...existing,
            sourceQueues: Array.from(
              new Set([...existing.sourceQueues, "History"]),
            ),
          });
        });

        const historyOnlyPatientIds = Array.from(historyPatientIds).filter(
          (patientId) => !merged.has(patientId),
        );

        const stateResults = await Promise.allSettled(
          historyOnlyPatientIds.map((patientId) => getPatientState(patientId)),
        );

        stateResults.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            merged.set(result.value.patientId, {
              ...toQueueRow(result.value, "History"),
            });
            return;
          }

          const fallbackPatientId = historyOnlyPatientIds[idx];
          merged.set(fallbackPatientId, {
            patientId: fallbackPatientId,
            currentState: "DISCHARGED",
            queueEnteredAt: new Date().toISOString(),
            sourceQueues: ["History"],
          });
        });
      }

      const nextRows = Array.from(merged.values()).sort(
        (a, b) =>
          new Date(a.queueEnteredAt).getTime() -
          new Date(b.queueEnteredAt).getTime(),
      );

      setQueueRows(nextRows);
      if (nextRows.length > 0 && !selectedPatientId) {
        setSelectedPatientId(nextRows[0].patientId);
      }
      if (nextRows.length === 0) {
        setSelectedPatientId(null);
      }
    } catch (err) {
      console.error("Failed to fetch patient queues", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPatientId, user]);

  const fetchHistory = useCallback(async () => {
    if (!selectedPatient || !user) return;

    setHistoryLoading(true);
    setHistoryError("");
    setConsultationNotes([]);
    setLabResults([]);
    setVitals([]);

    try {
      if (canReadFullHistory(user.role)) {
        const [notes, labs, vitalsData] = await Promise.all([
          getPatientNotes(selectedPatient.patientId),
          getPatientLabResults(selectedPatient.patientId),
          getPatientVitals(selectedPatient.patientId),
        ]);
        setConsultationNotes(notes);
        setLabResults(labs);
        setVitals(vitalsData);
      } else {
        const vitalsData = await getPatientVitals(selectedPatient.patientId);
        setVitals(vitalsData);
      }
    } catch (err: unknown) {
      setHistoryError(
        err instanceof Error ? err.message : "Unable to load patient history",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedPatient, user]);

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues, lastUpdate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredQueueRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return queueRows;
    return queueRows.filter((row) => {
      const patientName = row.patient?.name?.toLowerCase() ?? "";
      const patientEmail = row.patient?.email?.toLowerCase() ?? "";
      return (
        patientName.includes(search) ||
        patientEmail.includes(search) ||
        row.patientId.includes(search)
      );
    });
  }, [query, queueRows]);

  const queueColumns: QueueColumn[] = [
    { key: "patient.name", label: "Patient" },
    {
      key: "sourceQueues",
      label: "Queue",
      render: (_, row) => {
        const item = row as unknown as PatientQueueRow;
        return item.sourceQueues.join(", ");
      },
    },
    {
      key: "currentState",
      label: "Current Status",
      render: (value) => <StatusBadge status={String(value)} />,
    },
    {
      key: "queueEnteredAt",
      label: "Waiting",
      render: (value) => {
        const minutes = Math.floor(
          (Date.now() - new Date(String(value)).getTime()) / 60000,
        );
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
      },
    },
  ];

  if (!user) return null;

  if (!canOpenPage(user.role)) {
    return (
      <DashboardShell
        title="Check Patients"
        subtitle="This view is available for Admin, Doctor, and Nurse roles"
      >
        <GlassCard padding="lg" delay={0}>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>
            Your role cannot access patient checking tools.
          </p>
        </GlassCard>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Check Patients"
      subtitle="Review current and historical patients, then open full patient files"
      headerActions={
        <button
          onClick={fetchQueues}
          className="btn btn-ghost btn-sm"
          title="Refresh patient list"
        >
          <RefreshCw size={14} />
        </button>
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: "20px",
        }}
      >
        <GlassCard padding="none" delay={0}>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <Users size={16} color="var(--accent)" />
              <h3
                style={{
                  fontSize: "0.9375rem",
                  margin: 0,
                  color: "var(--text-primary)",
                }}
              >
                Active Patients
              </h3>
            </div>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: 10,
                  color: "var(--text-muted)",
                }}
              />
              <input
                placeholder="Search by patient name or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ paddingLeft: "32px" }}
              />
            </div>
          </div>

          <QueueTable
            columns={queueColumns}
            data={filteredQueueRows as unknown as Record<string, unknown>[]}
            emptyMessage="No active patients found"
            isLoading={loading}
            selectedId={selectedPatientId}
            onRowClick={(row) => {
              const selected = row as unknown as PatientQueueRow;
              setSelectedPatientId(selected.patientId);
            }}
            actions={(row) => {
              const selected = row as unknown as PatientQueueRow;
              if (user.role !== "ADMIN") {
                return null;
              }
              return (
                <Link
                  href={`/dashboard/admin/patients/${selected.patientId}`}
                  className="btn btn-ghost btn-sm"
                  onClick={(event) => event.stopPropagation()}
                >
                  Open File
                </Link>
              );
            }}
          />
        </GlassCard>

        <GlassCard padding="md" delay={80}>
          {selectedPatient ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.05rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    {selectedPatient.patient?.name ?? "Unknown patient"}
                  </h3>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {selectedPatient.patient?.email ?? "No email available"}
                  </p>
                </div>
                <StatusBadge status={selectedPatient.currentState} />
              </div>

              {historyLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "30px 0",
                  }}
                >
                  <div className="spinner spinner-lg" />
                </div>
              ) : (
                <>
                  {historyError ? (
                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--error-bg)",
                        color: "var(--error)",
                        fontSize: "0.8125rem",
                      }}
                    >
                      {historyError}
                    </div>
                  ) : null}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <History size={14} color="var(--status-triage)" />
                        <strong style={{ fontSize: "0.8125rem" }}>
                          Vitals
                        </strong>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.8125rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {vitals.length} records
                      </p>
                    </div>

                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <History size={14} color="var(--status-doctor)" />
                        <strong style={{ fontSize: "0.8125rem" }}>
                          Consultation Notes
                        </strong>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.8125rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {canReadFullHistory(user.role)
                          ? `${consultationNotes.length} notes`
                          : "Available for Doctor and Admin roles"}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <History size={14} color="var(--status-lab)" />
                        <strong style={{ fontSize: "0.8125rem" }}>
                          Lab Results
                        </strong>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.8125rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {canReadFullHistory(user.role)
                          ? `${labResults.length} results`
                          : "Available for Doctor and Admin roles"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Select a patient to see history.
            </div>
          )}
        </GlassCard>
      </div>

      <style>{`
        @media (max-width: 980px) {
          div[style*='grid-template-columns: 420px 1fr'] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </DashboardShell>
  );
}
