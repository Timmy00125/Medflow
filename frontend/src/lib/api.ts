// ═══════════════════════════════════════════
// Telemedicine Platform — API Client
// Type-safe fetch wrappers for all backend endpoints
// ═══════════════════════════════════════════

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ── Types ──────────────────────────────────

export type Role = 'ADMIN' | 'DOCTOR' | 'LAB_TECH' | 'PHARMACIST' | 'NURSE' | 'PATIENT';

export type DepartmentState =
  | 'AWAITING_TRIAGE'
  | 'AWAITING_DOCTOR'
  | 'AWAITING_LAB'
  | 'AWAITING_DOCTOR_REVIEW'
  | 'AWAITING_PHARMACY'
  | 'DISCHARGED';

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface LoginResponse {
  access_token: string;
  user: UserPayload;
}

export interface PatientFlow {
  id: string;
  patientId: string;
  currentState: DepartmentState;
  assignedDoctorId: string | null;
  assignedLabId: string | null;
  assignedPharmId: string | null;
  queueEnteredAt: string;
  updatedAt: string;
  patient?: { id: string; name: string; email?: string };
}

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface ConsultationNote {
  id: string;
  patientId: string;
  doctorId: string;
  notes: string;
  isImmutable: boolean;
  createdAt: string;
}

export interface LabTest {
  id: string;
  patientId: string;
  testName: string;
  status: string;
  resultData: string | null;
  labTechId: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: { id: string; name: string };
}

export interface Prescription {
  id: string;
  patientId: string;
  drugName: string;
  dosage: string;
  status: string;
  pharmacistId: string | null;
  createdAt: string;
  dispensedAt: string | null;
  patient?: { id: string; name: string };
}

export interface InventoryItem {
  id: string;
  drugName: string;
  stock: number;
  updatedAt: string;
}

// ── API Error ──────────────────────────────

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// ── Token helpers ──────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

export function clearToken(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredUser(): UserPayload | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setStoredUser(user: UserPayload): void {
  localStorage.setItem('user', JSON.stringify(user));
}

// ── Core Fetch ─────────────────────────────

async function fetchApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      msg = body.message || msg;
    } catch { /* ignore */ }
    throw new ApiError(msg, res.status);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await fetchApi<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

export async function signupPatient(data: {
  email: string; name: string; password: string;
}): Promise<UserPayload> {
  return fetchApi<UserPayload>('/auth/signup/patient', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ═══════════════════════════════════════════
// USERS / STAFF
// ═══════════════════════════════════════════

export async function getStaff(): Promise<StaffMember[]> {
  return fetchApi<StaffMember[]>('/users/staff');
}

export async function createStaff(data: {
  email: string; name: string; password: string; role: Role;
}): Promise<StaffMember> {
  return fetchApi<StaffMember>('/users/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createPatient(data: {
  email: string; name: string; password: string;
}): Promise<UserPayload & { patientFlow: PatientFlow }> {
  return fetchApi('/users/patient', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ═══════════════════════════════════════════
// QUEUE
// ═══════════════════════════════════════════

export async function getTriageQueue(): Promise<PatientFlow[]> {
  return fetchApi<PatientFlow[]>('/queue/triage');
}

export async function getDoctorQueue(): Promise<PatientFlow[]> {
  return fetchApi<PatientFlow[]>('/queue/doctor');
}

export async function getLabQueue(): Promise<PatientFlow[]> {
  return fetchApi<PatientFlow[]>('/queue/laboratory');
}

export async function getPharmacyQueue(): Promise<PatientFlow[]> {
  return fetchApi<PatientFlow[]>('/queue/pharmacy');
}

export async function getPatientState(patientId: string): Promise<PatientFlow> {
  return fetchApi<PatientFlow>(`/queue/patient/${patientId}`);
}

export async function advancePatient(
  patientId: string,
  newState: DepartmentState,
  assignedDoctorId?: string,
): Promise<PatientFlow> {
  return fetchApi<PatientFlow>(`/queue/advance/${patientId}`, {
    method: 'PUT',
    body: JSON.stringify({ newState, assignedDoctorId }),
  });
}

// ═══════════════════════════════════════════
// CONSULTATION (DOCTOR)
// ═══════════════════════════════════════════

export async function createNote(patientId: string, notes: string): Promise<ConsultationNote> {
  return fetchApi<ConsultationNote>(`/consultation/${patientId}/note`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export async function orderLab(patientId: string, testName: string): Promise<LabTest> {
  return fetchApi<LabTest>(`/consultation/${patientId}/lab`, {
    method: 'POST',
    body: JSON.stringify({ testName }),
  });
}

export async function prescribeDrug(
  patientId: string, drugName: string, dosage: string,
): Promise<Prescription> {
  return fetchApi<Prescription>(`/consultation/${patientId}/prescription`, {
    method: 'POST',
    body: JSON.stringify({ drugName, dosage }),
  });
}

// ═══════════════════════════════════════════
// LABORATORY
// ═══════════════════════════════════════════

export async function getLabWorklist(): Promise<LabTest[]> {
  return fetchApi<LabTest[]>('/laboratory/worklist');
}

export async function uploadLabResult(testId: string, resultData: string): Promise<LabTest> {
  return fetchApi<LabTest>(`/laboratory/${testId}/result`, {
    method: 'POST',
    body: JSON.stringify({ resultData }),
  });
}

// ═══════════════════════════════════════════
// PHARMACY
// ═══════════════════════════════════════════

export async function getPharmacyWorklist(): Promise<Prescription[]> {
  return fetchApi<Prescription[]>('/pharmacy/worklist');
}

export async function dispensePrescription(rxId: string): Promise<Prescription> {
  return fetchApi<Prescription>(`/pharmacy/${rxId}/dispense`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getInventory(): Promise<InventoryItem[]> {
  return fetchApi<InventoryItem[]>('/pharmacy/inventory');
}

export async function addInventory(drugName: string, quantity: number): Promise<InventoryItem> {
  return fetchApi<InventoryItem>('/pharmacy/inventory', {
    method: 'POST',
    body: JSON.stringify({ drugName, quantity }),
  });
}
