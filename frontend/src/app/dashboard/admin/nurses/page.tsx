"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import { useRouter } from "next/navigation";
import { getStaff, getNurseQueue, advancePatient, type StaffMember, type PatientFlow } from "@/lib/api";
import { Users, Activity, Eye, RefreshCw, ClipboardList } from "lucide-react";

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
      subtitle="Manage nurses and triage queues"
      headerActions={
        <button className="btn btn-ghost btn-sm" onClick={fetchData}>
          <RefreshCw size={14} />
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard
          icon={<Users size={20} />}
          label="Total Nurses"
          value={nurses.length}
          accentColor="var(--accent)"
          delay={0}
        />
        <StatCard
          icon={<ClipboardList size={20} />}
          label="Nurse Queue Size"
          value={nurseQueue.length}
          subtitle="Awaiting doctor review"
          accentColor="var(--status-triage)"
          delay={50}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <GlassCard padding="none" delay={100} className="animate-slide-up">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Nurse Queue (Awaiting Doctor Review)
            </h3>
          </div>
          <QueueTable
            columns={queueColumns}
            data={nurseQueue as unknown as Record<string, unknown>[]}
            isLoading={loading}
            emptyMessage="No patients in nurse queue"
            actions={(row) => (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleDischarge(row.patientId as string)}
                style={{ padding: '6px 12px', fontSize: '0.75rem', color: "var(--error)" }}
              >
                Discharge
              </button>
            )}
          />
        </GlassCard>

        <GlassCard padding="none" delay={150} className="animate-slide-up">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Registered Nurses
            </h3>
          </div>
          <QueueTable
            columns={nurseColumns}
            data={nurses as unknown as Record<string, unknown>[]}
            isLoading={loading}
            emptyMessage="No nurses found"
            actions={(row) => (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => router.push(`/dashboard/admin/nurses/${row.id}`)}
                style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                <Eye size={14} /> View Triages
              </button>
            )}
          />
        </GlassCard>
      </div>
    </DashboardShell>
  );
}
