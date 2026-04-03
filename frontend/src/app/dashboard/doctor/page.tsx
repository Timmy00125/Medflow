'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '@/components/DashboardShell';
import GlassCard from '@/components/GlassCard';
import QueueTable, { type QueueColumn } from '@/components/QueueTable';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
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
  getPatientVitals,
  type PatientFlow,
  type InventoryItem,
  type Drug,
  type LabTestTemplate,
  type ConsultationNote,
  type LabTestResult,
  type Vitals,
} from '@/lib/api';
import {
  Stethoscope,
  FileText,
  FlaskConical,
  Pill,
  Send,
  X,
  RefreshCw,
  History,
  CheckCircle,
  User,
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
  const [patientVitalsList, setPatientVitalsList] = useState<Vitals[]>([]);
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
      const [notes, results, vitalsList] = await Promise.all([
        getPatientNotes(patientId),
        getPatientLabResults(patientId),
        getPatientVitals(patientId),
      ]);
      setPatientNotes(notes);
      setPatientLabResults(results);
      setPatientVitalsList(vitalsList);
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
      setPatientVitalsList([]);
    }
  }, [selectedPatient, fetchPatientHistory]);

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
      title="Doctor Desk"
      subtitle={`${queue.length} patients in your queue`}
      headerActions={
        <button onClick={fetchData} className="btn btn-sm">
          <RefreshCw size={12} /> Refresh
        </button>
      }
    >
      {actionSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={14} />
          </button>
        </div>
      )}
      {actionError && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>{actionError}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1px', background: 'var(--border)', marginBottom: '16px' }}>
        <GlassCard padding="none" style={{ background: 'var(--bg)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
          {selectedPatient ? (
            <>
              <GlassCard padding="none" style={{ background: 'var(--bg)' }}>
                <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      {selectedPatient.patient?.name}
                    </h2>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--text-muted)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ID: {selectedPatient.patientId.slice(0, 8)}…
                    </p>
                  </div>
                  <StatusBadge status={selectedPatient.currentState} />
                </div>
                {patientVitalsList.length > 0 && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {patientVitalsList[0].temperature && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>Temp: <strong>{patientVitalsList[0].temperature}°C</strong></span>}
                    {patientVitalsList[0].bloodPressure && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>BP: <strong>{patientVitalsList[0].bloodPressure}</strong></span>}
                    {patientVitalsList[0].heartRate && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>HR: <strong>{patientVitalsList[0].heartRate}</strong></span>}
                    {patientVitalsList[0].weight && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>Wt: <strong>{patientVitalsList[0].weight} kg</strong></span>}
                  </div>
                )}
              </GlassCard>

              <div style={{ background: 'var(--bg)', padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${activeAction === 'note' ? 'btn-primary' : ''}`}
                  onClick={() => setActiveAction(activeAction === 'note' ? null : 'note')}
                >
                  <FileText size={12} /> Note
                </button>
                <button
                  className={`btn ${activeAction === 'lab' ? 'btn-primary' : ''}`}
                  onClick={() => setActiveAction(activeAction === 'lab' ? null : 'lab')}
                >
                  <FlaskConical size={12} /> Lab
                </button>
                <button
                  className={`btn ${activeAction === 'prescription' ? 'btn-primary' : ''}`}
                  onClick={() => setActiveAction(activeAction === 'prescription' ? null : 'prescription')}
                >
                  <Pill size={12} /> Rx
                </button>
                <button
                  className="btn"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <History size={12} /> {showHistory ? 'Hide' : 'History'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDischarge}
                  disabled={actionLoading}
                  style={{ marginLeft: 'auto' }}
                >
                  Discharge
                </button>
              </div>

              {showHistory && (
                <GlassCard padding="md" style={{ background: 'var(--bg)' }}>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
                    Patient History
                  </h4>
                  
                  <div style={{ marginBottom: 16 }}>
                    <h5 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Vitals ({patientVitalsList.length})
                    </h5>
                    {patientVitalsList.length === 0 ? (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>No vitals recorded</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {patientVitalsList.map((v) => (
                          <div key={v.id} style={{ padding: '10px 12px', border: '1px solid var(--border)', fontSize: '0.8125rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 700 }}>By {v.nurse?.name || 'Nurse'}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(v.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              {v.temperature && <span><strong>Temp:</strong> {v.temperature}°C</span>}
                              {v.bloodPressure && <span><strong>BP:</strong> {v.bloodPressure}</span>}
                              {v.heartRate && <span><strong>HR:</strong> {v.heartRate} bpm</span>}
                              {v.weight && <span><strong>Wt:</strong> {v.weight} kg</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <h5 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Notes ({patientNotes.length})
                    </h5>
                    {patientNotes.length === 0 ? (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>No consultation notes</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {patientNotes.map((note) => (
                          <div key={note.id} style={{ padding: '10px 12px', border: '1px solid var(--border)', fontSize: '0.8125rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 700 }}>Dr. {note.doctor?.name || 'Unknown'}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(note.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p style={{ margin: 0 }}>{note.notes}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h5 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Lab Results ({patientLabResults.length})
                    </h5>
                    {patientLabResults.length === 0 ? (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>No lab results</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {patientLabResults.map((result) => (
                          <div key={result.id} style={{ padding: '10px 12px', border: '1px solid var(--border)', fontSize: '0.8125rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontWeight: 700 }}>{result.testName}</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                {result.status}
                              </span>
                            </div>
                            {result.resultData && (
                              <p style={{ margin: 0, padding: '6px 8px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', background: 'var(--bg-muted)' }}>
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

              {activeAction === 'note' && (
                <GlassCard padding="md" style={{ background: 'var(--bg)' }}>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
                    Consultation Note
                  </h4>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter clinical notes..."
                    rows={5}
                    style={{ resize: 'vertical' as const }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleCreateNote}
                      disabled={actionLoading || !noteText.trim()}
                    >
                      {actionLoading ? <div className="spinner" /> : <><Send size={12} /> Save</>}
                    </button>
                  </div>
                </GlassCard>
              )}

              {activeAction === 'lab' && (
                <GlassCard padding="md" style={{ background: 'var(--bg)' }}>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
                    Order Lab Test
                  </h4>
                  <div>
                    <label>Test Name</label>
                    <select value={labTestName} onChange={(e) => setLabTestName(e.target.value)}>
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
                      {actionLoading ? <div className="spinner" /> : <><FlaskConical size={12} /> Order</>}
                    </button>
                  </div>
                </GlassCard>
              )}

              {activeAction === 'prescription' && (
                <GlassCard padding="md" style={{ background: 'var(--bg)' }}>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>
                    Prescribe Medication
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label>Drug</label>
                      <select value={drugName} onChange={(e) => setDrugName(e.target.value)}>
                        <option value="">Select a drug...</option>
                        {drugs.map((drug) => (
                          <option key={drug.id} value={drug.name}>{drug.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>Dosage</label>
                      <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g., 500mg 3x daily" />
                    </div>
                  </div>
                  {drugName && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      {(() => {
                        const match = inventory.find(i => i.drugName.toLowerCase() === drugName.toLowerCase());
                        return match ? `Stock: ${match.stock} units` : 'Drug not in inventory';
                      })()}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handlePrescribe}
                      disabled={actionLoading || !drugName.trim() || !dosage.trim()}
                    >
                      {actionLoading ? <div className="spinner" /> : <><Pill size={12} /> Prescribe</>}
                    </button>
                  </div>
                </GlassCard>
              )}
            </>
          ) : (
            <GlassCard padding="md" style={{ background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <User size={32} style={{ opacity: 0.5, marginBottom: '12px' }} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Select a patient from the queue
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 320px"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </DashboardShell>
  );
}
