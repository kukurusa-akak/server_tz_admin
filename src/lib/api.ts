const API_BASE_URL = 'http://localhost:4000/api';

async function apiFetch(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('admin_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || `API error: ${response.statusText}`); }
    if (response.status === 204) { return null; }
    return response.json();
}

// --- User & Permission API ---
export type User = { id: number; username: string; role: 'USER' | 'BRANCH_ADMIN' | 'SUPER_ADMIN' | 'DEVELOPER' | 'DOCTOR'; branchId?: number | null; branch?: { name: string } | null };
export const login = (credentials: {username: string, password: string}): Promise<{token: string}> => 
    apiFetch(`${API_BASE_URL}/auth/login`, { method: 'POST', body: JSON.stringify(credentials) });
export const getUsers = (): Promise<User[]> => apiFetch(`${API_BASE_URL}/users`);
export const updateUserRole = (userId: number, role: string, branchId?: number | null): Promise<User> => 
    apiFetch(`${API_BASE_URL}/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role, branchId }) });
export const changePassword = (userId: number, currentPassword: string, newPassword: string) =>
    apiFetch(`${API_BASE_URL}/users/${userId}/password`, { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
export const getMe = (): Promise<User> => apiFetch(`${API_BASE_URL}/auth/me`);

// --- Branch API ---
export type Branch = { id: number; name: string; slug: string; [key: string]: any; };
export const getBranches = (): Promise<Branch[]> => apiFetch(`${API_BASE_URL}/branches`);
export const getBranchBySlug = (slug: string): Promise<Branch> => apiFetch(`${API_BASE_URL}/branches/${slug}`);
export const createBranch = (data: Partial<Branch>) => apiFetch(`${API_BASE_URL}/branches`, { method: 'POST', body: JSON.stringify(data) });
export const updateBranch = (id: number, data: Partial<Branch>) => apiFetch(`${API_BASE_URL}/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteBranch = (id: number) => apiFetch(`${API_BASE_URL}/branches/${id}`, { method: 'DELETE' });

// --- Doctor API ---
export type Doctor = { 
  id: number; 
  branchId: number; 
  name: string; 
  specialty?: string | null; 
  position?: string | null; 
  imageUrls?: string[] | null; 
  description?: string | null; 
  displayOrder?: number;
  branch?: { name: string };
  // HR Fields
  employeeId?: string | null;
  hireDate?: string | null; // Dates are often handled as ISO strings
  resignationDate?: string | null;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  internalContact?: string | null;
  privateNotes?: string | null;
  // Optional for creation
  username?: string;
  password?: string;
};
export const getDoctors = (): Promise<Doctor[]> => apiFetch(`${API_BASE_URL}/doctors`);
export const getDoctorById = (id: number): Promise<Doctor> => apiFetch(`${API_BASE_URL}/doctors/${id}`);
export const getDoctorsByBranch = (branchId: number): Promise<Doctor[]> => apiFetch(`${API_BASE_URL}/doctors/by-branch/${branchId}`);
export const createDoctor = (data: Omit<Doctor, 'id'>) => apiFetch(`${API_BASE_URL}/doctors`, { method: 'POST', body: JSON.stringify(data) });
export const updateDoctor = (id: number, data: Partial<Doctor>) => apiFetch(`${API_BASE_URL}/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDoctor = (id: number) => apiFetch(`${API_BASE_URL}/doctors/${id}`, { method: 'DELETE' });

// --- Employee API ---
export type Employee = { 
  id: number; 
  branchId: number; 
  name: string; 
  position?: string | null; 
  branch?: { name: string };
  employeeId?: string | null;
  hireDate?: string | null;
  resignationDate?: string | null;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  internalContact?: string | null;
  privateNotes?: string | null;
  // Optional for creation
  username?: string;
  password?: string;
};
export const getEmployees = (): Promise<Employee[]> => apiFetch(`${API_BASE_URL}/employees`);
export const getEmployeeById = (id: number): Promise<Employee> => apiFetch(`${API_BASE_URL}/employees/${id}`);
export const createEmployee = (data: Omit<Employee, 'id'>) => apiFetch(`${API_BASE_URL}/employees`, { method: 'POST', body: JSON.stringify(data) });
export const updateEmployee = (id: number, data: Partial<Employee>) => apiFetch(`${API_BASE_URL}/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEmployee = (id: number) => apiFetch(`${API_BASE_URL}/employees/${id}`, { method: 'DELETE' });

// --- Recruitment API ---
export type Education = {
  school: string;
  major: string;
  status: string;
};

export type WorkExperience = {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type Recruitment = {
  id: number;
  branchId: number;
  name: string;
  position: string;
  status: 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'REJECTED';
  phone?: string | null;
  email?: string | null;
  appliedDate: string;
  branch?: Branch;
  
  // New Resume Fields
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  education?: Education[] | null;
  workExperience?: WorkExperience[] | null;
  certifications?: string[] | null;
  desiredSalary?: number | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  notes?: string | null;
};

export type RecruitmentFilters = {
  minAge?: string;
  maxAge?: string;
  searchTerm?: string;
  minExp?: string;
  maxExp?: string;
  branchId?: number;
  status?: string;
};

export const getRecruitments = (filters: RecruitmentFilters = {}): Promise<Recruitment[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, String(value));
  });
  const queryString = params.toString();
  return apiFetch(`${API_BASE_URL}/recruitment${queryString ? `?${queryString}` : ''}`);
};
export const createRecruitment = (data: Partial<Recruitment>): Promise<Recruitment> => apiFetch(`${API_BASE_URL}/recruitment`, { method: 'POST', body: JSON.stringify(data) });
export const updateRecruitment = (id: number, data: Partial<Recruitment>): Promise<Recruitment> => apiFetch(`${API_BASE_URL}/recruitment/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRecruitment = (id: number) => apiFetch(`${API_BASE_URL}/recruitment/${id}`, { method: 'DELETE' });

// --- Partnership Inquiry API ---
export type PartnershipInquiry = {
  id: number;
  name: string;
  desiredRegion: string;
  contact: string;
  plannedOpeningDate?: string | null;
  experience?: string | null;
  dateOfBirth?: string | null;
  hasDoctorLicense: boolean;
  inquiryContent: string;
  isResolved: boolean;
  createdAt: string;
};

export type InquiryFilters = {
  hasDoctorLicense?: boolean;
  isResolved?: boolean;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
};

export const getPartnershipInquiries = (filters: InquiryFilters = {}): Promise<PartnershipInquiry[]> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const queryString = params.toString();
  return apiFetch(`${API_BASE_URL}/partnership-inquiry${queryString ? `?${queryString}` : ''}`);
};
export const updatePartnershipInquiry = (id: number, data: { isResolved: boolean }): Promise<PartnershipInquiry> => apiFetch(`${API_BASE_URL}/partnership-inquiry/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePartnershipInquiry = (id: number) => apiFetch(`${API_BASE_URL}/partnership-inquiry/${id}`, { method: 'DELETE' });

// --- Before & After API ---
export type BeforeAfter = {
  id: number;
  branchSlug: string;
  title: string;
  description?: string | null;
  beforeImageUrl: string;
  afterImageUrl: string;
  doctorBeforeComment?: string | null;
  doctorAfterComment?: string | null;
  customerReview?: string | null;
  createdAt: string;
};

export const getBeforeAfters = (branchSlug: string, searchTerm?: string): Promise<BeforeAfter[]> => {
  const params = new URLSearchParams({ branchSlug });
  if (searchTerm) params.append('searchTerm', searchTerm);
  return apiFetch(`${API_BASE_URL}/before-after?${params.toString()}`);
};
export const createBeforeAfter = (data: Partial<BeforeAfter>): Promise<BeforeAfter> => apiFetch(`${API_BASE_URL}/before-after`, { method: 'POST', body: JSON.stringify(data) });
export const updateBeforeAfter = (id: number, data: Partial<BeforeAfter>): Promise<BeforeAfter> => apiFetch(`${API_BASE_URL}/before-after/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteBeforeAfter = (id: number) => apiFetch(`${API_BASE_URL}/before-after/${id}`, { method: 'DELETE' });

// --- Config API ---
export type ServerConfig = { fileUploadEnabled: boolean; provider: 'gcs' | 'local' | 'disabled'; };
export const getServerConfig = (): Promise<ServerConfig> => apiFetch(`${API_BASE_URL}/config`);

// --- Upload API ---
export const uploadImage = (file: File): Promise<{ imageUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('admin_token');
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(`${API_BASE_URL}/upload/image`, { method: 'POST', body: formData, headers }).then(res => {
        if (!res.ok) throw new Error('File upload failed');
        return res.json();
    });
};

// --- Hero Section API ---
export const getHeroSections = (branchSlug: string) => apiFetch(`${API_BASE_URL}/hero/sections/${branchSlug}`);
export const createHeroSection = (data: any) => apiFetch(`${API_BASE_URL}/hero/sections`, { method: 'POST', body: JSON.stringify(data) });
export const updateHeroSection = (id: number, data: any) => apiFetch(`${API_BASE_URL}/hero/sections/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteHeroSection = (id: number) => apiFetch(`${API_BASE_URL}/hero/sections/${id}`, { method: 'DELETE' });

// --- Event API ---
export type Event = { id: number; branchSlug: string; title: string; description?: string | null; imageUrl: string; startDate: string; endDate: string; status: string; items?: any; showOnMainPromotion: boolean; showOnMainSignature: boolean; showOnMainSearchRanking: boolean; promotionTitle?: string | null; promotionDescription?: string | null; promotionImageUrl?: string | null; signatureTitle?: string | null; signatureDescription?: string | null; signatureImageUrl?: string | null; searchRankingTitle?: string | null; searchRankingDescription?: string | null; searchRankingImageUrl?: string | null; };
export const getEvents = (): Promise<Event[]> => apiFetch(`${API_BASE_URL}/events`);
export const getEventsByBranch = (branchSlug: string): Promise<Event[]> => apiFetch(`${API_BASE_URL}/events/branch/${branchSlug}`);
export const createEvent = (data: Omit<Event, 'id'>) => apiFetch(`${API_BASE_URL}/events`, { method: 'POST', body: JSON.stringify(data) });
export const updateEvent = (id: number, data: Partial<Event>) => apiFetch(`${API_BASE_URL}/events/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEvent = (id: number) => apiFetch(`${API_BASE_URL}/events/${id}`, { method: 'DELETE' });
export const updateEventDisplay = (category: string, items: { id: number; title: string; description: string | null; imageUrl: string | null }[]) => apiFetch(`${API_BASE_URL}/events/bulk-visibility`, { method: 'POST', body: JSON.stringify({ category, items }) });

// --- Treatment API ---
export type Treatment = { 
    id: number; 
    branchSlug: string; 
    name: string; 
    category?: string | null;
    price: number;
    description?: string | null; 
    imageUrl: string; 
    showOnMainPromotion: boolean; 
    showOnMainSignature: boolean; 
    showOnMainSearchRanking: boolean; 
    promotionTitle?: string | null; 
    promotionDescription?: string | null; 
    promotionImageUrl?: string | null; 
    signatureTitle?: string | null; 
    signatureDescription?: string | null; 
    signatureImageUrl?: string | null; 
    searchRankingTitle?: string | null; 
    searchRankingDescription?: string | null; 
    searchRankingImageUrl?: string | null; 
};
export const getAllTreatments = (): Promise<Treatment[]> => apiFetch(`${API_BASE_URL}/treatments`);
export const getTreatmentsByBranch = (branchSlug: string): Promise<Treatment[]> => apiFetch(`${API_BASE_URL}/treatments/${branchSlug}`);
export const createTreatment = (data: Omit<Treatment, 'id'>) => apiFetch(`${API_BASE_URL}/treatments`, { method: 'POST', body: JSON.stringify(data) });
export const updateTreatment = (id: number, data: Partial<Treatment>) => apiFetch(`${API_BASE_URL}/treatments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTreatment = (id: number) => apiFetch(`${API_BASE_URL}/treatments/${id}`, { method: 'DELETE' });
export const updateTreatmentDisplay = (category: string, items: { id: number; title: string; description: string | null; imageUrl: string | null }[]) => apiFetch(`${API_BASE_URL}/treatments/bulk-visibility`, { method: 'POST', body: JSON.stringify({ category, items }) });

// --- Sitemap API ---
export type SitemapEntry = {
  id: number;
  title: string;
  pagePath: string;
  fragment?: string | null;
  fullUrl: string;
  createdAt: string;
  updatedAt: string;
};

export const getSitemapEntries = (): Promise<SitemapEntry[]> =>
  apiFetch(`${API_BASE_URL}/sitemap`);

export const createSitemapEntry = (data: Omit<SitemapEntry, 'id' | 'fullUrl' | 'createdAt' | 'updatedAt'>): Promise<SitemapEntry> =>
  apiFetch(`${API_BASE_URL}/sitemap`, { method: 'POST', body: JSON.stringify(data) });

export const updateSitemapEntry = (id: number, data: Omit<SitemapEntry, 'id' | 'fullUrl' | 'createdAt' | 'updatedAt'>): Promise<SitemapEntry> =>
  apiFetch(`${API_BASE_URL}/sitemap/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteSitemapEntry = (id: number): Promise<null> =>
  apiFetch(`${API_BASE_URL}/sitemap/${id}`, { method: 'DELETE' });

export const generateSitemap = (target: 'portal' | 'admin'): Promise<{ message: string; path: string }> =>
  apiFetch(`${API_BASE_URL}/sitemap/generate`, { 
    method: 'POST',
    body: JSON.stringify({ target }) 
  });

// --- Navigation Link API ---
export type NavigationLink = {
  id: number;
  title: string;
  path: string;
  order: number;
  type: 'PORTAL' | 'ADMIN';
  icon?: string | null;
  category?: string | null;
  parentId?: number | null;
  isHomepage?: boolean;
  children?: NavigationLink[];
};

export const getNavigationLinks = (): Promise<NavigationLink[]> =>
  apiFetch(`${API_BASE_URL}/navigation`);

export const createNavigationLink = (data: Omit<NavigationLink, 'id'>): Promise<NavigationLink> =>
  apiFetch(`${API_BASE_URL}/navigation`, { method: 'POST', body: JSON.stringify(data) });

export const updateNavigationLink = (id: number, data: Omit<NavigationLink, 'id'>): Promise<NavigationLink> =>
  apiFetch(`${API_BASE_URL}/navigation/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteNavigationLink = (id: number): Promise<null> =>
  apiFetch(`${API_BASE_URL}/navigation/${id}`, { method: 'DELETE' });

export const renameNavigationCategory = (oldCategory: string, newCategory: string, type: 'ADMIN' | 'PORTAL'): Promise<{ message: string; count: number }> =>
  apiFetch(`${API_BASE_URL}/navigation/category/rename`, { method: 'POST', body: JSON.stringify({ oldCategory, newCategory, type }) });

export const bulkUpdateNavigationLinks = (links: { id: number; order: number; parentId?: number | null }[]): Promise<{ message: string }> =>
  apiFetch(`${API_BASE_URL}/navigation/bulk-update`, { method: 'POST', body: JSON.stringify({ links }) });

export const setHomepageNavigationLink = (id: number): Promise<{ message: string }> =>
  apiFetch(`${API_BASE_URL}/navigation/${id}/set-homepage`, { method: 'POST' });


// --- Site Settings API ---
export const getSiteSettings = () => apiFetch(`${API_BASE_URL}/home/site-settings`);
export const updateSiteSettings = (settings: any) => apiFetch(`${API_BASE_URL}/home/site-settings`, { method: 'PUT', body: JSON.stringify({ settings }) });

// --- Schedule API ---
export type ScheduleTemplate = {
  branchSlug: string;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  excludedTimes: { start: string; end: string }[];
  weeklyHolidays: number[];
};
export type DailyScheduleOverride = {
  branchSlug: string;
  date: string; // ISO String
  timeSlots: string[];
};

export const getScheduleTemplate = async (branchSlug: string): Promise<ScheduleTemplate | null> => {
  const token = localStorage.getItem('admin_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
      headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/schedule/template/${branchSlug}`, { headers });
  
  if (response.status === 404) {
    return null; // Not found is an expected state, not an error.
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `API error: ${response.statusText}`);
  }
  
  return response.json();
};

export const saveScheduleTemplate = (branchSlug: string, data: Omit<ScheduleTemplate, 'branchSlug'>): Promise<ScheduleTemplate> =>
  apiFetch(`${API_BASE_URL}/schedule/template/${branchSlug}`, { method: 'POST', body: JSON.stringify(data) });

export const getDailyOverrides = (branchSlug: string, month: string): Promise<DailyScheduleOverride[]> => // month format: YYYY-MM
  apiFetch(`${API_BASE_URL}/schedule/overrides/${branchSlug}?month=${month}`);

export const saveDailyOverride = (branchSlug: string, data: Omit<DailyScheduleOverride, 'branchSlug'>): Promise<DailyScheduleOverride> =>
  apiFetch(`${API_BASE_URL}/schedule/overrides/${branchSlug}`, { method: 'POST', body: JSON.stringify(data) });

export const deleteDailyOverride = (branchSlug: string, date: string): Promise<null> =>
    apiFetch(`${API_BASE_URL}/schedule/overrides/${branchSlug}`, { method: 'DELETE', body: JSON.stringify({ date }) });

// --- Patient Management API ---
export type Patient = {
    id: number;
    name: string;
    phone: string;
    chartNumber?: string | null;
    dateOfBirth?: string | null;
    notes?: string | null;
    reservations?: any[]; // Define more specific type if needed
    consultationMemos?: any[]; // Define more specific type if needed
};
export type ConsultationMemo = {
    id: number;
    patientId: number;
    employeeName: string;
    content: string;
    createdAt: string;
};

export const searchPatients = (params: { name?: string; phone?: string }): Promise<Patient[]> => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch(`${API_BASE_URL}/patients?${query}`);
};

export const getPatientDetails = (id: number): Promise<Patient> =>
    apiFetch(`${API_BASE_URL}/patients/${id}`);

export const addConsultationMemo = (patientId: number, content: string, employeeName: string): Promise<ConsultationMemo> =>
    apiFetch(`${API_BASE_URL}/patients/${patientId}/memos`, { method: 'POST', body: JSON.stringify({ content, employeeName }) });
