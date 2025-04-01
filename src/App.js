import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import UserProfile from './pages/UserProfile/UserProfile';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import AuthContext from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import Contact from './pages/Contact/Contact';
import './App.css';

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true
  });

  // Verificación de autenticación al cargar la app
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user') 
        ? JSON.parse(localStorage.getItem('user'))
        : null;

      if (token) {
        try {
          const response = await fetch('http://localhost:5000/verify-auth', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setAuthState({
              isAuthenticated: true,
              user: data.user || userData,
              token,
              loading: false
            });
            // Actualizar localStorage con los datos más recientes del usuario
            localStorage.setItem('user', JSON.stringify(data.user || userData));
          } else {
            clearAuthData();
          }
        } catch (error) {
          console.error('Error verifying auth:', error);
          clearAuthData();
        }
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };

    verifyAuth();
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false
    });
  };

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuthState({
      isAuthenticated: true,
      user: userData,
      token,
      loading: false
    });
  };

  const logout = () => {
    clearAuthData();
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setAuthState(prev => ({
      ...prev,
      user: updatedUser
    }));
  };

  if (authState.loading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, updateUser }}>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route 
            path="/login" 
            element={
              authState.isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Login onLogin={login} />
            } 
          />
          
          <Route 
            path="/register" 
            element={
              authState.isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Register onRegister={login} />
            } 
          />

          <Route 
            path="/forgot-password" 
            element={
              authState.isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <ForgotPassword />
            } 
          />

          <Route 
            path="/reset-password" 
            element={
              authState.isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <ResetPassword />
            } 
          />

          <Route 
            path="/contact" 
            element={
              authState.isAuthenticated ? 
                <Contact /> : 
                <Navigate to="/login" replace state={{ from: '/contact' }} />
            } 
          />
          
          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Nueva ruta para perfiles de otros usuarios */}
            <Route path="/user/:userId" element={<UserProfile />} />
          </Route>
          
          {/* Redirecciones */}
          <Route 
            path="/" 
            element={
              authState.isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/login" replace />
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;