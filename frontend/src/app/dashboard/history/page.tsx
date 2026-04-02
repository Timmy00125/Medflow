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

  // Derive counts
  const totalConsultations = history?.consultations?.length || 0;
  const totalLabs = history?.labTests?.length || 0;
  const totalRxs = history?.prescriptions?.length || 0;
  const totalVitals = history?.vitals?.length || 0;

  return (
    <DashboardShell
      title="My Activity History"
      subtitle="View all actions and records you've created"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard icon={<FileText size={20} />} label="Consultations" value={totalConsultations} accentColor="var(--status-doctor)" delay={0} />
        <StatCard icon={<HeartPulse size={20} />} label="Vitals Triaged" value={totalVitals} accentColor="var(--status-triage)" delay={50} />
        <StatCard icon={<FlaskConical size={20} />} label="Lab Tests Conducted" value={totalLabs} accentColor="var(--status-lab)" delay={100} />
        <StatCard icon={<Pill size={20} />} label="Prescriptions Dispensed" value={totalRxs} accentColor="var(--status-pharmacy)" delay={150} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {totalConsultations > 0 && (
          <GlassCard padding="none" delay={200} className="animate-slide-up">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--status-doctor)" />
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Consultations & Observations</h3>
            </div>
            <QueueTable columns={noteCols} data={history?.consultations as unknown as Record<string, unknown>[]} isLoading={loading} emptyMessage="" />
          </GlassCard>
        )}

        {totalVitals > 0 && (
          <GlassCard padding="none" delay={250} className="animate-slide-up">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartPulse size={18} color="var(--status-triage)" />
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Vitals Recorded</h3>
            </div>
            <QueueTable columns={vitalCols} data={history?.vitals as unknown as Record<string, unknown>[]} isLoading={loading} emptyMessage="" />
          </GlassCard>
        )}

        {totalLabs > 0 && (
          <GlassCard padding="none" delay={300} className="animate-slide-up">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FlaskConical size={18} color="var(--status-lab)" />
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Lab Tests Uploaded</h3>
            </div>
            <QueueTable columns={labCols} data={history?.labTests as unknown as Record<string, unknown>[]} isLoading={loading} emptyMessage="" />
          </GlassCard>
        )}

        {totalRxs > 0 && (
          <GlassCard padding="none" delay={350} className="animate-slide-up">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pill size={18} color="var(--status-pharmacy)" />
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Prescriptions Dispensed</h3>
            </div>
            <QueueTable columns={rxCols} data={history?.prescriptions as unknown as Record<string, unknown>[]} isLoading={loading} emptyMessage="" />
          </GlassCard>
        )}

        {/* Show a friendly message if there is zero history across all items */}
        {!loading && totalConsultations === 0 && totalVitals === 0 && totalLabs === 0 && totalRxs === 0 && (
          <GlassCard padding="lg" delay={200} className="animate-slide-up">
            <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
              <Activity size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>No history found</h3>
              <p style={{ fontSize: "0.875rem", margin: 0 }}>You haven't recorded any patient interactions yet.</p>
            </div>
          </GlassCard>
        )}
      </div>
    </DashboardShell>
  );
}
