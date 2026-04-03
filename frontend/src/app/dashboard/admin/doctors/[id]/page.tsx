"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import { getStaffHistory, type StaffHistory } from "@/lib/api";
import { ArrowLeft, Users, FileText, Eye } from "lucide-react";

export default function DoctorHistoryPage() {
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

  const uniquePatients = history 
    ? Array.from(new Set(history.consultations.map(c => c.patientId)))
    : [];

  const cols: QueueColumn[] = [
    { key: "patient.name", label: "Patient" },
    { key: "notes", label: "Notes", render: (val) => String(val).substring(0, 60) + "..." },
    { key: "createdAt", label: "Date", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  return (
    <DashboardShell
      title="Doctor History"
      subtitle="Activity and patient outcomes"
      headerActions={
        <button className="btn btn-sm" onClick={() => router.push('/dashboard/admin/doctors')}>
          <ArrowLeft size={12} /> Back
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: 'var(--border)', marginBottom: '16px' }}>
        <div style={{ background: 'var(--bg)' }}>
          <StatCard icon={<FileText size={20} />} label="Total Consultations" value={history ? history.consultations.length : 0} />
        </div>
        <div style={{ background: 'var(--bg)' }}>
          <StatCard icon={<Users size={20} />} label="Unique Patients" value={uniquePatients.length} />
        </div>
      </div>

      <GlassCard padding="none">
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
          <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Recent Consultations
          </h3>
        </div>
        <QueueTable
          columns={cols}
          data={history ? history.consultations as unknown as Record<string, unknown>[] : []}
          isLoading={loading}
          emptyMessage="No consultations found"
          actions={(row) => (
            <button className="btn btn-sm" onClick={() => router.push(`/dashboard/admin/patients/${row.patientId}`)}>
              <Eye size={12} /> View
            </button>
          )}
        />
      </GlassCard>
    </DashboardShell>
  );
}
