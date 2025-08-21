export type ReservationStatus = 
  | "REQUESTED"
  | "CONFIRMED"
  | "IN_TREATMENT"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED"
  | "CONTACT_UNREACHABLE";

export type Reservation = {
  id: number;
  patientId: number;
  receptionTimestamp: string;
  desiredTimestamp: string;
  status: ReservationStatus;
  treatments: { name: string; price: number }[];
  customerNotes?: string;
  history: any[];
  createdAt: string;
  updatedAt: string;
  patient: Patient;
};

export type Patient = {
  id: number;
  name: string;
  phone: string;
  chartNumber?: string;
  dateOfBirth?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type NavigationLink = {
  id: number;
  title: string;
  path: string;
  order: number;
  type: 'PORTAL' | 'ADMIN';
  icon?: string;
  category?: string;
  parentId?: number;
  children?: NavigationLink[];
  isHomepage?: boolean;
};