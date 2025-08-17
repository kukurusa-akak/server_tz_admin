import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";
import { BranchProvider } from "./context/BranchContext";
import { useState, useEffect } from "react";
import { getNavigationLinks, NavigationLink } from "./lib/api";

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

const DynamicRedirect = ({ navLinks }: { navLinks: NavigationLink[] }) => {
  const homepageLink = navLinks
    .flatMap(parent => parent.children || [])
    .find(child => child.isHomepage);
  
  const redirectTo = homepageLink?.path || 'dashboard';

  return <Navigate to={redirectTo} replace />;
};

const RedirectToLastBranch = () => {
  const lastVisited = localStorage.getItem('currentBranchSlug') || 'bupyeong';
  return <Navigate to={`/${lastVisited}`} replace />;
};

function App() {
  const [navLinks, setNavLinks] = useState<NavigationLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      getNavigationLinks()
        .then(data => {
          setNavLinks(data.filter(link => link.type === 'ADMIN'));
        })
        .catch(err => console.error("Failed to fetch nav links for redirect:", err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return <div>Loading navigation...</div>;
  }

  return (
    <ConfigProvider>
      <AuthProvider>
        <BranchProvider>
            <BrowserRouter>
              <BranchContextUpdater />
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<ProtectedRoute><RedirectToLastBranch /></ProtectedRoute>} />
                <Route path="/:branchSlug" element={<ProtectedRoute><Layout navLinks={navLinks} /></ProtectedRoute>}>
                  <Route index element={<DynamicRedirect navLinks={navLinks} />} />
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
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
        </BranchProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;