'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardShell from '@/components/DashboardShell';
import GlassCard from '@/components/GlassCard';
import StatCard from '@/components/StatCard';
import QueueTable, { type QueueColumn } from '@/components/QueueTable';
import StatusBadge from '@/components/StatusBadge';
import { useSocket } from '@/hooks/useSocket';
import {
  getPharmacyWorklist, dispensePrescription, getInventory, addInventory,
  getDrugs, createDrug,
  type Prescription, type InventoryItem, type Drug,
} from '@/lib/api';
import { Pill, Package, Plus, CheckCircle, AlertTriangle, RefreshCw, X } from 'lucide-react';

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
      return (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: s <= 0 ? 'var(--error)' : 'var(--text)' }}>
          {s}{s <= 5 && s > 0 && <AlertTriangle size={12} style={{ marginLeft: 6, verticalAlign: 'middle' }} />}
        </span>
      );
    }},
  ];
  const lowStock = inventory.filter(i => i.stock <= 5).length;
  const customDrugs = drugs.filter(d => !d.isDefault);

  return (
    <DashboardShell title="Pharmacy" subtitle={`${worklist.length} prescriptions pending`}
      headerActions={<button onClick={fetchData} className="btn btn-sm"><RefreshCw size={12} /> Refresh</button>}>
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
          <StatCard icon={<Pill size={20} />} label="Pending Rx" value={worklist.length} subtitle="To dispense" />
        </div>
        <div style={{ background: 'var(--bg)' }}>
          <StatCard icon={<Package size={20} />} label="Inventory" value={inventory.length} subtitle={lowStock > 0 ? `${lowStock} low stock` : 'All stocked'} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)' }}>
        <GlassCard padding="none" style={{ background: 'var(--bg)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Prescription Queue
            </h3>
          </div>
          <QueueTable columns={rxCols} data={worklist as unknown as Record<string, unknown>[]} emptyMessage="No pending prescriptions" isLoading={loading}
            actions={(row) => {
              const rx = row as unknown as Prescription;
              const stock = inventory.find(i => i.drugName.toLowerCase() === rx.drugName.toLowerCase());
              const ok = stock && stock.stock > 0;
              return (
                <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleDispense(rx.id, rx.drugName); }} disabled={dispensingId === rx.id || !ok}>
                  {dispensingId === rx.id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <><CheckCircle size={12} /> Dispense</>}
                </button>
              );
            }} />
        </GlassCard>

        <GlassCard padding="none" style={{ background: 'var(--bg)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Inventory
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-sm" onClick={() => { setShowDrugForm(!showDrugForm); setShowInvForm(false); }}>
                <Plus size={12} /> Drug
              </button>
              <button className="btn btn-sm" onClick={() => { setShowInvForm(!showInvForm); setShowDrugForm(false); }}>
                <Package size={12} /> Stock
              </button>
            </div>
          </div>
          {showInvForm && (
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
              <form onSubmit={handleAddInv} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label>Drug</label>
                  <select value={invDrug} onChange={e => setInvDrug(e.target.value)} required>
                    <option value="">Select...</option>
                    {drugs.map(drug => <option key={drug.id} value={drug.name}>{drug.name}</option>)}
                  </select>
                </div>
                <div style={{ width: '80px' }}>
                  <label>Qty</label>
                  <input type="number" value={invQty} onChange={e => setInvQty(e.target.value)} placeholder="50" min="1" required />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={invSubmitting}>
                  {invSubmitting ? <div className="spinner" /> : 'Add'}
                </button>
              </form>
            </div>
          )}
          {showDrugForm && (
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
              <form onSubmit={handleAddDrug} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label>Drug Name</label>
                  <input type="text" value={newDrugName} onChange={e => setNewDrugName(e.target.value)} placeholder="New Drug Name" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Description</label>
                  <input type="text" value={newDrugDesc} onChange={e => setNewDrugDesc(e.target.value)} placeholder="Description" />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={drugSubmitting}>
                  {drugSubmitting ? <div className="spinner" /> : 'Add Drug'}
                </button>
              </form>
            </div>
          )}
          <QueueTable columns={invCols} data={inventory as unknown as Record<string, unknown>[]} emptyMessage="No inventory" isLoading={loading} />
          {customDrugs.length > 0 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-muted)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Custom: {customDrugs.map(d => d.name).join(', ')}
              </p>
            </div>
          )}
        </GlassCard>
      </div>
      <style>{`@media(max-width:900px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}}`}</style>
    </DashboardShell>
  );
}
