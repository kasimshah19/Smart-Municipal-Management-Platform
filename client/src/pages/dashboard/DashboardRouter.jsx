import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function DashboardRouter() {
  const { user } = useSelector((state) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'SUPER_ADMIN':
      return <Navigate to="/admin/dashboard" replace />;
    case 'MUNICIPAL_ADMIN':
      return <Navigate to="/dashboard" replace />;
    case 'DEPARTMENT_OFFICER':
      return <Navigate to="/department/dashboard" replace />;
    case 'WARD_OFFICER':
      return <Navigate to="/ward/dashboard" replace />;
    case 'WORKER':
      return <Navigate to="/worker/dashboard" replace />;
    case 'CITIZEN':
      return <Navigate to="/citizen/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}
