import "./App.css";
import {
  BrowserRouter as Router,
  NavLink,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import EventForm from "./components/EventForm";
import ProfileForm from "./components/ProfileForm";
import LoginRegister from "./components/LoginRegister";
import VolunteerMatching from "./components/VolunteerMatching";
import Notifications from "./components/Notifications";
import VolunteerHistory from "./components/VolunteerHistory";
import { getUserRole, isAuthenticated, logout } from "./utils/auth";

// Protected Route Component for Admin-only pages
function AdminRoute({ children }) {
  const isAuth = isAuthenticated();
  const role = getUserRole();
  
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  if (role !== "admin") {
    return <Navigate to="/profile" replace />;
  }
  
  return children;
}

// Protected Route Component for Authenticated users
function ProtectedRoute({ children }) {
  const isAuth = isAuthenticated();
  
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function App() {
  const userRole = getUserRole();
  const authenticated = isAuthenticated();

  return (
    <Router>
      <div className="app-shell">
        <section className="header">
          <div className="header-buttons">
            <div className="header-left">
              {!authenticated ? (
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    isActive ? "header-btn active" : "header-btn"
                  }
                >
                  Login / Sign Up
                </NavLink>
              ) : (
                <span className="header-btn header-role">
                  {userRole === "admin" ? "Admin" : "Volunteer"}
                </span>
              )}
            </div>
            <div className="header-center">
              {/* Only show Create Event and Matching for Admins */}
              {authenticated && userRole === "admin" && (
                <>
                  <NavLink
                    end
                    to="/"
                    className={({ isActive }) =>
                      isActive ? "header-btn active" : "header-btn"
                    }
                  >
                    Create Event
                  </NavLink>
                  <NavLink
                    to="/matching"
                    className={({ isActive }) =>
                      isActive ? "header-btn active" : "header-btn"
                    }
                  >
                    Matching
                  </NavLink>
                </>
              )}
              
              {/* Show Notifications for all authenticated users */}
              {authenticated && (
                <NavLink
                  to="/notifications"
                  className={({ isActive }) =>
                    isActive ? "header-btn active" : "header-btn"
                  }
                >
                  <span className="header-btn-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    Notifications
                  </span>
                </NavLink>
              )}
            </div>
            <div className="header-right">
              {authenticated && (
                <>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      isActive ? "header-btn active" : "header-btn"
                    }
                  >
                    Profile
                  </NavLink>
                  <NavLink
                    to="/history"
                    className={({ isActive }) =>
                      isActive ? "header-btn active" : "header-btn"
                    }
                  >
                    History
                  </NavLink>
                  <button
                    className="header-btn header-logout"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <main className="app-main">
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginRegister />} />
            
            {/* Admin-only routes */}
            <Route 
              path="/" 
              element={
                <AdminRoute>
                  <EventForm />
                </AdminRoute>
              } 
            />
            <Route 
              path="/matching" 
              element={
                <AdminRoute>
                  <VolunteerMatching />
                </AdminRoute>
              } 
            />
            
            {/* Protected routes for all authenticated users */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfileForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <VolunteerHistory />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
