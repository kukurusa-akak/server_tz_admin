import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";
import { BranchProvider } from "./context/BranchContext";

// Pages
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MyInfoPage } from "./pages/MyInfoPage";
import { BranchManagementPage } from "./pages/BranchManagementPage";
import { DoctorManagementPage } from "./pages/DoctorManagementPage";
import { DoctorDisplayManagementPage } from "./pages/DoctorDisplayManagementPage";
import { EmployeeManagementPage } from "./pages/EmployeeManagementPage";
import { RecruitmentManagementPage } from "./pages/RecruitmentManagementPage";
import { PartnershipInquiryPage } from "./pages/PartnershipInquiryPage";
import { BeforeAfterManagementPage } from "./pages/BeforeAfterManagementPage";
import { HeroManagementPage } from "./pages/HeroManagementPage";
import { EventManagementPage } from "./pages/EventManagementPage";
import { SettingsManagementPage } from "./pages/SettingsManagementPage";
import { MainPageManagementPage } from "./pages/MainPageManagementPage";
import { PermissionManagementPage } from "./pages/PermissionManagementPage";
import { DeveloperPage } from "./pages/DeveloperPage";
import { NavigationManagementPage } from "./pages/NavigationManagementPage";
import { TreatmentManagementPage } from "./pages/TreatmentManagementPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { BranchContextUpdater } from "./components/BranchContextUpdater";
import { DashboardPage } from "./pages/DashboardPage";
import { RealtimeReservationPage } from "./pages/RealtimeReservationPage";
import { ReservationSchedulePage } from "./pages/ReservationSchedulePage";
import { ReservationPatientManagementPage } from "./pages/ReservationPatientManagementPage";
import { TonesNoticePage } from "./pages/TonesNoticePage";
import { TonesTechSupportPage } from "./pages/TonesTechSupportPage";
import { TonesWorkRequestPage } from "./pages/TonesWorkRequestPage";
import { TonesResourceCenterPage } from "./pages/TonesResourceCenterPage";
import { SnsManagementPage } from "./pages/SnsManagementPage";

const RedirectToLastBranch = () => {
  const lastVisited = localStorage.getItem('currentBranchSlug') || 'bupyeong';
  return <Navigate to={`/${lastVisited}`} replace />;
};

function App() {

  return (
    <ConfigProvider>
      <AuthProvider>
        <BranchProvider>
            <BrowserRouter>
              <Toaster 
                position="top-center"
                offset="80px"
                toastOptions={{
                  classNames: {
                    toast: 'bg-theme-primary-light border-theme-primary/20 shadow-lg text-lg p-6 w-full max-w-md',
                    title: 'text-theme-primary font-semibold',
                    description: 'text-charcoal-gray',
                  },
                }}
              />
              <BranchContextUpdater />
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<ProtectedRoute><RedirectToLastBranch /></ProtectedRoute>} />
                
                {/* The Layout route now wraps all branch-specific pages */}
                <Route path="/:branchSlug" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="my-info" element={<MyInfoPage />} />
                  <Route path="branches" element={<BranchManagementPage />} />
                  <Route path="doctors" element={<DoctorManagementPage />} />
                  <Route path="doctor-display" element={<DoctorDisplayManagementPage />} />
                  <Route path="employees" element={<EmployeeManagementPage />} />
                  <Route path="recruitment" element={<RecruitmentManagementPage />} />
                  <Route path="partnership-inquiry" element={<PartnershipInquiryPage />} />
                  <Route path="before-after" element={<BeforeAfterManagementPage />} />
                  <Route path="hero" element={<HeroManagementPage />} />
                  <Route path="events" element={<EventManagementPage />} />
                  <Route path="settings" element={<SettingsManagementPage />} />
                  <Route path="main-page" element={<MainPageManagementPage />} />
                  <Route path="permissions" element={<PermissionManagementPage />} />
                  <Route path="developer" element={<DeveloperPage />} />
                  <Route path="navigation" element={<NavigationManagementPage />} />
                  <Route path="treatments" element={<TreatmentManagementPage />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="reservations/realtime" element={<RealtimeReservationPage />} />
                  <Route path="reservations/schedule" element={<ReservationSchedulePage />} />
                  <Route path="patients" element={<ReservationPatientManagementPage />} />
                  <Route path="tones/notice" element={<TonesNoticePage />} />
                  <Route path="tones/tech-support" element={<TonesTechSupportPage />} />
                  <Route path="tones/work-request" element={<TonesWorkRequestPage />} />
                  <Route path="tones/resource-center" element={<TonesResourceCenterPage />} />
                  <Route path="sns" element={<SnsManagementPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
        </BranchProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;