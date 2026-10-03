import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./credscreen/Login";
import Signup from "./credscreen/Signup";
import ResetPassword from "./credscreen/ResetPassword";
import Home from "./screens/Home";
import Notes from "./screens/Notes";
import NoteEditor from "./screens/NoteEditor";
import Groups from "./screens/Groups";
import GroupDetail from "./screens/GroupDetail";
import Profile from "./screens/Profile";
import Splash from "./components/Splash";

// Loaded only when opened (the QR libraries are large)
const ActivityDetail = lazy(() => import("./screens/ActivityDetail"));
const Scan = lazy(() => import("./screens/Scan"));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Splash />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Logged in only (ProtectedRoute also shows the bottom nav and runs sync) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/notes/:id" element={<NoteEditor />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:groupId" element={<GroupDetail />} />
            <Route path="/activities/:activityId" element={<ActivityDetail />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
