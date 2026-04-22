import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthPortals = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('employee');
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
        navigate(data.user.role === 'kitchen' ? '/kitchen' : '/employee');
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
        <img src="/logo.png" alt="PX Cafe Logo" style={{ margin: '0 auto 24px', height: '60px' }} />
        <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="auth-subtitle">PX Cafe — Office Refreshment Portal</p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="role-toggle">
              <button 
                type="button" 
                className={role === 'employee' ? 'active' : ''} 
                onClick={() => setRole('employee')}
              >Employee</button>
              <button 
                type="button" 
                className={role === 'kitchen' ? 'active' : ''} 
                onClick={() => setRole('kitchen')}
              >Kitchen</button>
            </div>
          )}

          <div className="field-group">
            <label className="field-label">Username</label>
            <input 
              type="text" 
              required 
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Enter your username"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Password</label>
            <input 
              type="password" 
              required 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          {!isLogin && role === 'employee' && (
            <div className="field-group">
              <label className="field-label">Office Location</label>
              <input 
                type="text" 
                required 
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Floor 4, Office 412"
              />
            </div>
          )}

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary auth-submit">
            {isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh; background: var(--bg);
          padding: 20px;
        }
        .auth-card {
          background: var(--cream);
          width: 100%; max-width: 400px;
          padding: 48px 40px;
          border-radius: 4px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.05);
          position: relative; z-index: 10;
          animation: slideUp 0.6s ease;
        }
        .auth-title {
          font-family: 'Fraunces', serif;
          font-size: 32px; font-weight: 400; text-align: center;
          margin-bottom: 8px;
        }
        .auth-subtitle {
          text-align: center; font-size: 12px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--ink-mute);
          margin-bottom: 32px;
        }
        .role-toggle {
          display: flex; background: var(--bg-soft);
          padding: 4px; border-radius: 100px;
          margin-bottom: 24px;
        }
        .role-toggle button {
          flex: 1; border: none; background: transparent;
          padding: 10px; font-size: 12px; font-weight: 500;
          color: var(--ink-soft); border-radius: 100px;
        }
        .role-toggle button.active {
          background: var(--ink); color: var(--cream);
        }
        .brand-mark {
          width: 44px; height: 44px; background: var(--ink);
          color: var(--cream); border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Fraunces', serif; font-size: 22px; font-style: italic;
        }
        .field-group { margin-bottom: 20px; }
        .field-label {
          display: block; font-size: 11px; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--ink-mute); margin-bottom: 8px;
        }
        .auth-submit { width: 100%; margin-top: 12px; }
        .auth-footer { margin-top: 24px; text-align: center; }
        .auth-footer button {
          background: transparent; border: none; font-size: 13px;
          color: var(--ink-soft); text-decoration: underline;
        }
        .error-text { color: var(--red); font-size: 12px; margin: 12px 0; text-align: center; }
        input { width: 100%; }
      `}</style>
    </div>
  );
};

export default AuthPortals;
