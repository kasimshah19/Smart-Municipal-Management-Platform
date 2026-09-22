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

        {/* ── Worker Routes ── */}
        <Route 
          path="/worker/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['WORKER']}>
              <WorkerDashboard />
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
          path="/admin/structure" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MUNICIPAL_ADMIN']}>
              <StructureManagement />
            </ProtectedRoute>
          } 
        />

        {/* ── Public Routes ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* ── Protected Dashboard Route ── */}
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect root to dashboard (which redirects to login if unauth) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
