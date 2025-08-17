import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";

// Pages
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { MyInfoPage } from "./pages/MyInfoPage";
import { BranchManagementPage } from "./pages/BranchManagementPage";
import { DoctorManagementPage } from "./pages/DoctorManagementPage";
import { HeroManagementPage } from "./pages/HeroManagementPage";
import { EventManagementPage } from "./pages/EventManagementPage";
import { SettingsManagementPage } from "./pages/SettingsManagementPage";
import { MainPageManagementPage } from "./pages/MainPageManagementPage";
import { PermissionManagementPage } from "./pages/PermissionManagementPage";
import { DeveloperPage } from "./pages/DeveloperPage";
import { NotFoundPage } from "./pages/NotFoundPage";

const RedirectToLastBranch = () => {
  const lastVisited = localStorage.getItem('lastVisitedBranchSlug') || 'bupyeong';
  return <Navigate to={`/${lastVisited}/branches`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<RedirectToLastBranch />} />
              
              <Route path="/:branchSlug" element={<Layout />}>
                <Route path="branches" element={<BranchManagementPage />} />
                <Route path="events" element={<EventManagementPage />} />
                <Route path="doctors" element={<DoctorManagementPage />} />
                <Route path="main-page" element={<MainPageManagementPage />} />
                <Route path="hero" element={<HeroManagementPage />} />
                <Route path="settings" element={<SettingsManagementPage />} />
                <Route path="permissions" element={<PermissionManagementPage />} />
                <Route path="developer" element={<DeveloperPage />} />
                <Route path="my-info" element={<MyInfoPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
