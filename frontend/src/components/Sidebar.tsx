"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/api";
import { LayoutDashboard, Users, Stethoscope, FlaskConical, Pill, Activity, LogOut } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Admin Overview",
    href: "/dashboard/admin",
    icon: <LayoutDashboard size={16} />,
    roles: ["ADMIN"],
  },
  {
    label: "Doctors",
    href: "/dashboard/admin/doctors",
    icon: <Stethoscope size={16} />,
    roles: ["ADMIN"],
  },
  {
    label: "Nurses",
    href: "/dashboard/admin/nurses",
    icon: <Users size={16} />,
    roles: ["ADMIN"],
  },
  {
    label: "All Lab Tests",
    href: "/dashboard/admin/laboratory",
    icon: <FlaskConical size={16} />,
    roles: ["ADMIN"],
  },
  {
    label: "All Prescriptions",
    href: "/dashboard/admin/pharmacy",
    icon: <Pill size={16} />,
    roles: ["ADMIN"],
  },
  {
    label: "Patients",
    href: "/dashboard/admin/patients",
    icon: <Users size={16} />,
    roles: ["ADMIN"],
  },
  {
    label: "Nurse Desk",
    href: "/dashboard/nurse",
    icon: <LayoutDashboard size={16} />,
    roles: ["NURSE"],
  },
  {
    label: "Doctor Desk",
    href: "/dashboard/doctor",
    icon: <Stethoscope size={16} />,
    roles: ["DOCTOR"],
  },
  {
    label: "Laboratory",
    href: "/dashboard/laboratory",
    icon: <FlaskConical size={16} />,
    roles: ["LAB_TECH"],
  },
  {
    label: "Pharmacy",
    href: "/dashboard/pharmacy",
    icon: <Pill size={16} />,
    roles: ["PHARMACIST"],
  },
  {
    label: "Check Patients",
    href: "/dashboard/check-patients",
    icon: <Users size={16} />,
    roles: ["DOCTOR", "NURSE"],
  },
  {
    label: "My History",
    href: "/dashboard/history",
    icon: <Activity size={16} />,
    roles: ["DOCTOR", "NURSE", "LAB_TECH", "PHARMACIST", "ADMIN"],
  },
  {
    label: "My Status",
    href: "/dashboard/patient",
    icon: <Activity size={16} />,
    roles: ["PATIENT"],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role),
  );

  return (
    <aside
      style={{
        width: '220px',
        height: '100vh',
        position: 'fixed' as const,
        top: 0,
        left: 0,
        zIndex: 40,
        background: 'var(--bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column' as const,
        overflowY: 'auto' as const,
      }}
    >
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '0.05em',
          }}
        >
          MEDFLOW
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.5625rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginTop: '2px',
          }}
        >
          Telemedicine
        </div>
      </div>

      <nav
        style={{
          flex: 1,
          padding: '8px 0',
        }}
      >
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                color: isActive ? 'var(--accent-text)' : 'var(--text)',
                background: isActive ? '#fdf2f8' : 'transparent',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                fontWeight: isActive ? 700 : 400,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderLeft: isActive ? '3px solid var(--accent-border)' : '3px solid transparent',
                marginLeft: isActive ? '0' : '3px',
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.5 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              background: 'var(--bg-muted)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.name}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.5625rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {user.role.replace("_", " ")}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 0',
            background: 'transparent',
            border: 'none',
            borderTop: '1px solid var(--border)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.625rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            marginTop: '12px',
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
