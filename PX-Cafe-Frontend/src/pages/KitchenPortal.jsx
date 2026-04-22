import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');

const KitchenPortal = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [sessionStarted, setSessionStarted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    fetchCompletedOrders();
    fetchProducts();

    const interval = setInterval(() => setCurrentTime(new Date()), 1000);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('order:new', (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
      setAlertText(`Order from ${newOrder.location}`);
      setShowAlert(true);
      if (sessionStarted && audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio blocked', e));
      }
      setTimeout(() => setShowAlert(false), 8000);
    });

    socket.on('order:status-changed', (updatedOrder) => {
      if (updatedOrder.status === 'delivered') {
        setOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
        setCompletedOrders(prev => [updatedOrder, ...prev].slice(0, 15));
      } else {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      }
    });

    socket.on('order:updated', (updatedOrder) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    return () => {
      clearInterval(interval);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('order:new');
      socket.off('order:status-changed');
      socket.off('order:updated');
    };
  }, [sessionStarted]);

  const startSession = () => {
    setSessionStarted(true);
    // Silent play to unlock audio context
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }).catch(e => console.log('Init audio fail', e));
    }
  };

  const fetchOrders = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/active`);
    const data = await res.json();
    setOrders(data);
  };

  const fetchCompletedOrders = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/completed`);
    const data = await res.json();
    setCompletedOrders(data);
  };

  const fetchProducts = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`);
    const data = await res.json();
    setProducts(data);
  };

  const updateStatus = async (orderId, newStatus) => {
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
  };

  const toggleProduct = async (prodId) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/${prodId}/toggle`, {
      method: 'PATCH'
    });
    if (res.ok) fetchProducts();
  };

  const handleClearCompleted = async () => {
    if (!window.confirm('Clear all recent completed orders from view?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/clear-completed`, {
        method: 'POST'
      });
      if (res.ok) {
        setCompletedOrders([]);
      } else {
        const errorData = await res.json();
        alert(`Failed to clear orders: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error('Network error clearing orders:', err);
      alert('Network error: Could not reach the server.');
    }
  };

  const getElapsedTime = (createdAt) => {
    // Append ' UTC' to tell JS the string is in UTC format
    const start = new Date(createdAt + ' UTC');
    const diff = Math.floor((currentTime - start) / 1000);
    const mins = Math.floor(Math.max(0, diff) / 60);
    const secs = Math.max(0, diff) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = {
    active: orders.filter(o => o.status !== 'ready').length,
    urgent: orders.filter(o => (currentTime - new Date(o.created_at + ' UTC')) > 300000 && o.status !== 'ready').length,
    today: orders.length + 44
  };

  return (
    <div className="kitchen-view">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      
      {!sessionStarted && (
        <div className="session-overlay">
          <img src="/logo.png" alt="PX Cafe Logo" style={{ height: 70, marginBottom: 40 }} />
          <h2>Kitchen <em>Station</em></h2>
          <p>Ready to start preparing refreshments? Enable notifications and audio alerts.</p>
          <button className="btn-primary" onClick={startSession} style={{ background: 'var(--cream)', color: 'var(--ink)', border: 'none' }}>Start Kitchen Session</button>
        </div>
      )}

      {showAlert && (
        <div className="sound-wave">
          <div className="wave-bars"><span></span><span></span><span></span><span></span><span></span></div>
          <h1 style={{ fontSize: 48, marginBottom: 16 }}>New Order!</h1>
          <div className="sound-text" style={{ fontSize: 24, color: 'white', opacity: 0.8 }}>{alertText}</div>
          <button className="btn-secondary" onClick={() => setShowAlert(false)} style={{ marginTop: 40, borderColor: 'white', color: 'white' }}>Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="kitchen-header">
        <div className="kitchen-brand brand">
          <img src="/logo.png" alt="PX Cafe Logo" style={{ height: 70 }} />
          <div style={{ marginLeft: 12 }}>
            <div className="brand-sub">Kitchen Station · {user.location || 'Floor 2'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div className={`conn-badge ${isConnected ? 'live' : ''}`} style={{ background: 'rgba(0,0,0,0.05)', color: isConnected ? 'var(--green)' : 'var(--ink-mute)' }}>
            {isConnected ? 'Live Connection' : 'Offline'}
          </div>
          <div className="kitchen-stats">
            <div className="kstat">
              <div className="kstat-val" style={{ color: 'var(--ink)' }}>{stats.active}</div>
              <div className="kstat-label" style={{ color: 'var(--ink-mute)' }}>Active</div>
            </div>
            <div className="kstat">
              <div className="kstat-val warn">{stats.urgent}</div>
              <div className="kstat-label" style={{ color: 'var(--ink-mute)' }}>Urgent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="kitchen-grid">
        <div>
          <div className="orders-section">
            <h2 style={{ color: 'var(--ink)' }}>Active Queue</h2>
            <div className="orders-row">
              {orders.filter(o => o.status !== 'delivered' && o.status !== 'declined').map(order => (
                <div key={order.id} className={`order-card ${(currentTime - new Date(order.created_at + ' UTC')) > 300000 ? 'urgent' : ''}`}>
                  <div className="ocard-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ opacity: 0.5, fontSize: 11, fontFamily: 'JetBrains Mono' }}>№ {order.id}</div>
                    <div className={`ocard-timer ${(currentTime - new Date(order.created_at + ' UTC')) > 300000 ? 'urgent' : ''}`} style={{ fontFamily: 'JetBrains Mono' }}>
                      {getElapsedTime(order.created_at)}
                    </div>
                  </div>
                  <div className="ocard-items" style={{ marginBottom: 20 }}>
                    {order.items.map(item => (
                      <div key={item.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: 18, fontFamily: 'Fraunces' }}>{item.product_name} <span style={{ opacity: 0.5, fontSize: 13 }}>×{item.quantity}</span></div>
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {item.selections && Array.isArray(item.selections) && item.selections.map((s, idx) => (
                            <span key={idx} style={{ 
                              fontSize: 10, 
                              background: 'rgba(184, 146, 74, 0.15)', 
                              color: 'var(--gold)', 
                              padding: '2px 8px', 
                              borderRadius: 4,
                              border: '1px solid rgba(184, 146, 74, 0.2)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              {s.variant_name}: {s.option_name}
                            </span>
                          ))}
                          {item.selections && !Array.isArray(item.selections) && Object.entries(item.selections).map(([vName, oName], idx) => (
                            <span key={idx} style={{ fontSize: 10, background: 'rgba(184, 146, 74, 0.15)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 4 }}>
                              {vName}: {oName}
                            </span>
                          ))}
                        </div>
                        {item.special_instructions && (
                          <div style={{ fontSize: 12, color: 'white', opacity: 0.7, fontStyle: 'italic', marginTop: 8, paddingLeft: 8, borderLeft: '2px solid var(--accent)' }}>
                            "{item.special_instructions}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 20, fontSize: 13, background: 'rgba(255,255,255,0.03)', padding: 12 }}>
                    <strong>{order.location}</strong> · {order.username}
                  </div>
                  <div className="ocard-actions" style={{ display: 'flex', gap: 8 }}>
                    {order.status === 'pending' ? (
                      <>
                        <button className="action-btn" style={{ flex: 1 }} onClick={() => updateStatus(order.id, 'declined')}>Decline</button>
                        <button className="action-btn primary" style={{ flex: 1 }} onClick={() => updateStatus(order.id, 'accepted')}>Accept</button>
                      </>
                    ) : order.status === 'accepted' || order.status === 'preparing' ? (
                      <button className="action-btn primary" style={{ flex: 1 }} onClick={() => updateStatus(order.id, 'ready')}>Ready for Pickup</button>
                    ) : (
                      <button className="action-btn primary" style={{ flex: 1, background: 'var(--green)', color: 'white', border: 'none' }} onClick={() => updateStatus(order.id, 'delivered')}>Mark Delivered</button>
                    )}
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p style={{ opacity: 0.3, fontStyle: 'italic' }}>Queue is empty...</p>}
            </div>
          </div>

          {/* Completed Orders Section */}
          <div className="orders-section" style={{ marginTop: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ color: 'var(--ink)', margin: 0 }}>Recently Completed</h2>
              {completedOrders.length > 0 && (
                <button 
                  onClick={handleClearCompleted}
                  className="btn-secondary"
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: 11, 
                    opacity: 0.6, 
                    borderColor: 'var(--line)', 
                    color: 'var(--ink)' 
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="orders-row">
              {completedOrders.map(order => (
                <div key={order.id} className="order-card" style={{ opacity: 0.6 }}>
                  <div className="ocard-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}>№ {order.id}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--green)' }}>
                      Delivered
                    </div>
                  </div>
                  <div className="ocard-items" style={{ marginBottom: 20 }}>
                    {order.items.map(item => (
                      <div key={item.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: 18, fontFamily: 'Fraunces' }}>{item.product_name} <span style={{ opacity: 0.5, fontSize: 13 }}>×{item.quantity}</span></div>
                        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {item.selections && Array.isArray(item.selections) && item.selections.map((s, idx) => (
                            <span key={idx} style={{ 
                              fontSize: 10, 
                              background: 'rgba(184, 146, 74, 0.1)', 
                              color: 'var(--gold)', 
                              padding: '2px 6px', 
                              borderRadius: 4,
                              textTransform: 'uppercase',
                              opacity: 0.8
                            }}>
                              {s.variant_name}: {s.option_name}
                            </span>
                          ))}
                          {item.selections && !Array.isArray(item.selections) && Object.entries(item.selections).map(([vName, oName], idx) => (
                            <span key={idx} style={{ fontSize: 10, background: 'rgba(184, 146, 74, 0.1)', color: 'var(--gold)', padding: '2px 6px', borderRadius: 4 }}>
                              {vName}: {oName}
                            </span>
                          ))}
                        </div>
                        {item.special_instructions && (
                          <div style={{ fontSize: 11, color: 'white', opacity: 0.5, fontStyle: 'italic', marginTop: 6 }}>
                            "{item.special_instructions}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 13, background: 'rgba(255,255,255,0.03)', padding: 12 }}>
                    <strong>{order.location}</strong> · {order.username}
                  </div>
                </div>
              ))}
              {completedOrders.length === 0 && <p style={{ opacity: 0.3, fontStyle: 'italic' }}>No completed orders yet.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default KitchenPortal;
