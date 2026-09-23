import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import RouteLoadingFallback from './components/common/RouteLoadingFallback.jsx';

// Eagerly load core auth pages
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';

// Eagerly load the DashboardRouter as it is the central entry point
import DashboardRouter from './pages/dashboard/DashboardRouter.jsx';

// Lazily load heavy dashboard and admin pages
const Home = React.lazy(() => import('./pages/Home.jsx'));
const WorkerDashboard = React.lazy(() => import('./pages/worker/WorkerDashboard'));
const WorkerTaskList = React.lazy(() => import('./pages/worker/WorkerTaskList'));
const WorkerTaskDetails = React.lazy(() => import('./pages/worker/WorkerTaskDetails'));
const OfficerComplaintDetails = React.lazy(() => import('./pages/officer/OfficerComplaintDetails'));
const OfficerComplaintsList = React.lazy(() => import('./pages/officer/OfficerComplaintsList'));
const ReportComplaint = React.lazy(() => import('./pages/citizen/ReportComplaint'));
const CitizenComplaintDetails = React.lazy(() => import('./pages/citizen/CitizenComplaintDetails'));
const StructureManagement = React.lazy(() => import('./pages/admin/StructureManagement.jsx'));
const GramPanchayatManager = React.lazy(() => import('./pages/admin/gram-panchayats/GramPanchayatManager.jsx'));
const PincodeExplorer = React.lazy(() => import('./pages/admin/pincodes/PincodeExplorer.jsx'));
const OfficerDashboard = React.lazy(() => import('./components/officer/OfficerDashboard.jsx'));
const CitizenDashboard = React.lazy(() => import('./components/citizen/CitizenDashboard.jsx'));
const AdminDashboard = React.lazy(() => import('./pages/dashboard/AdminDashboard.jsx'));
const DepartmentOfficerDashboard = React.lazy(() => import('./pages/dashboard/DepartmentOfficerDashboard.jsx'));
const WardOfficerDashboard = React.lazy(() => import('./pages/dashboard/WardOfficerDashboard.jsx'));

function App() {
  return (
    <Router>
      <Suspense fallback={<RouteLoadingFallback />}>
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
      </Suspense>
    </Router>
  );
}

export default App;
