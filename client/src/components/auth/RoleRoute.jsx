import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If authenticated but not authorized, redirect to an unauthorized page or home
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleRoute;
