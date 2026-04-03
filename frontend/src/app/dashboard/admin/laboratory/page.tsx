"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import StatusBadge from "@/components/StatusBadge";
import { getAllLabTests, type LabTest } from "@/lib/api";
import { FlaskConical, CheckCircle, RefreshCw, Clock } from "lucide-react";

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
    { key: "testName", label: "Test" },
    { key: "status", label: "Status", render: (val) => <StatusBadge status={String(val)} /> },
    { key: "labTech.name", label: "Lab Tech", render: (val) => val ? String(val) : "-" },
    { key: "createdAt", label: "Ordered", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  return (
    <DashboardShell
      title="Laboratory System"
      subtitle={`${tests.length} total · ${pendingCount} pending`}
      headerActions={
        <button className="btn btn-sm" onClick={fetchTests}>
          <RefreshCw size={12} /> Refresh
        </button>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px", background: "var(--border)", marginBottom: "16px" }}>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<FlaskConical size={20} />} label="Total Orders" value={tests.length} />
        </div>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<CheckCircle size={20} />} label="Completed" value={completedCount} />
        </div>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<Clock size={20} />} label="Pending" value={pendingCount} />
        </div>
      </div>

      <GlassCard padding="none">
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
          <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Lab Tests Ledger
          </h3>
        </div>
        <QueueTable
          columns={cols}
          data={tests as unknown as Record<string, unknown>[]}
          isLoading={loading}
          emptyMessage="No lab tests ordered yet"
          actions={(row) => (
            <button className="btn btn-sm" onClick={() => alert(row.resultData ? `Result: ${row.resultData}` : "No result uploaded")}>
              View
            </button>
          )}
        />
      </GlassCard>
    </DashboardShell>
  );
}
