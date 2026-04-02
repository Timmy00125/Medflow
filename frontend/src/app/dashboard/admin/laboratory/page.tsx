"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import StatusBadge from "@/components/StatusBadge";
import { getAllLabTests, type LabTest } from "@/lib/api";
import { FlaskConical, Search, CheckCircle, RefreshCw, Clock } from "lucide-react";

export default function AdminLaboratoryPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const data = await getAllLabTests();
      setTests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const completedCount = tests.filter(t => t.status === 'COMPLETED').length;
  const pendingCount = tests.filter(t => t.status === 'PENDING').length;

  const cols: QueueColumn[] = [
    { key: "patient.name", label: "Patient" },
    { key: "testName", label: "Test Requested" },
    { key: "status", label: "Status", render: (val) => <StatusBadge status={String(val)} /> },
    { key: "labTech.name", label: "Lab Tech", render: (val) => val ? String(val) : "-" },
    { key: "createdAt", label: "Ordered At", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  return (
    <DashboardShell
      title="Laboratory System"
      subtitle="Monitor all ordered tests, statuses, and results"
      headerActions={
        <button className="btn btn-ghost btn-sm" onClick={fetchTests}>
          <RefreshCw size={14} />
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard
          icon={<FlaskConical size={20} />}
          label="Total Orders"
          value={tests.length}
          accentColor="var(--status-lab)"
          delay={0}
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Completed Tests"
          value={completedCount}
          accentColor="var(--success)"
          delay={50}
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Pending Tests"
          value={pendingCount}
          accentColor="var(--status-triage)"
          delay={100}
        />
      </div>

      <GlassCard padding="none" delay={150} className="animate-slide-up">
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            Master Lab Tests Ledger
          </h3>
        </div>
        <QueueTable
          columns={cols}
          data={tests as unknown as Record<string, unknown>[]}
          isLoading={loading}
          emptyMessage="No lab tests ordered yet."
          actions={(row) => (
            <button
               className="btn btn-ghost btn-sm"
               onClick={() => {
                 if (row.resultData) {
                   alert(`Result Data: ${row.resultData}`);
                 } else {
                   alert("Result not uploaded yet.");
                 }
               }}
               style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <Search size={14} /> View Result
            </button>
          )}
        />
      </GlassCard>
    </DashboardShell>
  );
}
