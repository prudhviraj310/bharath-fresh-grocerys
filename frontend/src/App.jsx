import React, { useState, useEffect } from 'react';

export default function App() {
  const [view, setView] = useState('login'); // Forms: 'login', 'register' | Core: 'shop', 'cart'
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  // Handle Dynamic API Routing Logic for Local Dev vs Auto Scaling ALB Endpoints
  const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

  useEffect(() => {
    fetch(`${API_BASE}/products`)
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));

    if (token) loadCart();
  }, [token]);

  const loadCart = () => {
    fetch(`${API_BASE}/cart`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setCart(Array.isArray(data) ? data : []))
      .catch(() => setCart([]));
  };

  const handleAuth = (e, type) => {
    e.preventDefault();
    const endpoint = type === 'login' ? '/auth/login' : '/auth/register';
    fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setView('shop');
      } else if (data.success) {
        alert('Registration complete. Verification identity login now.');
        setView('login');
      } else { alert(data.error); }
    });
  };

  const addToCart = (productId) => {
    if (!token) { alert('Authentication token missing. Login required.'); return; }
    fetch(`${API_BASE}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ product_id: productId, quantity: 1 })
    })
    .then(res => res.json())
    .then(() => { loadCart(); alert('Stock registered to secure user cart session.'); });
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken('');
    setUser(null);
    setCart([]);
    setView('login');
  };

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      
      {/* 1. PROFESSIONAL TOP NAVBAR */}
      <nav className="bg-emerald-600 text-white shadow-lg sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => token && setView('shop')}>
          <span className="text-2xl">🌿</span>
          <span className="text-2xl font-black tracking-tight">BHARAT FRESH</span>
        </div>
        
        {token && (
          <div className="flex items-center space-x-6 font-semibold">
            <button onClick={() => setView('shop')} className={`hover:text-emerald-200 transition ${view==='shop'?'underline font-bold':''}`}>Marketplace</button>
            <button onClick={() => setView('cart')} className={`hover:text-emerald-200 transition flex items-center space-x-2 ${view==='cart'?'underline font-bold':''}`}>
              <span>🛒 Cart</span>
              <span className="bg-white text-emerald-700 rounded-full px-2 py-0.5 text-xs font-black">{cart.length}</span>
            </button>
            <div className="border-l border-emerald-500 h-6"></div>
            <span className="text-emerald-100 font-medium">Welcome, {user?.name}</span>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm transition shadow-md">Logout</button>
          </div>
        )}
      </nav>

      {/* CORE WRAPPER CONTAINER GRID SYSTEM */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* 2. CATEGORY SELECTION SIDEBAR (Only rendered when viewing the market store) */}
        {token && view === 'shop' && (
          <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Product Inventory Categories</h3>
            {['All', 'Vegetables', 'Dairy', 'Nuts', 'Fruits'].map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition ${selectedCategory === cat ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                {cat}
              </button>
            ))}
          </aside>
        )}

        {/* 3. DYNAMIC WORKING LAYER PRESENTATION MATRIX */}
        <main className="flex-1 p-8">
          
          {/* AUTHENTICATION VIEW BLOCKS */}
          {(view === 'login' || view === 'register') && (
            <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100 mt-16">
              <h2 className="text-2xl font-extrabold mb-6 text-center text-slate-900">{view === 'login' ? 'Secure Member Portal' : 'Create Cloud Account'}</h2>
              <form onSubmit={(e) => handleAuth(e, view)} className="space-y-4">
                {view === 'register' && (
                  <input type="text" placeholder="Full Professional Name" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50 outline-none" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
                )}
                <input type="email" placeholder="Corporate Account Email" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50 outline-none" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
                <input type="password" placeholder="Access Security Passcode" className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50 outline-none" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
                <button type="submit" className="w-full bg-emerald-600 text-white p-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-md">{view === 'login' ? 'Authenticate Session' : 'Register Core Instance'}</button>
              </form>
              <div className="mt-6 text-center text-sm">
                <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="text-emerald-600 hover:underline font-semibold">
                  {view === 'login' ? "New operative? Create an identity map." : "Existing credential profile? Log in here."}
                </button>
              </div>
            </div>
          )}

          {/* SHOP MARKETPLACE INVENTORY GRID */}
          {view === 'shop' && token && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{selectedCategory} Provisions</h2>
                <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{filteredProducts.length} Items Available</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-xl transition flex flex-col justify-between">
                    <div className="h-40 rounded-xl mb-4 overflow-hidden bg-slate-50 flex items-center justify-center">
                      <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-cover" onError={(e)=>{e.target.style.display='none'; e.target.nextSibling.style.display='block'}} />
                      <div className="hidden font-bold text-slate-300 text-sm uppercase">Stock Image Layer Error</div>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-lg text-slate-900 mb-1">{product.name}</h4>
                      <p className="text-xs bg-slate-100 text-slate-500 inline-block px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider mb-4">{product.category}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-2xl font-black text-slate-900">${product.price}</span>
                      <button onClick={() => addToCart(product.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition shadow-md">Add to Order</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SHOPPING CART OVERVIEW PANEL */}
          {view === 'cart' && token && (
            <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">Active Cart Reservation Manifest</h2>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <span className="text-5xl block mb-4">🛒</span>
                  <p className="text-lg font-semibold">Your allocation queue is completely empty.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center space-x-4">
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-lg bg-white" />
                        <div>
                          <h4 className="font-bold text-slate-900">{item.name}</h4>
                          <span className="text-sm text-slate-400 font-medium">${item.price} each</span>
                        </div>
                      </div>
                      <span className="font-black text-lg text-slate-800">Qty: {item.quantity}</span>
                    </div>
                  ))}
                  <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-xl font-bold text-slate-700">Estimated Project Total:</span>
                    <span className="text-3xl font-black text-emerald-600">${cart.reduce((acc, c)=> acc + (c.price * c.quantity), 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}