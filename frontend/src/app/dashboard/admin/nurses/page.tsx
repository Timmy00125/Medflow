"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import StatusBadge from "@/components/StatusBadge";
import { useRouter } from "next/navigation";
import { getStaff, getNurseQueue, advancePatient, type StaffMember, type PatientFlow } from "@/lib/api";
import { Users, Eye, RefreshCw, ClipboardList } from "lucide-react";

export default function AdminNursesPage() {
  const [nurses, setNurses] = useState<StaffMember[]>([]);
  const [nurseQueue, setNurseQueue] = useState<PatientFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staff, queue] = await Promise.all([getStaff(), getNurseQueue()]);
      setNurses(staff.filter(s => s.role === 'NURSE'));
      setNurseQueue(queue);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDischarge = async (patientId: string) => {
    try {
      await advancePatient(patientId, "DISCHARGED");
      fetchData();
    } catch (err) {
      console.error("Failed to discharge patient", err);
    }
  };

  const nurseColumns: QueueColumn[] = [
    { key: "name", label: "Nurse Name" },
    { key: "email", label: "Email" },
    {
      key: "createdAt",
      label: "Joined",
      render: (val) => new Date(String(val)).toLocaleDateString(),
    },
  ];

  const queueColumns: QueueColumn[] = [
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
      title="Nurses Overview"
      subtitle={`${nurses.length} nurses · ${nurseQueue.length} in queue`}
      headerActions={
        <button className="btn btn-sm" onClick={fetchData}>
          <RefreshCw size={12} /> Refresh
        </button>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px", background: "var(--border)", marginBottom: "16px" }}>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<Users size={20} />} label="Total Nurses" value={nurses.length} />
        </div>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<ClipboardList size={20} />} label="Nurse Queue" value={nurseQueue.length} subtitle="Awaiting review" />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)", marginBottom: "16px" }}>
        <GlassCard padding="none" style={{ background: "var(--bg)" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
            <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              Nurse Queue ({nurseQueue.length})
            </h3>
          </div>
          <QueueTable
            columns={queueColumns}
            data={nurseQueue as unknown as Record<string, unknown>[]}
            isLoading={loading}
            emptyMessage="No patients in nurse queue"
            actions={(row) => (
              <button className="btn btn-sm btn-danger" onClick={() => handleDischarge(row.patientId as string)}>
                Discharge
              </button>
            )}
          />
        </GlassCard>

        <GlassCard padding="none" style={{ background: "var(--bg)" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
            <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              Registered Nurses ({nurses.length})
            </h3>
          </div>
          <QueueTable
            columns={nurseColumns}
            data={nurses as unknown as Record<string, unknown>[]}
            isLoading={loading}
            emptyMessage="No nurses found"
            actions={(row) => (
              <button className="btn btn-sm" onClick={() => router.push(`/dashboard/admin/nurses/${row.id}`)}>
                <Eye size={12} /> View
              </button>
            )}
          />
        </GlassCard>
      </div>
    </DashboardShell>
  );
}
