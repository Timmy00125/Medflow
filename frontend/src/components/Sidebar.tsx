'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/lib/api';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FlaskConical,
  Pill,
  Activity,
  LogOut,
  Menu,
  X,
  Heart,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Admin',
    href: '/dashboard/admin',
    icon: <LayoutDashboard size={20} />,
    roles: ['ADMIN'],
  },
  {
    label: 'Nurse',
    href: '/dashboard/nurse',
    icon: <LayoutDashboard size={20} />,
    roles: ['NURSE'],
  },
  {
    label: 'Doctor',
    href: '/dashboard/doctor',
    icon: <Stethoscope size={20} />,
    roles: ['ADMIN', 'DOCTOR'],
  },
  {
    label: 'Laboratory',
    href: '/dashboard/laboratory',
    icon: <FlaskConical size={20} />,
    roles: ['ADMIN', 'LAB_TECH'],
  },
  {
    label: 'Pharmacy',
    href: '/dashboard/pharmacy',
    icon: <Pill size={20} />,
    roles: ['ADMIN', 'PHARMACIST'],
  },
  {
    label: 'My Status',
    href: '/dashboard/patient',
    icon: <Activity size={20} />,
    roles: ['PATIENT'],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.role)
  );

  const sidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
        padding: collapsed ? '16px 8px' : '16px',
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: collapsed ? '8px 4px' : '8px 4px',
          marginBottom: '28px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-dim), var(--accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Heart size={18} color="var(--bg-deep)" fill="var(--bg-deep)" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              MedFlow
            </div>
            <div
              style={{
                fontSize: '0.625rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase' as const,
              }}
            >
              Telemedicine
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '4px' }}>
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '10px' : '10px 14px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-glow)' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                transition: 'all var(--duration-fast) var(--ease-in-out)',
                justifyContent: collapsed ? 'center' : 'flex-start',
                position: 'relative' as const,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(100, 160, 255, 0.04)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute' as const,
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '20px',
                    borderRadius: '0 3px 3px 0',
                    background: 'var(--accent)',
                  }}
                />
              )}
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--divider)', margin: '12px 0' }} />

      {/* User info + Logout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: collapsed ? '8px 4px' : '8px 4px',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--accent)',
            flexShrink: 0,
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="truncate"
              style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}
            >
              {user.name}
            </div>
            <div
              className="truncate"
              style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}
            >
              {user.role.replace('_', ' ')}
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="btn-icon btn-ghost"
          title="Sign out"
          style={{ marginLeft: collapsed ? 0 : 'auto' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="btn-icon btn-ghost"
        style={{
          position: 'fixed' as const,
          top: '12px',
          left: '12px',
          zIndex: 60,
          display: 'none',
        }}
        id="mobile-menu-toggle"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop sidebar */}
      <aside
        style={{
          width: collapsed ? '68px' : '240px',
          height: '100vh',
          position: 'fixed' as const,
          top: 0,
          left: 0,
          zIndex: 40,
          background: 'var(--bg-base)',
          borderRight: '1px solid var(--border)',
          transition: 'width var(--duration-normal) var(--ease-out-expo)',
          overflowY: 'auto' as const,
          overflowX: 'hidden' as const,
        }}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn-ghost btn-icon"
          style={{
            position: 'absolute' as const,
            top: '20px',
            right: collapsed ? '50%' : '12px',
            transform: collapsed ? 'translateX(50%)' : 'none',
            zIndex: 2,
            display: 'flex',
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={16} />
        </button>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed' as const,
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 45,
            }}
          />
          <aside
            className="animate-slide-in-left"
            style={{
              width: '260px',
              height: '100vh',
              position: 'fixed' as const,
              top: 0,
              left: 0,
              zIndex: 50,
              background: 'var(--bg-base)',
              borderRight: '1px solid var(--border)',
              overflowY: 'auto' as const,
            }}
          >
            {sidebarContent}
          </aside>
        </>
      )}

      {/* CSS for mobile responsiveness */}
      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-toggle { display: flex !important; }
          aside:not([class*="animate"]) { display: none !important; }
        }
      `}</style>
    </>
  );
}
