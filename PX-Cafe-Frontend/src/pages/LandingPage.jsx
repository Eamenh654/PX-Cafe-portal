import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const portals = [
    { name: 'Employee', icon: '☕', desc: 'Order refreshments directly to your office desk.', path: '/login/employee' },
    { name: 'Kitchen', icon: '🧑‍🍳', desc: 'Manage order queue and inventory in real-time.', path: '/login/kitchen' },
    { name: 'Admin', icon: '⚙️', desc: 'Manage the menu, categories, and product variants.', path: '/login/admin' }
  ];

  return (
    <div className="landing-view">
      <div className="noise"></div>
      <div className="landing-content">
        <img src="/logo.png" alt="PX Cafe Logo" style={{ margin: '0 auto 32px', height: '60px' }} />
        <h1 className="landing-title">PX Cafe <br /><em>Portal</em></h1>
      </div>

      <div className="portal-grid">
        {portals.map(p => (
          <div key={p.name} className="portal-card" onClick={() => navigate(p.path)}>
            <div className="portal-icon">{p.icon}</div>
            <h2 className="portal-name">{p.name}</h2>
            <p className="portal-desc">{p.desc}</p>
            <button className="btn-secondary" style={{ marginTop: '24px', padding: '10px 20px' }}>Login</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
