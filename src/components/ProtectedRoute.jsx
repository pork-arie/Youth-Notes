import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth";
import { useSync } from "../hooks/useSync";
import BottomNav from "./BottomNav";
import Splash from "./Splash";

function SyncRunner() {
  useSync();
  return null;
}

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <SyncRunner />
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

export default ProtectedRoute;
