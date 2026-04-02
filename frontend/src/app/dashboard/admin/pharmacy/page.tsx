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
    { key: "createdAt", label: "Prescribed At", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  const invCols: QueueColumn[] = [
    { key: "drugName", label: "Drug Name" },
    { key: "stock", label: "Stock Level", render: (val) => (
      <span style={{ color: Number(val) < 10 ? 'var(--error)' : 'inherit' }}>
        {String(val)}
      </span>
    )},
    { key: "updatedAt", label: "Last Updated", render: (val) => new Date(String(val)).toLocaleString() }
  ];

  return (
    <DashboardShell
      title="Pharmacy System"
      subtitle="Monitor all prescriptions and inventory levels"
      headerActions={
        <button className="btn btn-ghost btn-sm" onClick={fetchData}>
          <RefreshCw size={14} />
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard
          icon={<Pill size={20} />}
          label="Total Prescriptions"
          value={prescriptions.length}
          accentColor="var(--status-pharmacy)"
          delay={0}
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Dispensed"
          value={dispensedCount}
          accentColor="var(--success)"
          delay={50}
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Pending"
          value={pendingCount}
          accentColor="var(--status-triage)"
          delay={100}
        />
        <StatCard
          icon={<Package size={20} />}
          label="Inventory Items"
          value={inventory.length}
          accentColor="var(--accent-secondary)"
          delay={150}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <GlassCard padding="none" delay={200} className="animate-slide-up">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Master Prescriptions Ledger
            </h3>
          </div>
          <QueueTable
            columns={rxCols}
            data={prescriptions as unknown as Record<string, unknown>[]}
            isLoading={loading}
            emptyMessage="No prescriptions recorded yet."
          />
        </GlassCard>

        <GlassCard padding="none" delay={250} className="animate-slide-up">
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Medication Inventory
            </h3>
          </div>
          <QueueTable
            columns={invCols}
            data={inventory as unknown as Record<string, unknown>[]}
            isLoading={loading}
            emptyMessage="Inventory is empty."
          />
        </GlassCard>
      </div>
    </DashboardShell>
  );
}
