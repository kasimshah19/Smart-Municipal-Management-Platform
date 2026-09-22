import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ROLE_HOME = {
  SUPER_ADMIN: '/admin/dashboard',
  MUNICIPAL_ADMIN: '/dashboard',
  DEPARTMENT_OFFICER: '/department/dashboard',
  WARD_OFFICER: '/ward/dashboard',
  WORKER: '/worker/dashboard',
  CITIZEN: '/citizen/dashboard',
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If allowedRoles is specified, check if user's role is in the allowed list
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to user's own dashboard instead of showing unauthorized content
    const homePath = ROLE_HOME[user.role] || '/login';
    return <Navigate to={homePath} replace />;
  }

  return children;
};

export default ProtectedRoute;

