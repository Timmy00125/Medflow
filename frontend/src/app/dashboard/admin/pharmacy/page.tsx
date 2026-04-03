"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import StatusBadge from "@/components/StatusBadge";
import { getAllPrescriptions, getInventory, type Prescription, type InventoryItem } from "@/lib/api";
import { Pill, CheckCircle, RefreshCw, Package, Clock } from "lucide-react";

export default function AdminPharmacyPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rxs, inv] = await Promise.all([getAllPrescriptions(), getInventory()]);
      setPrescriptions(rxs);
      setInventory(inv);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingCount = prescriptions.filter(p => p.status === 'PENDING').length;
  const dispensedCount = prescriptions.filter(p => p.status === 'DISPENSED').length;

  const rxCols: QueueColumn[] = [
    { key: "patient.name", label: "Patient" },
    { key: "drugName", label: "Drug" },
    { key: "dosage", label: "Dosage" },
    { key: "status", label: "Status", render: (val) => <StatusBadge status={String(val)} /> },
    { key: "pharmacist.name", label: "Dispensed By", render: (val) => val ? String(val) : "-" },
    { key: "createdAt", label: "Prescribed", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  const invCols: QueueColumn[] = [
    { key: "drugName", label: "Drug Name" },
    { key: "stock", label: "Stock", render: (val) => (
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: Number(val) < 10 ? 'var(--error)' : 'inherit' }}>
        {String(val)}
      </span>
    )},
    { key: "updatedAt", label: "Updated", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  return (
    <DashboardShell
      title="Pharmacy System"
      subtitle={`${prescriptions.length} rx · ${pendingCount} pending`}
      headerActions={
        <button className="btn btn-sm" onClick={fetchData}>
          <RefreshCw size={12} /> Refresh
        </button>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px", background: "var(--border)", marginBottom: "16px" }}>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<Pill size={20} />} label="Total Rx" value={prescriptions.length} />
        </div>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<CheckCircle size={20} />} label="Dispensed" value={dispensedCount} />
        </div>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<Clock size={20} />} label="Pending" value={pendingCount} />
        </div>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<Package size={20} />} label="Inventory" value={inventory.length} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)" }}>
        <GlassCard padding="none" style={{ background: "var(--bg)" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
            <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              Prescriptions Ledger
            </h3>
          </div>
          <QueueTable columns={rxCols} data={prescriptions as unknown as Record<string, unknown>[]} isLoading={loading} emptyMessage="No prescriptions" />
        </GlassCard>

        <GlassCard padding="none" style={{ background: "var(--bg)" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
            <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
              Medication Inventory
            </h3>
          </div>
          <QueueTable columns={invCols} data={inventory as unknown as Record<string, unknown>[]} isLoading={loading} emptyMessage="No inventory" />
        </GlassCard>
      </div>
    </DashboardShell>
  );
}
