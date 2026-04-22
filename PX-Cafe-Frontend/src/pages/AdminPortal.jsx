import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPortal = ({ user }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'coffee', description: '', icon: 'espresso', image_url: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newVariant, setNewVariant] = useState({ productId: '', name: '', options: '', type: 'choice' });
  const [newCat, setNewCat] = useState({ name: '', icon: '🥤' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingItem, setEditingItem] = useState(null); // { id, type: 'variant'|'option', name }
  const [newOptionNames, setNewOptionNames] = useState({}); // { variantId: name }
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
  }, []);

  const fetchProducts = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`);
    const data = await res.json();
    setProducts(data.sort((a, b) => a.display_order - b.display_order));
    if (selectedProduct) {
        const updated = data.find(p => p.id === selectedProduct.id);
        setSelectedProduct(updated);
    }
  };

  const fetchCategories = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/categories`);
    const data = await res.json();
    setCategories(data);
    if (data.length > 0 && !newProduct.category) {
        setNewProduct(prev => ({ ...prev, category: data[0].name }));
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    let imageUrl = '';

    if (selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', selectedFile);
        try {
            const upRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/upload`, {
                method: 'POST',
                body: formData
            });
            const upData = await upRes.json();
            imageUrl = upData.imageUrl;
        } catch (err) {
            console.error('Upload failed', err);
        }
        setIsUploading(false);
    }

    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newProduct, image_url: imageUrl })
    });
    if (res.ok) {
      setNewProduct(prev => ({ ...prev, name: '', description: '', image_url: '' }));
      setSelectedFile(null);
      fetchProducts();
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCat)
    });
    if (res.ok) {
      setNewCat({ name: '', icon: '🥤' });
      fetchCategories();
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Delete this category?')) {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/categories/${id}`, { method: 'DELETE' });
        fetchCategories();
    }
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    const targetId = selectedProduct?.id || newVariant.productId;
    if (!targetId) return;

    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/${targetId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newVariant.name,
        type: newVariant.type,
        options: newVariant.type === 'slider' ? [] : newVariant.options.split(',').map(o => o.trim())
      })
    });
    if (res.ok) {
      setNewVariant({ productId: '', name: '', options: '', type: 'choice' });
      fetchProducts();
    }
  };

  const handleUpdateItem = async () => {
    const endpoint = editingItem.type === 'variant' ? `variants/${editingItem.id}` : `options/${editingItem.id}`;
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingItem.name })
    });
    if (res.ok) {
        setEditingItem(null);
        fetchProducts();
    }
  };

  const handleAddOption = async (variantId) => {
    const name = newOptionNames[variantId];
    if (!name) return;

    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/variants/${variantId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    if (res.ok) {
        setNewOptionNames({ ...newOptionNames, [variantId]: '' });
        fetchProducts();
    }
  };

  const handleDragStart = (e, product) => {
    setDraggedItem(product);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetProduct) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetProduct.id || draggedItem.category !== targetProduct.category) return;

    const categoryProducts = products.filter(p => p.category === draggedItem.category);
    const otherProducts = products.filter(p => p.category !== draggedItem.category);
    
    const dragIdx = categoryProducts.findIndex(p => p.id === draggedItem.id);
    const dropIdx = categoryProducts.findIndex(p => p.id === targetProduct.id);
    
    const newCatProducts = [...categoryProducts];
    newCatProducts.splice(dragIdx, 1);
    newCatProducts.splice(dropIdx, 0, draggedItem);
    
    const updatedProducts = [...otherProducts, ...newCatProducts.map((p, i) => ({...p, display_order: i}))];
    setProducts(updatedProducts);
    setHasChanges(true);
    setDraggedItem(null);
  };

  const handleCategoryDragStart = (e, category) => {
    if (category.name === 'all') return;
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDrop = (e, targetCategory) => {
    e.preventDefault();
    if (!draggedCategory || draggedCategory.id === targetCategory.id || targetCategory.name === 'all') return;

    const otherCats = categories.filter(c => c.id !== draggedCategory.id);
    const dragIdx = categories.findIndex(c => c.id === draggedCategory.id);
    const dropIdx = categories.findIndex(c => c.id === targetCategory.id);

    const newCats = [...categories];
    newCats.splice(dragIdx, 1);
    newCats.splice(dropIdx, 0, draggedCategory);

    setCategories(newCats.map((c, i) => ({...c, display_order: i})));
    setHasChanges(true);
    setDraggedCategory(null);
  };

  const handleSaveOrder = async () => {
    setLoading(true);
    try {
        const productOrders = products.map((p, i) => ({ id: p.id, order: i }));
        const categoryOrders = categories.map((c, i) => ({ id: c.id, order: i }));

        const [resProd, resCat] = await Promise.all([
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/reorder`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders: productOrders })
            }),
            fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/categories/reorder`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orders: categoryOrders })
            })
        ]);

        if (resProd.ok && resCat.ok) {
            setHasChanges(false);
            setToast('Menu order saved');
            setTimeout(() => setToast(null), 3000);
            fetchProducts();
            fetchCategories();
        } else {
            setToast('Failed to save some changes');
            setTimeout(() => setToast(null), 3000);
        }
    } catch (err) {
        console.error('Save failed', err);
        setToast('Connection error');
        setTimeout(() => setToast(null), 3000);
    }
    setLoading(false);
  };

  const handleDeleteItem = async (id, type) => {
    if (type === 'variant' && !window.confirm(`Are you sure you want to delete the entire variant group?`)) return;
    
    try {
        const endpoint = type === 'variant' ? `variants/${id}` : `options/${id}`;
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/${endpoint}`, { method: 'DELETE' });
        if (res.ok) {
            // Force a fresh fetch and ensure state updates
            const freshRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`);
            const data = await freshRes.json();
            setProducts([...data]);
            if (selectedProduct) {
                const updated = data.find(p => p.id === selectedProduct.id);
                setSelectedProduct(updated ? { ...updated } : null);
            }
        }
    } catch (err) {
        console.error('Delete failed:', err);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Delete this product?')) {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) {
          alert(data.error || 'Failed to delete product');
      } else {
          if (selectedProduct?.id === id) setSelectedProduct(null);
          fetchProducts();
      }
    }
  };

  const handleUpdateImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedProduct) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
        const upRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/upload`, {
            method: 'POST',
            body: formData
        });
        const upData = await upRes.json();
        
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/${selectedProduct.id}/image`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: upData.imageUrl })
        });
        
        // Refresh products to show the newly uploaded image
        fetchProducts(); 
    } catch (err) {
        console.error('Update image failed', err);
    }
    setIsUploading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="admin-view">
      <div className="noise"></div>
      <div className="admin-header">
        <div className="brand">
          <img src="/logo.png" alt="PX Cafe Logo" style={{ height: '70px' }} />
          <h1 className="brand-name">Admin <em>Center</em></h1>
        </div>
        <button className="btn-secondary" onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-grid">
        <div className="admin-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0 }}>Menu Items</h3>
                {hasChanges && (
                    <button onClick={handleSaveOrder} style={{ padding: '6px 12px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>SAVE ORDER</button>
                )}
            </div>
            
            {categories.filter(c => c.name !== 'all').map(cat => {
                const catProducts = products.filter(p => p.category === cat.name);
                if (catProducts.length === 0) return null;
                return (
                    <div key={cat.id} style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-mute)', marginBottom: 8, textTransform: 'uppercase', paddingLeft: 12 }}>{cat.name}</div>
                        <div className="product-list">
                            {catProducts.map(p => (
                                <div 
                                    key={p.id} 
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, p)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, p)}
                                    className={`product-list-item ${selectedProduct?.id === p.id ? 'active' : ''}`}
                                    onClick={() => setSelectedProduct(p)}
                                    style={{ 
                                        cursor: 'grab', 
                                        background: selectedProduct?.id === p.id ? 'var(--line-soft)' : 'transparent',
                                        opacity: draggedItem?.id === p.id ? 0.5 : 1,
                                        borderLeft: draggedItem?.id === p.id ? '2px solid var(--ink)' : 'none'
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '500' }}>{p.name}</div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id); }} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
          </div>

          <div>
            <h3 style={{ marginBottom: '24px' }}>Categories</h3>
            <div className="product-list">
              {categories.map(c => (
                <div 
                    key={c.id} 
                    draggable={c.name !== 'all'}
                    onDragStart={(e) => handleCategoryDragStart(e, c)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleCategoryDrop(e, c)}
                    className="product-list-item"
                    style={{ 
                        cursor: c.name === 'all' ? 'default' : 'grab',
                        opacity: draggedCategory?.id === c.id ? 0.5 : 1,
                        background: draggedCategory?.id === c.id ? 'var(--line-soft)' : 'transparent'
                    }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 20 }}>{c.icon}</span>
                    <div style={{ fontWeight: '500' }}>{c.name}</div>
                  </div>
                  {c.name !== 'all' && (
                    <button onClick={() => handleDeleteCategory(c.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-main">
          {selectedProduct ? (
            <div className="product-editor" style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, background: 'var(--line-soft)', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {selectedProduct.image_url ? (
                                <img src={formatImageUrl(selectedProduct.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span style={{ fontSize: 20 }}>{selectedProduct.icon}</span>
                            )}
                        </div>
                        <h2>Managing: {selectedProduct.name}</h2>
                    </div>
                    <button className="btn-secondary" onClick={() => setSelectedProduct(null)}>Close Product</button>
                </div>
                
                <div style={{ marginBottom: 40, padding: 24, border: '1px dashed var(--line)', background: 'var(--bg)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ marginBottom: 4 }}>Product Image</h3>
                            <p style={{ opacity: 0.6, fontSize: 13, margin: 0 }}>Update the main image displayed to employees.</p>
                        </div>
                        <div>
                            <input 
                                type="file" 
                                id="update-image" 
                                accept="image/*" 
                                onChange={handleUpdateImage} 
                                style={{ display: 'none' }} 
                            />
                            <label htmlFor="update-image" className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                                {isUploading ? 'Uploading...' : 'Replace Image'}
                            </label>
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: 40, padding: 24, border: '1px solid var(--line)', background: 'var(--cream)' }}>
                    <h3 style={{ marginBottom: 16 }}>Existing Variants</h3>
                    {selectedProduct.variants.length === 0 ? (
                        <p style={{ opacity: 0.5, fontStyle: 'italic' }}>No variants added yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {selectedProduct.variants.map(v => (
                                <div key={v.id} style={{ borderBottom: '1px solid var(--line-soft)', paddingBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                        {editingItem?.id === v.id && editingItem.type === 'variant' ? (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                                                <button onClick={handleUpdateItem} className="btn-primary" style={{ padding: '4px 12px' }}>Save</button>
                                                <button onClick={() => setEditingItem(null)} className="btn-secondary" style={{ padding: '4px 12px' }}>✕</button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <span style={{ fontWeight: 600 }}>{v.name}</span>
                                                <span style={{ fontSize: 10, background: 'var(--line-soft)', padding: '2px 6px', borderRadius: 100, color: 'var(--ink-mute)' }}>{v.type?.toUpperCase() || 'CHOICE'}</span>
                                                <button onClick={() => setEditingItem({ id: v.id, type: 'variant', name: v.name })} style={{ fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}>EDIT</button>
                                                <button onClick={() => handleDeleteItem(v.id, 'variant')} style={{ fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)' }}>DELETE</button>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {v.options.map(opt => (
                                            <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg)', padding: '4px 10px', borderRadius: 4, fontSize: 13 }}>
                                                {editingItem?.id === opt.id && editingItem.type === 'option' ? (
                                                    <>
                                                        <input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} style={{ width: 80, fontSize: 12 }} />
                                                        <button onClick={handleUpdateItem} style={{ border: 'none', background: 'none', color: 'var(--green)' }}>✓</button>
                                                        <button onClick={() => setEditingItem(null)} style={{ border: 'none', background: 'none', color: 'var(--red)' }}>✕</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{opt.name}</span>
                                                        <button 
                                                            onClick={() => setEditingItem({ id: opt.id, type: 'option', name: opt.name })} 
                                                            style={{ border: 'none', background: 'none', opacity: 0.5, cursor: 'pointer', fontSize: 14 }}
                                                            title="Edit option"
                                                        >✎</button>
                                                        <button 
                                                            onClick={() => handleDeleteItem(opt.id, 'option')} 
                                                            style={{ border: 'none', background: 'none', color: 'var(--red)', opacity: 0.7, cursor: 'pointer', fontSize: 14 }}
                                                            title="Delete option"
                                                        >✕</button>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        
                                        {/* Add Option Input */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--line-soft)', padding: '2px 8px', borderRadius: 4 }}>
                                            <input 
                                                placeholder="New option..." 
                                                value={newOptionNames[v.id] || ''} 
                                                onChange={e => setNewOptionNames({...newOptionNames, [v.id]: e.target.value})}
                                                style={{ border: 'none', background: 'none', fontSize: 12, width: 80 }}
                                                onKeyDown={e => e.key === 'Enter' && handleAddOption(v.id)}
                                            />
                                            <button 
                                                onClick={() => handleAddOption(v.id)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                            >+</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ paddingTop: 24, borderTop: '1px solid var(--line)' }}>
                    <h3>Add New Variant</h3>
                    <form onSubmit={handleAddVariant} style={{ marginTop: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                            <div className="field-group">
                                <label className="field-label">Variant Name</label>
                                <input 
                                    type="text" required value={newVariant.name}
                                    onChange={e => setNewVariant({...newVariant, name: e.target.value})}
                                    placeholder="e.g. Size" 
                                />
                            </div>
                            <div className="field-group">
                                <label className="field-label">Type</label>
                                <select 
                                    value={newVariant.type} 
                                    onChange={e => setNewVariant({...newVariant, type: e.target.value})}
                                    style={{ width: '100%', padding: '14px', border: '1px solid var(--line)', background: 'var(--bg)' }}
                                >
                                    <option value="choice">Multiple Choice</option>
                                    <option value="slider">Percentage Slider</option>
                                </select>
                            </div>
                            <div className="field-group">
                                <label className="field-label">Options (Comma separated)</label>
                                <input 
                                    type="text" required={newVariant.type !== 'slider'} value={newVariant.options}
                                    onChange={e => setNewVariant({...newVariant, options: e.target.value})}
                                    placeholder={newVariant.type === 'slider' ? 'Not needed for slider' : 'Small, Medium, Large'} 
                                    disabled={newVariant.type === 'slider'}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary">Add Variant</button>
                    </form>
                </div>
            </div>
          ) : (
            <>
              {/* Add Category Section */}
              <div style={{ marginBottom: '60px', paddingBottom: '40px', borderBottom: '1px solid var(--line-soft)' }}>
                <h2>Create New Category</h2>
                <form onSubmit={handleCreateCategory} style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '16px', alignItems: 'end' }}>
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <label className="field-label">Category Name</label>
                    <input 
                      type="text" required value={newCat.name}
                      onChange={e => setNewCat({...newCat, name: e.target.value.toLowerCase()})}
                      placeholder="e.g. snacks" 
                    />
                  </div>
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <label className="field-label">Icon (Emoji)</label>
                    <input 
                      type="text" value={newCat.icon}
                      onChange={e => setNewCat({...newCat, icon: e.target.value})}
                      placeholder="🥪" style={{ width: '60px', textAlign: 'center' }}
                    />
                  </div>
                  <button type="submit" className="btn-primary">Add</button>
                </form>
              </div>

              <div style={{ marginBottom: '60px' }}>
                <h2>Add New Product</h2>
                <form onSubmit={handleCreateProduct} style={{ marginTop: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="field-group">
                      <label className="field-label">Name</label>
                      <input 
                        type="text" required value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        placeholder="e.g. Mocha" style={{ width: '100%' }}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Category</label>
                      <select 
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        style={{ width: '100%' }}
                      >
                        {categories.map(c => (
                            <option key={c.id} value={c.name}>{c.name.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Description</label>
                    <input 
                      type="text" value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                      placeholder="Short description" style={{ width: '100%' }}
                    />
                  </div>
                  <div className="field-group" style={{ marginBottom: 24 }}>
                    <label className="field-label">Product Image (Optional)</label>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => setSelectedFile(e.target.files[0])}
                          style={{ fontSize: 13 }}
                        />
                        {selectedFile && (
                            <div style={{ fontSize: 11, color: 'var(--green)' }}>✓ {selectedFile.name}</div>
                        )}
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isUploading}>
                    {isUploading ? 'Uploading Image...' : 'Create Product'}
                  </button>
                </form>
              </div>
              
              <div style={{ opacity: 0.5, textAlign: 'center', padding: 40, border: '2px dashed var(--line)' }}>
                Select a product from the sidebar to manage its variants and options.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
