import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import StructureManagement from './pages/admin/StructureManagement.jsx';

function App() {
  return (
    <Router>
      <Routes>
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
        
        {/* Redirect root to dashboard (which redirects to login if unauth) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
