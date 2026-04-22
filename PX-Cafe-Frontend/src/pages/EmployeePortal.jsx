import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Icons } from '../components/Icons';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001');

const EmployeePortal = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selections, setSelections] = useState({});
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [activeTab, setActiveTab] = useState('menu');
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editingOrderId, setEditingOrderId] = useState(null);
  const audioRef = useRef(null);
  const autoDeliverTimers = useRef({}); // { orderId: timeoutId }

  const formatImageUrl = (url) => {
    if (!url) return url;
    if (url.includes('http://localhost:3001')) {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      return url.replace('http://localhost:3001', apiBase.replace(/\/+$/, ''));
    }
    return url;
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchOrderHistory();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('order:status-changed', (order) => {
      if (order.user_id === user.id) {
        fetchOrderHistory();
        if (order.status === 'ready') {
          if (audioRef.current) audioRef.current.play().catch(e => console.log('Audio blocked', e));
          setToast(`${order.items[0].product_name} is ready!`);
          setTimeout(() => setToast(null), 5000);
        }
      }
    });

    socket.on('order:updated', () => {
        fetchOrderHistory();
    });

    return () => {
      clearInterval(timer);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('order:status-changed');
      socket.off('order:updated');
      // Cleanup timers
      Object.values(autoDeliverTimers.current).forEach(clearTimeout);
    };
  }, [user.id]);

  useEffect(() => {
    // Automatic delivery logic for 'ready' orders
    orderHistory.forEach(order => {
        if (order.status === 'ready' && !autoDeliverTimers.current[order.id]) {
            autoDeliverTimers.current[order.id] = setTimeout(() => {
                updateStatus(order.id, 'delivered');
                delete autoDeliverTimers.current[order.id];
            }, 60000); // 1 minute auto-deliver
        }
    });
  }, [orderHistory]);

  useEffect(() => {
    // Only set defaults if we are NOT in edit mode
    if (!editingOrderId && selectedProduct && selectedProduct.variants) {
      const defaults = {};
      selectedProduct.variants.forEach(v => {
        if (v.type === 'slider') {
          defaults[v.name] = '50%';
        } else {
          const defaultOpt = v.options.find(opt => opt.is_default === 1);
          if (defaultOpt) {
            defaults[v.name] = defaultOpt.name;
          } else if (v.options.length > 0) {
            defaults[v.name] = v.options[0].name;
          }
        }
      });
      setSelections(defaults);
    }
  }, [selectedProduct, editingOrderId]);

  const fetchProducts = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`);
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/categories`);
    const data = await res.json();
    setCategories([{ id: 'all', name: 'all' }, ...data]);
  };

  const fetchOrderHistory = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/user/${user.id}/history`);
    const data = await res.json();
    setOrderHistory(data);
  };

  const getElapsedTime = (createdAt) => {
    const start = new Date(createdAt + ' UTC');
    const diff = Math.floor((currentTime - start) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}m ${s}s`;
  };

  const handlePlaceOrder = async () => {
    const orderData = {
      userId: user.id,
      items: [{
        productId: selectedProduct.id,
        quantity: quantity,
        instructions,
        selections
      }]
    };

    console.log('Sending order data:', JSON.stringify(orderData, null, 2));
    try {
      const url = editingOrderId 
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/${editingOrderId}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders`;
      
      const res = await fetch(url, {
        method: editingOrderId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        setSelectedProduct(null);
        setSelections({});
        setInstructions('');
        setQuantity(1);
        setEditingOrderId(null);
        fetchOrderHistory();
        setToast(editingOrderId ? 'Order updated!' : 'Order placed!');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setToast('Connection failed');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      fetchOrderHistory();
    }
  };

  const handleEditOrder = (order) => {
    const item = order.items[0];
    const product = products.find(p => p.id === item.product_id);
    if (!product) return;

    setSelectedProduct(product);
    setQuantity(item.quantity);
    setInstructions(item.special_instructions);
    
    const sel = {};
    item.selections.forEach(s => {
        sel[s.variant_name] = s.option_name;
    });
    setSelections(sel);
    setEditingOrderId(order.id);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/${orderId}`, {
        method: 'DELETE'
    });
    if (res.ok) {
        fetchOrderHistory();
        setToast('Order cancelled');
        setTimeout(() => setToast(null), 3000);
    }
  };

  const filteredProducts = category === 'all' 
    ? products 
    : products.filter(p => p.category === category);

  const todaysOrders = orderHistory.filter(o => {
      const oDate = new Date(o.created_at + ' UTC').toLocaleDateString();
      return oDate === new Date().toLocaleDateString();
  });

  const filteredHistory = historyDateFilter 
    ? orderHistory.filter(o => {
        const localDate = new Date(o.created_at + ' UTC');
        const yyyy = localDate.getFullYear();
        const mm = String(localDate.getMonth() + 1).padStart(2, '0');
        const dd = String(localDate.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}` === historyDateFilter;
      })
    : orderHistory;

  const pendingOrders = orderHistory.filter(o => ['pending', 'accepted', 'preparing'].includes(o.status));
  const readyOrders = orderHistory.filter(o => o.status === 'ready');
  const pastOrders = orderHistory.filter(o => ['delivered', 'declined'].includes(o.status));

  const tabLabel = (base, count) => count > 0 ? `${base} (${count})` : base;

  const renderMenuItem = (item) => (
    <div 
      key={item.id} 
      className={`menu-item ${!item.is_available ? 'unavailable' : ''}`}
      onClick={() => {
        if (item.is_available) {
          setSelectedProduct(item);
          setSelectedHistoryOrder(null);
        }
      }}
      style={{ opacity: item.is_available ? 1 : 0.5 }}
    >
      <div className="item-image">
        {item.image_url ? (
          <img src={formatImageUrl(item.image_url)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          Icons[item.icon] ? Icons[item.icon]() : null
        )}
        {!item.is_available && <div style={{ position: 'absolute', background: 'var(--red)', color: 'white', padding: '4px 8px', fontSize: 10 }}>OUT OF STOCK</div>}
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h3 style={{ fontSize: 18 }}>{item.name}</h3>
        </div>
      </div>
    </div>
  );

  return (
    <div className="employee-view">
      <div className="noise"></div>

      {toast && (
        <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--ink)', color: 'var(--cream)', padding: '12px 24px', borderRadius: '100px', zIndex: 10000, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease' }}>
            <span style={{ width: 8, height: 8, background: 'var(--green)', borderRadius: '50%' }}></span>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="emp-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div className="brand">
            <img src="/logo.png" alt="PX Cafe Logo" style={{ height: 36 }} />
          </div>
          <div className={`conn-badge ${isConnected ? 'live' : ''}`}>
            {isConnected ? 'On' : 'Off'}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>Location</div>
            <div style={{ fontSize: 14 }}>{user.location}</div>
          </div>
          <div style={{ width: 40, height: 40, background: 'var(--ink)', color: 'var(--cream)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
            {user.username[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="hero">
        <h1 className="hero-title">
          Hi {user.username}.<br />
          Welcome to PX Cafe.
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, borderBottom: '1px solid rgba(0,0,0,0.1)', overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'none' }}>
        <button 
          onClick={() => setActiveTab('menu')}
          style={{ background: 'none', border: 'none', padding: '0 0 12px', fontSize: 16, cursor: 'pointer', borderBottom: activeTab === 'menu' ? '2px solid var(--ink)' : '2px solid transparent', opacity: activeTab === 'menu' ? 1 : 0.5, fontWeight: activeTab === 'menu' ? 600 : 400, whiteSpace: 'nowrap' }}
        >Menu</button>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ background: 'none', border: 'none', padding: '0 0 12px', fontSize: 16, cursor: 'pointer', borderBottom: activeTab === 'pending' ? '2px solid var(--ink)' : '2px solid transparent', opacity: activeTab === 'pending' ? 1 : 0.5, fontWeight: activeTab === 'pending' ? 600 : 400, whiteSpace: 'nowrap' }}
        >{tabLabel('Pending', pendingOrders.length)}</button>
        <button 
          onClick={() => setActiveTab('ready')}
          style={{ background: 'none', border: 'none', padding: '0 0 12px', fontSize: 16, cursor: 'pointer', borderBottom: activeTab === 'ready' ? '2px solid var(--ink)' : '2px solid transparent', opacity: activeTab === 'ready' ? 1 : 0.5, fontWeight: activeTab === 'ready' ? 600 : 400, whiteSpace: 'nowrap' }}
        >{tabLabel('Ready', readyOrders.length)}</button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ background: 'none', border: 'none', padding: '0 0 12px', fontSize: 16, cursor: 'pointer', borderBottom: activeTab === 'history' ? '2px solid var(--ink)' : '2px solid transparent', opacity: activeTab === 'history' ? 1 : 0.5, fontWeight: activeTab === 'history' ? 600 : 400, whiteSpace: 'nowrap' }}
        >History</button>
      </div>

      {activeTab === 'menu' && (
        <>
          {/* Categories */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 32, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
            {categories.map(cat => (
              <button 
                key={cat.id}
                style={{ 
                  background: 'none', border: 'none', padding: '0 0 4px', 
                  fontFamily: 'Fraunces', fontSize: 18, fontStyle: 'italic',
                  color: category === cat.name ? 'var(--ink)' : 'var(--ink-mute)',
                  borderBottom: category === cat.name ? '1px solid var(--ink)' : 'none',
              cursor: 'pointer', whiteSpace: 'nowrap'
            }}
            onClick={() => setCategory(cat.name)}
          >
            {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="menu-grid">
        {category === 'all' ? (
          categories.filter(c => c.name !== 'all').map(cat => {
            const catProducts = products.filter(p => p.category === cat.name);
            if (catProducts.length === 0) return null;
            
            return (
              <React.Fragment key={cat.id}>
                <div className="category-divider">
                  <h2>{cat.name}</h2>
                  <div className="line"></div>
                </div>
                {catProducts.map(item => renderMenuItem(item))}
              </React.Fragment>
            );
          })
        ) : (
          filteredProducts.map(item => renderMenuItem(item))
        )}
        
        {filteredProducts.length === 0 && !loading && (
            <p style={{ opacity: 0.5, fontStyle: 'italic', gridColumn: '1/-1', textAlign: 'center', padding: '40px 0' }}>No items in this category yet.</p>
        )}
      </div>
      </>
      )}

      {activeTab === 'pending' && (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <h2 style={{ fontSize: 24, marginBottom: 24 }}>In Preparation</h2>
            {pendingOrders.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', opacity: 0.5, border: '1px dashed var(--line)' }}>No orders currently in the kitchen.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {pendingOrders.map(o => (
                        <div key={o.id} style={{ padding: 20, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--cream)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div>
                                    <div style={{ fontSize: 18, fontFamily: 'Fraunces', marginBottom: 4 }}>{o.items[0].product_name} <span style={{ opacity: 0.5, fontSize: 14 }}>×{o.items[0].quantity}</span></div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--accent)', textTransform: 'uppercase' }}>{o.status}</div>
                                        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', opacity: 0.5 }}>{getElapsedTime(o.created_at)}</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.5 }}>#{o.id}</div>
                            </div>

                            {o.status === 'pending' && (
                                <div className="order-item-actions">
                                    <button 
                                        onClick={() => handleEditOrder(o)}
                                        className="btn-item-action"
                                        style={{ 
                                            flex: 1, padding: '6px 12px', fontSize: '11px', 
                                            background: 'var(--ink)', color: 'var(--cream)', 
                                            border: 'none', cursor: 'pointer', borderRadius: '4px' 
                                        }}
                                    >Edit Order</button>
                                    <button 
                                        onClick={() => handleCancelOrder(o.id)}
                                        className="btn-item-action"
                                        style={{ 
                                            flex: 1, padding: '6px 12px', fontSize: '11px', 
                                            background: 'transparent', color: 'var(--red)', 
                                            border: '1px solid var(--red)', cursor: 'pointer', borderRadius: '4px' 
                                        }}
                                    >Cancel</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) }
        </div>
      )}

      {activeTab === 'ready' && (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <h2 style={{ fontSize: 24, marginBottom: 24 }}>Ready for Pickup</h2>
            {readyOrders.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', opacity: 0.5, border: '1px dashed var(--line)' }}>Nothing ready for pickup yet.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {readyOrders.map(o => (
                        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, border: '2px solid var(--green)', borderRadius: 8, background: 'var(--cream)' }}>
                            <div>
                                <div style={{ fontSize: 18, fontFamily: 'Fraunces', marginBottom: 4 }}>{o.items[0].product_name} <span style={{ opacity: 0.5, fontSize: 14 }}>×{o.items[0].quantity}</span></div>
                                <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--green)', textTransform: 'uppercase' }}>WAITING AT STATION</div>
                            </div>
                            <button 
                                onClick={() => updateStatus(o.id, 'delivered')}
                                style={{ background: 'var(--green)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                            >Received</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ animation: 'fadeIn 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24 }}>Past Orders</h2>
                <input 
                    type="date" 
                    value={historyDateFilter} 
                    onChange={e => setHistoryDateFilter(e.target.value)} 
                    style={{ padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 4, background: 'var(--bg)', fontFamily: 'JetBrains Mono' }}
                />
            </div>
            
            {filteredHistory.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', opacity: 0.5, border: '1px dashed var(--line)' }}>No orders found for this date.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredHistory.map(o => (
                        <div key={o.id} onClick={() => { setSelectedHistoryOrder(o); setSelectedProduct(null); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 20, border: '1px solid var(--line)', borderRadius: 8, cursor: 'pointer', background: 'var(--cream)' }}>
                            <div>
                                <div style={{ fontSize: 18, fontFamily: 'Fraunces', marginBottom: 4 }}>{o.items[0].product_name} <span style={{ opacity: 0.5, fontSize: 14 }}>×{o.items[0].quantity}</span></div>
                                <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono', opacity: 0.5 }}>{new Date(o.created_at + ' UTC').toLocaleString()}</div>
                            </div>
                            <div style={{ opacity: 0.6, fontSize: 14 }}>{o.status.toUpperCase()}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      {/* History Details Modal */}
      {selectedHistoryOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedHistoryOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3>Order Receipt</h3>
              <button onClick={() => setSelectedHistoryOrder(null)} style={{ background: 'none', border: 'none', fontSize: 20 }}>✕</button>
            </div>
            <div style={{ marginBottom: 24, fontSize: 12, fontFamily: 'JetBrains Mono', opacity: 0.5 }}>
                Date: {new Date(selectedHistoryOrder.created_at + ' UTC').toLocaleString()} <br/>
                Status: {selectedHistoryOrder.status.toUpperCase()}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {selectedHistoryOrder.items.map(item => (
                    <div key={item.id} style={{ borderBottom: '1px solid var(--line-soft)', paddingBottom: 16 }}>
                        <h2 style={{ fontSize: 24, marginBottom: 8 }}>{item.product_name} <span style={{ opacity: 0.5, fontSize: 18 }}>×{item.quantity}</span></h2>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, opacity: 0.8, fontSize: 14, lineHeight: 1.6 }}>
                            {item.selections.map((s, i) => (
                                <li key={i}><strong>{s.variant_name}:</strong> {s.option_name}</li>
                            ))}
                        </ul>
                        {item.special_instructions && (
                            <p style={{ marginTop: 8, fontSize: 13, fontStyle: 'italic', background: 'var(--bg)', padding: 12 }}>"{item.special_instructions}"</p>
                        )}
                    </div>
                ))}
            </div>
            <button className="btn-secondary" style={{ width: '100%', marginTop: 24 }} onClick={() => setSelectedHistoryOrder(null)}>Close Receipt</button>
          </div>
        </div>
      )}

      {/* Customization Modal */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => { setSelectedProduct(null); setQuantity(1); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3>Customize</h3>
              <button onClick={() => { setSelectedProduct(null); setQuantity(1); }} style={{ background: 'none', border: 'none', fontSize: 20 }}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 32 }}>
                <div style={{ width: 80, height: 80, background: 'var(--cream)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, overflow: 'hidden' }}>
                    {selectedProduct.image_url ? (
                        <img src={formatImageUrl(selectedProduct.image_url)} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        Icons[selectedProduct.icon] ? Icons[selectedProduct.icon]() : selectedProduct.icon
                    )}
                </div>
                <div>
                   <h2 style={{ fontSize: 32, marginBottom: 4 }}>{selectedProduct.name}</h2>
                   <div style={{ fontSize: 13, opacity: 0.6 }}>{selectedProduct.description}</div>
                </div>
            </div>
            
            {selectedProduct.variants.map(v => (
              <div key={v.id} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-mute)' }}>{v.name}</span>
                  {v.type === 'slider' && <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono', color: '#0F9B4B', fontWeight: 600 }}>{selections[v.name] || '50%'}</span>}
                </div>

                {v.type === 'slider' ? (
                  <div style={{ padding: '8px 0 32px' }}>
                    <div style={{ position: 'relative', marginBottom: 16 }}>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="1"
                        value={parseInt(selections[v.name] || '50')}
                        onChange={(e) => setSelections({ ...selections, [v.name]: `${e.target.value}%` })}
                        className="custom-range"
                        style={{
                          width: '100%',
                          appearance: 'none',
                          height: '8px',
                          background: `linear-gradient(to right, #0F9B4B ${selections[v.name] || '50%'}, var(--line-soft) ${selections[v.name] || '50%'})`,
                          borderRadius: '10px',
                          outline: 'none',
                          cursor: 'pointer',
                          marginBottom: '20px'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
                        {[0, 25, 50, 75, 100].map(val => (
                          <button
                            key={val}
                            onClick={() => setSelections({ ...selections, [v.name]: `${val}%` })}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              padding: '4px 0',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 8,
                              width: 40
                            }}
                          >
                            <div style={{ 
                              width: 6, height: 6, borderRadius: '50%', 
                              background: parseInt(selections[v.name]) >= val ? '#0F9B4B' : 'var(--line)',
                              transition: 'all 0.3s ease'
                            }}></div>
                            <span style={{ 
                              fontSize: 10, 
                              fontWeight: parseInt(selections[v.name]) === val ? '700' : '400',
                              color: parseInt(selections[v.name]) === val ? 'var(--ink)' : 'var(--ink-mute)',
                              transition: 'all 0.3s ease'
                            }}>{val}%</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <style>{`
                      .custom-range::-webkit-slider-thumb {
                        appearance: none;
                        width: 24px;
                        height: 24px;
                        background: white;
                        border: 3px solid #0F9B4B;
                        border-radius: 50%;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(15, 155, 75, 0.3);
                        transition: transform 0.1s ease, box-shadow 0.2s ease;
                      }
                      .custom-range::-webkit-slider-thumb:hover {
                        transform: scale(1.1);
                        box-shadow: 0 6px 15px rgba(15, 155, 75, 0.4);
                      }
                      .custom-range::-webkit-slider-thumb:active {
                        transform: scale(1.2);
                      }
                    `}</style>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {v.options.map(opt => (
                      <button 
                        key={opt.id}
                        className={`btn-secondary ${selections[v.name] === opt.name || (!selections[v.name] && opt.is_default) ? 'active' : ''}`}
                        style={{ 
                          padding: '8px 16px', fontSize: 12, 
                          background: (selections[v.name] === opt.name || (!selections[v.name] && opt.is_default)) ? 'var(--ink)' : 'transparent',
                          color: (selections[v.name] === opt.name || (!selections[v.name] && opt.is_default)) ? 'var(--cream)' : 'var(--ink)'
                        }}
                        onClick={() => setSelections({...selections, [v.name]: opt.name})}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div style={{ marginBottom: 24 }}>
              <label className="field-label">Quantity</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  background: 'var(--line-soft)', 
                  padding: '4px', 
                  borderRadius: 12,
                  border: '1px solid var(--line)'
                }}>
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 'bold' }}
                  >−</button>
                  <div style={{ width: 48, textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>{quantity}</div>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 'bold' }}
                  >+</button>
                </div>
                <div style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic' }}>
                  Select how many items to order
                </div>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Special instructions</label>
              <textarea 
                style={{ width: '100%', padding: 12, height: 80, border: '1px solid var(--line)', background: 'var(--bg)' }}
                placeholder="Extra hot, easy on the foam, etc."
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
              />
            </div>

            <button className="btn-primary" style={{ width: '100%', marginTop: 20 }} onClick={handlePlaceOrder}>
                {editingOrderId ? 'Update Order' : 'Place Order'}
            </button>
          </div>
        </div>
      )}

    <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
    </div>
  );
};

export default EmployeePortal;
