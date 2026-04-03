'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '@/components/DashboardShell';
import GlassCard from '@/components/GlassCard';
import StatCard from '@/components/StatCard';
import QueueTable, { type QueueColumn } from '@/components/QueueTable';
import StatusBadge from '@/components/StatusBadge';
import { useSocket } from '@/hooks/useSocket';
import { getLabWorklist, uploadLabResult, getLabTestTemplates, createLabTestTemplate, type LabTest, type LabTestTemplate } from '@/lib/api';
import { FlaskConical, Upload, CheckCircle, RefreshCw, X, Plus, Beaker } from 'lucide-react';

export default function LaboratoryDashboard() {
  const { lastUpdate } = useSocket();
  const [worklist, setWorklist] = useState<LabTest[]>([]);
  const [labTests, setLabTests] = useState<LabTestTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [resultData, setResultData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showTestForm, setShowTestForm] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [newTestDesc, setNewTestDesc] = useState('');
  const [newTestCategory, setNewTestCategory] = useState('');
  const [testSubmitting, setTestSubmitting] = useState(false);

  const fetchWorklist = useCallback(async () => {
    try {
      const [data, templates] = await Promise.all([getLabWorklist(), getLabTestTemplates()]);
      setWorklist(data);
      setLabTests(templates);
    } catch (err) {
      console.error('Failed to fetch lab worklist', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorklist();
  }, [fetchWorklist, lastUpdate]);

  const handleUploadResult = async () => {
    if (!selectedTest || !resultData.trim()) return;
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await uploadLabResult(selectedTest.id, resultData);
      setSuccessMsg(`Result for "${selectedTest.testName}" uploaded. Patient returned to doctor.`);
      setSelectedTest(null);
      setResultData('');
      fetchWorklist();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await createLabTestTemplate(newTestName, newTestDesc, newTestCategory);
      setSuccessMsg(`Test "${newTestName}" added successfully.`);
      setNewTestName('');
      setNewTestDesc('');
      setNewTestCategory('');
      setShowTestForm(false);
      fetchWorklist();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add test');
    } finally {
      setTestSubmitting(false);
    }
  };

  const columns: QueueColumn[] = [
    { key: 'patient.name', label: 'Patient' },
    { key: 'testName', label: 'Test' },
    { key: 'status', label: 'Status' },
    {
      key: 'createdAt',
      label: 'Ordered',
      render: (value) => {
        const date = new Date(String(value));
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      },
    },
  ];

  return (
    <DashboardShell
      title="Laboratory"
      subtitle={`${worklist.length} pending tests`}
      headerActions={
        <button onClick={fetchWorklist} className="btn btn-sm">
          <RefreshCw size={12} /> Refresh
        </button>
      }
    >
      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          <span><CheckCircle size={14} style={{ marginRight: '8px' }} />{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={14} />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1px', background: 'var(--border)', marginBottom: '16px' }}>
        <div style={{ background: 'var(--bg)' }}>
          <StatCard
            icon={<FlaskConical size={20} />}
            label="Pending Tests"
            value={worklist.length}
            subtitle="Awaiting results"
          />
        </div>
        <div style={{ background: 'var(--bg)' }}>
          <StatCard
            icon={<Beaker size={20} />}
            label="Selected"
            value={selectedTest ? selectedTest.testName : '—'}
            subtitle={selectedTest ? `Patient: ${selectedTest.patient?.name}` : 'Select a test'}
          />
        </div>
        <div style={{ background: 'var(--bg)' }}>
          <GlassCard padding="md" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Test Templates
              </span>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, margin: '8px 0 4px' }}>
                {labTests.length}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Available
              </p>
            </div>
            <button className="btn btn-sm" onClick={() => setShowTestForm(!showTestForm)} style={{ marginTop: '12px' }}>
              <Plus size={12} /> Add Test
            </button>
          </GlassCard>
        </div>
      </div>

      {showTestForm && (
        <GlassCard padding="md" style={{ marginBottom: '16px' }}>
          <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
            Add Custom Lab Test
          </h4>
          <form onSubmit={handleAddTest} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label>Test Name</label>
              <input type="text" value={newTestName} onChange={e => setNewTestName(e.target.value)} placeholder="e.g., Dengue Test" required />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label>Category</label>
              <input type="text" value={newTestCategory} onChange={e => setNewTestCategory(e.target.value)} placeholder="e.g., Virology" />
            </div>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label>Description</label>
              <input type="text" value={newTestDesc} onChange={e => setNewTestDesc(e.target.value)} placeholder="Brief description" />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={testSubmitting}>
              {testSubmitting ? <div className="spinner" /> : <><Plus size={12} /> Add</>}
            </button>
          </form>
        </GlassCard>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1px', background: 'var(--border)' }}>
        <GlassCard padding="none" style={{ background: 'var(--bg)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Test Worklist
            </h3>
          </div>
          <QueueTable
            columns={columns}
            data={worklist as unknown as Record<string, unknown>[]}
            emptyMessage="No pending lab tests"
            isLoading={loading}
            selectedId={selectedTest?.id}
            onRowClick={(row) => {
              setSelectedTest(row as unknown as LabTest);
              setResultData('');
              setSuccessMsg('');
              setErrorMsg('');
            }}
          />
        </GlassCard>

        <div>
          {selectedTest ? (
            <GlassCard padding="md" style={{ background: 'var(--bg)' }}>
              <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                Upload Result
              </h4>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--text-muted)', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {selectedTest.testName} · {selectedTest.patient?.name}
              </p>

              <label>Result Data</label>
              <textarea
                value={resultData}
                onChange={(e) => setResultData(e.target.value)}
                placeholder="Enter test results, values, observations…"
                rows={8}
                style={{ resize: 'vertical' as const }}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button className="btn btn-sm" onClick={() => setSelectedTest(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleUploadResult}
                  disabled={submitting || !resultData.trim()}
                >
                  {submitting ? <div className="spinner" /> : <><Upload size={12} /> Upload</>}
                </button>
              </div>
            </GlassCard>
          ) : (
            <GlassCard padding="md" style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <FlaskConical size={32} style={{ opacity: 0.5, marginBottom: '12px' }} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Select a test to upload results
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1fr 360px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </DashboardShell>
  );
}
