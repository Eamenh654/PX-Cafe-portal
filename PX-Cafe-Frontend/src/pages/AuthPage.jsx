import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const AuthPage = ({ setUser, isUnifiedLogin = false }) => {
  const { role } = useParams(); // 'employee', 'kitchen', 'admin'
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', location: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const body = isLogin ? { username: formData.username, password: formData.password } : { ...formData, role };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        navigate(`/${data.user.role}`);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="noise"></div>
      <div className="auth-card">
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: '24px', left: '24px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>←</button>
        <img src="/logo.png" alt="PX Cafe Logo" style={{ margin: '0 auto 24px', height: '60px' }} />
        <h2 className="auth-title">{isLogin ? 'Sign In' : 'Join PX Cafe'}</h2>
        <p className="auth-subtitle">{role ? role.toUpperCase() + ' REGISTRATION' : 'STAFF LOGIN'}</p>

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label className="field-label">Username</label>
            <input 
              type="text" 
              required 
              style={{ width: '100%' }}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Username"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <input 
              type="password" 
              required 
              style={{ width: '100%' }}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          {!isLogin && role === 'employee' && (
            <div className="field-group">
              <label className="field-label">Office / Room</label>
              <input 
                type="text" 
                required 
                style={{ width: '100%' }}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Office 412"
              />
            </div>
          )}

          {error && <p style={{ color: 'var(--red)', fontSize: '12px', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}

          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {!isUnifiedLogin && (
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'none', border: 'none', fontSize: '13px', color: 'var(--ink-soft)', textDecoration: 'underline', cursor: 'pointer' }}
            >
              {isLogin ? "Need an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
