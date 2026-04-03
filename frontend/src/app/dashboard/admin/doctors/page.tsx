"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";
import QueueTable, { type QueueColumn } from "@/components/QueueTable";
import { useRouter } from "next/navigation";
import { getStaff, type StaffMember } from "@/lib/api";
import { Stethoscope, Eye, RefreshCw } from "lucide-react";

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
      subtitle={`${doctors.length} registered doctors`}
      headerActions={
        <button className="btn btn-sm" onClick={fetchDoctors}>
          <RefreshCw size={12} /> Refresh
        </button>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px", background: "var(--border)", marginBottom: "16px" }}>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<Stethoscope size={20} />} label="Total Doctors" value={doctors.length} />
        </div>
        <div style={{ background: "var(--bg)" }}>
          <StatCard icon={<Eye size={20} />} label="Status" value={doctors.length > 0 ? "Active" : "None"} />
        </div>
      </div>

      <GlassCard padding="none">
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
          <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
            Registered Doctors
          </h3>
        </div>
        <QueueTable
          columns={columns}
          data={doctors as unknown as Record<string, unknown>[]}
          isLoading={loading}
          emptyMessage="No doctors found"
          actions={(row) => (
            <button className="btn btn-sm" onClick={() => router.push(`/dashboard/admin/doctors/${row.id}`)}>
              <Eye size={12} /> View
            </button>
          )}
        />
      </GlassCard>
    </DashboardShell>
  );
}
