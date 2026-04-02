"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import { useRouter } from "next/navigation";
import { getStaff, type StaffMember } from "@/lib/api";
import { Stethoscope, Activity, Eye, RefreshCw } from "lucide-react";

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const staff = await getStaff();
      setDoctors(staff.filter(s => s.role === 'DOCTOR'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const columns: QueueColumn[] = [
    { key: "name", label: "Doctor Name" },
    { key: "email", label: "Email" },
    {
      key: "createdAt",
      label: "Joined",
      render: (val) => new Date(String(val)).toLocaleDateString(),
    },
  ];

  return (
    <DashboardShell
      title="Doctors Directory"
      subtitle="Manage and oversee all doctors"
      headerActions={
        <button className="btn btn-ghost btn-sm" onClick={fetchDoctors}>
          <RefreshCw size={14} />
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard
          icon={<Stethoscope size={20} />}
          label="Total Doctors"
          value={doctors.length}
          accentColor="var(--status-doctor)"
          delay={0}
        />
        <StatCard
          icon={<Activity size={20} />}
          label="Status Active"
          value={doctors.length > 0 ? "Online" : "Offline"}
          accentColor="var(--status-triage)"
          delay={50}
        />
      </div>

      <GlassCard padding="none" delay={100} className="animate-slide-up">
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            Registered Doctors
          </h3>
        </div>
        <QueueTable
          columns={columns}
          data={doctors as unknown as Record<string, unknown>[]}
          isLoading={loading}
          emptyMessage="No doctors found"
          actions={(row) => (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => router.push(`/dashboard/admin/doctors/${row.id}`)}
              style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <Eye size={14} /> View History
            </button>
          )}
        />
      </GlassCard>
    </DashboardShell>
  );
}
