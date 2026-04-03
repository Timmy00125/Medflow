"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { getStaffHistory, type StaffHistory } from "@/lib/api";
import { Activity, FileText, FlaskConical, Pill, HeartPulse } from "lucide-react";

export default function StaffHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<StaffHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const data = await getStaffHistory(user.id);
        setHistory(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (!user) return null;

  const noteCols: QueueColumn[] = [
    { key: "patient.name", label: "Patient" },
    { key: "notes", label: "Notes", render: (val) => String(val) },
    { key: "createdAt", label: "Date", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  const labCols: QueueColumn[] = [
    { key: "patient.name", label: "Patient" },
    { key: "testName", label: "Test Profile" },
    { key: "status", label: "Status", render: (val) => <StatusBadge status={String(val)} /> },
    { key: "createdAt", label: "Date Uploaded", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  const rxCols: QueueColumn[] = [
    { key: "patient.name", label: "Patient" },
    { key: "drugName", label: "Drug" },
    { key: "dosage", label: "Dosage" },
    { key: "status", label: "Status", render: (val) => <StatusBadge status={String(val)} /> },
    { key: "dispensedAt", label: "Dispensed", render: (val) => val ? new Date(String(val)).toLocaleString() : "-" }
  ];

  const vitalCols: QueueColumn[] = [
    { key: "patient.name", label: "Patient" },
    { key: "bloodPressure", label: "BP", render: (val) => val ? String(val) : "-" },
    { key: "heartRate", label: "HR", render: (val) => val ? `${val} bpm` : "-" },
    { key: "temperature", label: "Temp", render: (val) => val ? `${val}°C` : "-" },
    { key: "createdAt", label: "Date Recorded", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  const totalConsultations = history?.consultations?.length || 0;
  const totalLabs = history?.labTests?.length || 0;
  const totalRxs = history?.prescriptions?.length || 0;
  const totalVitals = history?.vitals?.length || 0;

  return (
    <DashboardShell title="My Activity" subtitle="All actions and records">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: 'var(--border)', marginBottom: '16px' }}>
        <div style={{ background: 'var(--bg)' }}>
          <StatCard icon={<FileText size={20} />} label="Consultations" value={totalConsultations} />
        </div>
        <div style={{ background: 'var(--bg)' }}>
          <StatCard icon={<HeartPulse size={20} />} label="Vitals Triaged" value={totalVitals} />
        </div>
        <div style={{ background: 'var(--bg)' }}>
          <StatCard icon={<FlaskConical size={20} />} label="Lab Tests" value={totalLabs} />
        </div>
        <div style={{ background: 'var(--bg)' }}>
          <StatCard icon={<Pill size={20} />} label="Prescriptions" value={totalRxs} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
        {totalConsultations > 0 && (
          <GlassCard padding="none" style={{ background: 'var(--bg)' }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Consultations ({totalConsultations})
              </h3>
            </div>
            <QueueTable columns={noteCols} data={history?.consultations as unknown as Record<string, unknown>[]} isLoading={loading} emptyMessage="" />
          </GlassCard>
        )}

        {totalVitals > 0 && (
          <GlassCard padding="none" style={{ background: 'var(--bg)' }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Vitals Recorded ({totalVitals})
              </h3>
            </div>
            <QueueTable columns={vitalCols} data={history?.vitals as unknown as Record<string, unknown>[]} isLoading={loading} emptyMessage="" />
          </GlassCard>
        )}

        {totalLabs > 0 && (
          <GlassCard padding="none" style={{ background: 'var(--bg)' }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Lab Tests ({totalLabs})
              </h3>
            </div>
            <QueueTable columns={labCols} data={history?.labTests as unknown as Record<string, unknown>[]} isLoading={loading} emptyMessage="" />
          </GlassCard>
        )}

        {totalRxs > 0 && (
          <GlassCard padding="none" style={{ background: 'var(--bg)' }}>
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Prescriptions ({totalRxs})
              </h3>
            </div>
            <QueueTable columns={rxCols} data={history?.prescriptions as unknown as Record<string, unknown>[]} isLoading={loading} emptyMessage="" />
          </GlassCard>
        )}

        {!loading && totalConsultations === 0 && totalVitals === 0 && totalLabs === 0 && totalRxs === 0 && (
          <GlassCard padding="md" style={{ background: 'var(--bg)', textAlign: 'center' }}>
            <Activity size={32} style={{ opacity: 0.5, marginBottom: '12px' }} />
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              No history found
            </p>
          </GlassCard>
        )}
      </div>
    </DashboardShell>
  );
}
