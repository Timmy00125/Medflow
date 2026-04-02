"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import { getStaffHistory, type StaffHistory } from "@/lib/api";
import { ArrowLeft, Users, Activity, Eye, ClipboardList } from "lucide-react";

export default function NurseHistoryPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [history, setHistory] = useState<StaffHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getStaffHistory(id);
        setHistory(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [id]);

  const cols: QueueColumn[] = [
    { key: "patient.name", label: "Patient" },
    { key: "bloodPressure", label: "BP", render: (val) => val ? String(val) : "N/A" },
    { key: "temperature", label: "Temp", render: (val) => val ? `${val}°C` : "N/A" },
    { key: "notes", label: "Triage Notes", render: (val) => String(val || "").substring(0, 50) + (String(val).length > 50 ? "..." : "") },
    { key: "createdAt", label: "Date", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  return (
    <DashboardShell
      title="Nurse Triage History"
      subtitle="Triaged patients and recorded vitals"
      headerActions={
        <button className="btn btn-ghost" onClick={() => router.push('/dashboard/admin/nurses')} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <ArrowLeft size={16} /> Back to Nurses
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard
          icon={<ClipboardList size={20} />}
          label="Total Triages"
          value={history ? history.vitals.length : 0}
          accentColor="var(--status-triage)"
          delay={0}
        />
        <StatCard
          icon={<Users size={20} />}
          label="Unique Patients"
          value={history ? new Set(history.vitals.map(v => v.patientId)).size : 0}
          accentColor="var(--accent)"
          delay={50}
        />
      </div>

      <GlassCard padding="none" delay={100} className="animate-slide-up">
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            Recent Vitals Recorded
          </h3>
        </div>
        <QueueTable
          columns={cols}
          data={history ? history.vitals as unknown as Record<string, unknown>[] : []}
          isLoading={loading}
          emptyMessage="No vitals recorded by this nurse"
          actions={(row) => (
            <button
               className="btn btn-ghost btn-sm"
               onClick={() => router.push(`/dashboard/admin/patients/${row.patientId}`)}
               style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <Eye size={14} /> View Patient
            </button>
          )}
        />
      </GlassCard>
    </DashboardShell>
  );
}
