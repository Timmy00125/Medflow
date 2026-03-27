'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '@/components/DashboardShell';
import GlassCard from '@/components/GlassCard';
import StatCard from '@/components/StatCard';
import QueueTable, { type QueueColumn } from '@/components/QueueTable';
import { useSocket } from '@/hooks/useSocket';
import {
  getPharmacyWorklist, dispensePrescription, getInventory, addInventory,
  getDrugs, createDrug,
  type Prescription, type InventoryItem, type Drug,
} from '@/lib/api';
import { Pill, Package, Plus, CheckCircle, AlertTriangle, RefreshCw, X, Trash2 } from 'lucide-react';

export default function PharmacyDashboard() {
  const { lastUpdate } = useSocket();
  const [worklist, setWorklist] = useState<Prescription[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispensingId, setDispensingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showInvForm, setShowInvForm] = useState(false);
  const [showDrugForm, setShowDrugForm] = useState(false);
  const [invDrug, setInvDrug] = useState('');
  const [invQty, setInvQty] = useState('');
  const [invSubmitting, setInvSubmitting] = useState(false);
  const [newDrugName, setNewDrugName] = useState('');
  const [newDrugDesc, setNewDrugDesc] = useState('');
  const [drugSubmitting, setDrugSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [wl, inv, drugData] = await Promise.all([
        getPharmacyWorklist(),
        getInventory(),
        getDrugs(),
      ]);
      setWorklist(wl);
      setInventory(inv);
      setDrugs(drugData);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, lastUpdate]);

  const handleDispense = async (rxId: string, drug: string) => {
    setDispensingId(rxId); setSuccessMsg(''); setErrorMsg('');
    try {
      await dispensePrescription(rxId);
      setSuccessMsg(`"${drug}" dispensed successfully.`);
      fetchData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to dispense');
    } finally { setDispensingId(null); }
  };

  const handleAddInv = async (e: React.FormEvent) => {
    e.preventDefault(); setInvSubmitting(true); setSuccessMsg(''); setErrorMsg('');
    try {
      await addInventory(invDrug, parseInt(invQty, 10));
      setSuccessMsg(`Added ${invQty} units of "${invDrug}"`);
      setInvDrug(''); setInvQty(''); setShowInvForm(false); fetchData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed');
    } finally { setInvSubmitting(false); }
  };

  const handleAddDrug = async (e: React.FormEvent) => {
    e.preventDefault(); setDrugSubmitting(true); setSuccessMsg(''); setErrorMsg('');
    try {
      await createDrug(newDrugName, newDrugDesc);
      setSuccessMsg(`Drug "${newDrugName}" added successfully.`);
      setNewDrugName(''); setNewDrugDesc(''); setShowDrugForm(false); fetchData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add drug');
    } finally { setDrugSubmitting(false); }
  };

  const rxCols: QueueColumn[] = [
    { key: 'patient.name', label: 'Patient' },
    { key: 'drugName', label: 'Drug' },
    { key: 'dosage', label: 'Dosage' },
    { key: 'status', label: 'Status' },
  ];
  const invCols: QueueColumn[] = [
    { key: 'drugName', label: 'Drug' },
    { key: 'stock', label: 'Stock', render: (v) => {
      const s = Number(v);
      return <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: s <= 0 ? 'var(--error)' : s <= 5 ? 'var(--warning)' : 'var(--success)' }}>{s}{s <= 5 && s > 0 && <AlertTriangle size={12} style={{ marginLeft: 6, verticalAlign: 'middle' }} />}</span>;
    }},
  ];
  const lowStock = inventory.filter(i => i.stock <= 5).length;
  const customDrugs = drugs.filter(d => !d.isDefault);

  return (
    <DashboardShell title="Pharmacy Dashboard" subtitle={`${worklist.length} prescriptions pending`}
      headerActions={<button onClick={fetchData} className="btn btn-ghost btn-sm"><RefreshCw size={14} /></button>}>
      {successMsg && <div className="animate-fade-in-down" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', color: 'var(--success)', fontSize: '0.8125rem', marginBottom: 20, border: '1px solid rgba(52,211,153,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={16} /> {successMsg}</span><button className="btn-ghost btn-icon" onClick={() => setSuccessMsg('')}><X size={14} /></button></div>}
      {errorMsg && <div className="animate-fade-in-down" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--error-bg)', color: 'var(--error)', fontSize: '0.8125rem', marginBottom: 20, border: '1px solid rgba(248,113,113,0.2)' }}>{errorMsg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={<Pill size={20} />} label="Pending Rx" value={worklist.length} subtitle="To dispense" accentColor="var(--status-pharmacy)" delay={0} />
        <StatCard icon={<Package size={20} />} label="Inventory" value={inventory.length} subtitle={lowStock > 0 ? `${lowStock} low stock` : 'All stocked'} accentColor={lowStock > 0 ? 'var(--warning)' : 'var(--success)'} delay={50} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <GlassCard padding="none" delay={100}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Prescription Queue</h3>
          </div>
          <QueueTable columns={rxCols} data={worklist as unknown as Record<string, unknown>[]} emptyMessage="No pending prescriptions" isLoading={loading}
            actions={(row) => {
              const rx = row as unknown as Prescription;
              const stock = inventory.find(i => i.drugName.toLowerCase() === rx.drugName.toLowerCase());
              const ok = stock && stock.stock > 0;
              return <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); handleDispense(rx.id, rx.drugName); }} disabled={dispensingId === rx.id || !ok} title={!ok ? 'No stock' : 'Dispense'}>{dispensingId === rx.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <><CheckCircle size={12} /> Dispense</>}</button>;
            }} />
        </GlassCard>

        <GlassCard padding="none" delay={150}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Inventory</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowDrugForm(!showDrugForm); setShowInvForm(false); }}><Plus size={14} /> Add Drug</button>
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowInvForm(!showInvForm); setShowDrugForm(false); }}><Package size={14} /> Add Stock</button>
            </div>
          </div>
          {showInvForm && <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(100,160,255,0.02)' }} className="animate-fade-in-down">
            <form onSubmit={handleAddInv} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="inv-d">Drug</label>
                <select id="inv-d" value={invDrug} onChange={e => setInvDrug(e.target.value)} required style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  <option value="">Select a drug...</option>
                  {drugs.map(drug => <option key={drug.id} value={drug.name}>{drug.name}</option>)}
                </select>
              </div>
              <div style={{ width: 100 }}><label htmlFor="inv-q">Qty</label><input id="inv-q" type="number" value={invQty} onChange={e => setInvQty(e.target.value)} placeholder="50" min="1" required /></div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={invSubmitting} style={{ height: 38 }}>{invSubmitting ? <div className="spinner" /> : 'Add'}</button>
            </form>
          </div>}
          {showDrugForm && <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(52,211,153,0.02)' }} className="animate-fade-in-down">
            <form onSubmit={handleAddDrug} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}><label htmlFor="new-drug">Drug Name</label><input id="new-drug" type="text" value={newDrugName} onChange={e => setNewDrugName(e.target.value)} placeholder="New Drug Name" required /></div>
              <div style={{ flex: 1 }}><label htmlFor="new-desc">Description (optional)</label><input id="new-desc" type="text" value={newDrugDesc} onChange={e => setNewDrugDesc(e.target.value)} placeholder="Description" /></div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={drugSubmitting} style={{ height: 38 }}>{drugSubmitting ? <div className="spinner" /> : 'Add Drug'}</button>
            </form>
          </div>}
          <QueueTable columns={invCols} data={inventory as unknown as Record<string, unknown>[]} emptyMessage="No inventory" isLoading={loading} />
          {customDrugs.length > 0 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'rgba(52,211,153,0.02)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>Custom drugs: {customDrugs.map(d => d.name).join(', ')}</p>
            </div>
          )}
        </GlassCard>
      </div>
      <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}}`}</style>
    </DashboardShell>
  );
}
