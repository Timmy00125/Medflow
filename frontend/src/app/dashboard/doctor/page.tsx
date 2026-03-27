'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '@/components/DashboardShell';
import GlassCard from '@/components/GlassCard';
import QueueTable, { type QueueColumn } from '@/components/QueueTable';
import StatusBadge from '@/components/StatusBadge';
import { useSocket } from '@/hooks/useSocket';
import {
  getDoctorQueue,
  createNote,
  orderLab,
  prescribeDrug,
  advancePatient,
  getInventory,
  getDrugs,
  getLabTestTemplates,
  getPatientNotes,
  getPatientLabResults,
  type PatientFlow,
  type InventoryItem,
  type Drug,
  type LabTestTemplate,
  type ConsultationNote,
  type LabTestResult,
} from '@/lib/api';
import {
  Stethoscope,
  FileText,
  FlaskConical,
  Pill,
  Send,
  X,
  RefreshCw,
  ChevronRight,
  History,
  CheckCircle,
} from 'lucide-react';

export default function DoctorDashboard() {
  const { lastUpdate } = useSocket();
  const [queue, setQueue] = useState<PatientFlow[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [labTests, setLabTests] = useState<LabTestTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientFlow | null>(null);
  const [patientNotes, setPatientNotes] = useState<ConsultationNote[]>([]);
  const [patientLabResults, setPatientLabResults] = useState<LabTestResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [activeAction, setActiveAction] = useState<'note' | 'lab' | 'prescription' | null>(null);
  const [noteText, setNoteText] = useState('');
  const [labTestName, setLabTestName] = useState('');
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [queueData, inv, drugData, testData] = await Promise.all([
        getDoctorQueue(),
        getInventory(),
        getDrugs(),
        getLabTestTemplates(),
      ]);
      setQueue(queueData);
      setInventory(inv);
      setDrugs(drugData);
      setLabTests(testData);
    } catch (err) {
      console.error('Failed to fetch doctor data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPatientHistory = useCallback(async (patientId: string) => {
    try {
      const [notes, results] = await Promise.all([
        getPatientNotes(patientId),
        getPatientLabResults(patientId),
      ]);
      setPatientNotes(notes);
      setPatientLabResults(results);
    } catch (err) {
      console.error('Failed to fetch patient history', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, lastUpdate]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientHistory(selectedPatient.patientId);
    } else {
      setPatientNotes([]);
      setPatientLabResults([]);
    }
  }, [selectedPatient, fetchPatientHistory]);

  // Keep selected patient updated
  useEffect(() => {
    if (selectedPatient) {
      const updated = queue.find((q) => q.patientId === selectedPatient.patientId);
      if (updated) setSelectedPatient(updated);
    }
  }, [queue, selectedPatient]);

  const clearActionState = () => {
    setActionSuccess('');
    setActionError('');
  };

  const handleCreateNote = async () => {
    if (!selectedPatient || !noteText.trim()) return;
    setActionLoading(true);
    clearActionState();
    try {
      await createNote(selectedPatient.patientId, noteText);
      setActionSuccess('Consultation note saved');
      setNoteText('');
      setActiveAction(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOrderLab = async () => {
    if (!selectedPatient || !labTestName.trim()) return;
    setActionLoading(true);
    clearActionState();
    try {
      await orderLab(selectedPatient.patientId, labTestName);
      setActionSuccess(`Lab test "${labTestName}" ordered. Patient moved to lab queue.`);
      setLabTestName('');
      setActiveAction(null);
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to order lab test');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrescribe = async () => {
    if (!selectedPatient || !drugName.trim() || !dosage.trim()) return;
    setActionLoading(true);
    clearActionState();
    try {
      await prescribeDrug(selectedPatient.patientId, drugName, dosage);
      setActionSuccess(`"${drugName}" prescribed. Patient moved to pharmacy queue.`);
      setDrugName('');
      setDosage('');
      setActiveAction(null);
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to prescribe');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDischarge = async () => {
    if (!selectedPatient) return;
    setActionLoading(true);
    clearActionState();
    try {
      await advancePatient(selectedPatient.patientId, 'DISCHARGED');
      setActionSuccess('Patient discharged successfully');
      setSelectedPatient(null);
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to discharge');
    } finally {
      setActionLoading(false);
    }
  };

  const queueColumns: QueueColumn[] = [
    { key: 'patient.name', label: 'Patient' },
    { key: 'currentState', label: 'Status' },
    {
      key: 'queueEnteredAt',
      label: 'Waiting',
      render: (value) => {
        const mins = Math.floor((Date.now() - new Date(String(value)).getTime()) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
      },
    },
  ];

  return (
    <DashboardShell
      title="Doctor Dashboard"
      subtitle={`${queue.length} patients in your queue`}
      headerActions={
        <button onClick={fetchData} className="btn btn-ghost btn-sm">
          <RefreshCw size={14} />
        </button>
      }
    >
      {/* Feedback messages */}
      {actionSuccess && (
        <div
          className="animate-fade-in-down"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--success-bg)',
            color: 'var(--success)',
            fontSize: '0.8125rem',
            marginBottom: '20px',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {actionSuccess}
          <button className="btn-ghost btn-icon" onClick={() => setActionSuccess('')}>
            <X size={14} />
          </button>
        </div>
      )}
      {actionError && (
        <div
          className="animate-fade-in-down"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--error-bg)',
            color: 'var(--error)',
            fontSize: '0.8125rem',
            marginBottom: '20px',
            border: '1px solid rgba(248, 113, 113, 0.2)',
          }}
        >
          {actionError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
        {/* Left: Patient Queue */}
        <GlassCard padding="none" delay={0}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Patient Queue
            </h3>
          </div>
          <QueueTable
            columns={queueColumns}
            data={queue as unknown as Record<string, unknown>[]}
            emptyMessage="No patients in your queue"
            isLoading={loading}
            selectedId={selectedPatient?.patientId}
            onRowClick={(row) => {
              const flow = row as unknown as PatientFlow;
              setSelectedPatient(flow);
              setActiveAction(null);
              clearActionState();
            }}
          />
        </GlassCard>

        {/* Right: Selected Patient Panel */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '16px' }}>
          {selectedPatient ? (
            <>
              {/* Patient info header */}
              <GlassCard padding="md" glow delay={50}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {selectedPatient.patient?.name}
                    </h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                      ID: {selectedPatient.patientId.slice(0, 8)}…
                    </p>
                  </div>
                  <StatusBadge status={selectedPatient.currentState} />
                </div>
              </GlassCard>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                <button
                  className={`btn ${activeAction === 'note' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setActiveAction(activeAction === 'note' ? null : 'note')}
                >
                  <FileText size={14} />
                  Write Note
                </button>
                <button
                  className={`btn ${activeAction === 'lab' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setActiveAction(activeAction === 'lab' ? null : 'lab')}
                >
                  <FlaskConical size={14} />
                  Order Lab
                </button>
                <button
                  className={`btn ${activeAction === 'prescription' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setActiveAction(activeAction === 'prescription' ? null : 'prescription')}
                >
                  <Pill size={14} />
                  Prescribe
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ marginLeft: 'auto' }}
                >
                  <History size={14} />
                  {showHistory ? 'Hide' : 'Show'} History
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleDischarge}
                  disabled={actionLoading}
                >
                  Discharge
                </button>
              </div>

              {/* Patient History Panel */}
              {showHistory && (
                <GlassCard className="animate-fade-in-up" padding="md" delay={0}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <History size={14} /> Patient History
                  </h4>
                  
                  <div style={{ marginBottom: 16 }}>
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase' }}>
                      Consultation Notes ({patientNotes.length})
                    </h5>
                    {patientNotes.length === 0 ? (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>No consultation notes</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {patientNotes.map((note) => (
                          <div key={note.id} style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Dr. {note.doctor?.name || 'Unknown'}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(note.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-primary)' }}>{note.notes}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase' }}>
                      Lab Results ({patientLabResults.length})
                    </h5>
                    {patientLabResults.length === 0 ? (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>No lab results</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {patientLabResults.map((result) => (
                          <div key={result.id} style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, color: 'var(--status-lab)' }}>{result.testName}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: result.status === 'COMPLETED' ? 'var(--success)' : 'var(--text-muted)' }}>
                                {result.status === 'COMPLETED' && <CheckCircle size={12} />}
                                {result.status}
                              </span>
                            </div>
                            {result.resultData && (
                              <p style={{ margin: 0, color: 'var(--text-primary)', padding: '6px 8px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                                {result.resultData}
                              </p>
                            )}
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                              {result.labTech && `By: ${result.labTech.name}`} · {new Date(result.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </GlassCard>
              )}

              {/* Action panels */}
              {activeAction === 'note' && (
                <GlassCard className="animate-fade-in-up" padding="md" delay={0}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 12px', color: 'var(--text-primary)' }}>
                    Consultation Note
                  </h4>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter clinical notes for this patient…"
                    rows={5}
                    style={{ resize: 'vertical' as const }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleCreateNote}
                      disabled={actionLoading || !noteText.trim()}
                    >
                      {actionLoading ? <div className="spinner" /> : <><Send size={14} /> Save Note</>}
                    </button>
                  </div>
                </GlassCard>
              )}

              {activeAction === 'lab' && (
                <GlassCard className="animate-fade-in-up" padding="md" delay={0}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 12px', color: 'var(--text-primary)' }}>
                    Order Lab Test
                  </h4>
                  <div>
                    <label htmlFor="lab-test-name">Test Name</label>
                    <select
                      id="lab-test-name"
                      value={labTestName}
                      onChange={(e) => setLabTestName(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Select a test...</option>
                      {labTests.map((test) => (
                        <option key={test.id} value={test.name}>
                          {test.name} {test.category ? `(${test.category})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleOrderLab}
                      disabled={actionLoading || !labTestName.trim()}
                    >
                      {actionLoading ? <div className="spinner" /> : <><FlaskConical size={14} /> Order Test</>}
                    </button>
                  </div>
                </GlassCard>
              )}

              {activeAction === 'prescription' && (
                <GlassCard className="animate-fade-in-up" padding="md" delay={0}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, margin: '0 0 12px', color: 'var(--text-primary)' }}>
                    Prescribe Medication
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label htmlFor="drug-name">Drug Name</label>
                      <select
                        id="drug-name"
                        value={drugName}
                        onChange={(e) => setDrugName(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      >
                        <option value="">Select a drug...</option>
                        {drugs.map((drug) => (
                          <option key={drug.id} value={drug.name}>
                            {drug.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="drug-dosage">Dosage</label>
                      <input
                        id="drug-dosage"
                        type="text"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                        placeholder="e.g., 500mg 3x daily"
                      />
                    </div>
                  </div>
                  {drugName && (
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(() => {
                        const match = inventory.find(
                          (i) => i.drugName.toLowerCase() === drugName.toLowerCase()
                        );
                        return match
                          ? `Stock available: ${match.stock} units`
                          : 'Drug not found in inventory';
                      })()}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handlePrescribe}
                      disabled={actionLoading || !drugName.trim() || !dosage.trim()}
                    >
                      {actionLoading ? <div className="spinner" /> : <><Pill size={14} /> Prescribe</>}
                    </button>
                  </div>
                </GlassCard>
              )}
            </>
          ) : (
            <GlassCard padding="lg" delay={50}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 0',
                  color: 'var(--text-muted)',
                  gap: '12px',
                }}
              >
                <Stethoscope size={40} strokeWidth={1} />
                <p style={{ fontSize: '0.9375rem', fontWeight: 500, margin: 0 }}>
                  Select a patient from the queue
                </p>
                <p style={{ fontSize: '0.8125rem', margin: 0 }}>
                  Click on a patient to view details and take actions
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 380px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </DashboardShell>
  );
}
