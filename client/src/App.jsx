import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ComplaintDetails from './pages/citizen/ComplaintDetails';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerTaskList from './pages/worker/WorkerTaskList';
import WorkerTaskDetails from './pages/worker/WorkerTaskDetails';
import OfficerComplaintDetails from './pages/officer/OfficerComplaintDetails';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import StructureManagement from './pages/admin/StructureManagement.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Worker Routes */}
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

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Dashboard Route */}
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/structure" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MUNICIPAL_ADMIN']}>
              <StructureManagement />
            </ProtectedRoute>
          } 
        />

        {/* Officer Routes */}
        <Route 
          path="/officer/complaints/:id" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'DEPARTMENT_OFFICER', 'WARD_OFFICER']}>
              <OfficerComplaintDetails />
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
