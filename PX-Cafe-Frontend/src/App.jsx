import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import EmployeePortal from './pages/EmployeePortal';
import KitchenPortal from './pages/KitchenPortal';
import AdminPortal from './pages/AdminPortal';

function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Failed to parse user from localstorage', e);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage setUser={setUser} isUnifiedLogin={true} />} />
        <Route path="/portal" element={<LandingPage />} />
        <Route path="/login/:role" element={<AuthPage setUser={setUser} isUnifiedLogin={false} />} />
        
        {/* Portal Routes */}
        <Route 
          path="/employee" 
          element={user && user.role === 'employee' ? <EmployeePortal user={user} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/kitchen" 
          element={user && user.role === 'kitchen' ? <KitchenPortal user={user} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/admin" 
          element={user && user.role === 'admin' ? <AdminPortal user={user} /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
