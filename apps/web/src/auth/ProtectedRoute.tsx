import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth.js';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <p>Cargando...</p>; // rehidratando sin conocer estado de sesión
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}
