import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, roles }) {
  const auth = useSelector((s) => s.auth);
  const location = useLocation();

  if (!auth?.token || !auth?.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(auth.user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
