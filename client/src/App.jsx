import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerTaskList from './pages/worker/WorkerTaskList';
import WorkerTaskDetails from './pages/worker/WorkerTaskDetails';
import OfficerComplaintDetails from './pages/officer/OfficerComplaintDetails';
import OfficerComplaintsList from './pages/officer/OfficerComplaintsList';
import ReportComplaint from './pages/citizen/ReportComplaint';
import CitizenComplaintDetails from './pages/citizen/CitizenComplaintDetails';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import StructureManagement from './pages/admin/StructureManagement.jsx';
import GramPanchayatManager from './pages/admin/gram-panchayats/GramPanchayatManager.jsx';
import PincodeExplorer from './pages/admin/pincodes/PincodeExplorer.jsx';
import OfficerDashboard from './components/officer/OfficerDashboard.jsx';
import CitizenDashboard from './components/citizen/CitizenDashboard.jsx';
import AdminDashboard from './pages/dashboard/AdminDashboard.jsx';
import DepartmentOfficerDashboard from './pages/dashboard/DepartmentOfficerDashboard.jsx';
import WardOfficerDashboard from './pages/dashboard/WardOfficerDashboard.jsx';
import DashboardRouter from './pages/dashboard/DashboardRouter.jsx';
import MainLayout from './layouts/MainLayout.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Citizen Routes ── */}
        <Route 
          path="/citizen/report" 
          element={
            <ProtectedRoute allowedRoles={['CITIZEN']}>
              <ReportComplaint />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/citizen/complaints/:id" 
          element={
            <ProtectedRoute allowedRoles={['CITIZEN']}>
              <CitizenComplaintDetails />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/citizen/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['CITIZEN']}>
              <MainLayout>
                <CitizenDashboard />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* ── Worker Routes ── */}
        <Route 
          path="/worker/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['WORKER']}>
              <MainLayout>
                <WorkerDashboard />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/worker/tasks" 
          element={
            <ProtectedRoute allowedRoles={['WORKER']}>
              <WorkerTaskList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/worker/tasks/:id" 
          element={
            <ProtectedRoute allowedRoles={['WORKER']}>
              <WorkerTaskDetails />
            </ProtectedRoute>
          } 
        />

        {/* ── Officer Routes ── */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['MUNICIPAL_ADMIN']}>
              <MainLayout>
                <OfficerDashboard />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/department/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['DEPARTMENT_OFFICER']}>
              <MainLayout>
                <DepartmentOfficerDashboard />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ward/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['WARD_OFFICER']}>
              <MainLayout>
                <WardOfficerDashboard />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/officer/complaints" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'DEPARTMENT_OFFICER', 'WARD_OFFICER']}>
              <OfficerComplaintsList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/officer/complaints/:id" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'DEPARTMENT_OFFICER', 'WARD_OFFICER']}>
              <OfficerComplaintDetails />
            </ProtectedRoute>
          } 
        />

        {/* ── Admin Routes ── */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/structure" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MUNICIPAL_ADMIN']}>
              <StructureManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/gram-panchayats" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <MainLayout>
                <GramPanchayatManager />
              </MainLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/pincodes" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MUNICIPAL_ADMIN']}>
              <MainLayout>
                <PincodeExplorer />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* ── Public Routes ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* ── Protected Dashboard Route ── */}
        <Route 
          path="/dashboard-router" 
          element={
            <ProtectedRoute>
              <DashboardRouter />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect root to dashboard-router (which redirects to login if unauth) */}
        <Route path="/" element={<Navigate to="/dashboard-router" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
