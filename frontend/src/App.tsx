import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import type { ReactNode } from "react";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";
import SessionForm from "./pages/SessionForm";
import Profile from "./pages/Profile";
import { useAuth } from "./context/AuthProvider";

function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user?.admin ? children : <Navigate to="/sessions" replace />;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/sessions" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/sessions"
            element={
              <PrivateRoute>
                <Sessions />
              </PrivateRoute>
            }
          />
          <Route
            path="/sessions/:id"
            element={
              <PrivateRoute>
                <SessionDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/sessions/create"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <SessionForm />
                </AdminRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/sessions/edit/:id"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <SessionForm />
                </AdminRoute>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
