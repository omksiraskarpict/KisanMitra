import { useEffect, useState } from 'react';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Leaf,
  LogOut,
  Menu,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Sprout,
  Store,
  Tractor,
  Truck,
  User,
  Wallet,
  X
} from 'lucide-react';
import api from './api';
import { startRazorpayPayment } from './services/paymentService';
import RetailerDashboardPage from './retailer/pages/RetailerDashboardPage';
import RetailerProfilePage from './retailer/pages/RetailerProfilePage';
import RetailerProductsPage from './retailer/pages/RetailerProductsPage';
import RetailerProductFormPage from './retailer/pages/RetailerProductFormPage';
import RetailerOrdersPage, { RetailerOrderDetailsPage } from './retailer/pages/RetailerOrdersPage';
import {
  AdminAccountPage,
  AdminInventoryPage,
  AdminOrderDetailsPage,
  AdminOrdersPage,
  AdminPageLayout,
  AdminProductsPage,
  AdminUsersPage
} from './admin/pages/AdminManagementPages';

/* ---------------- Auth & Storage Helpers ---------------- */
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('kisanmitra_user') || 'null');
  } catch {
    return null;
  }
};

const getStoredToken = () => localStorage.getItem('kisanmitra_token');

const setStoredAuth = (user, token) => {
  localStorage.setItem('kisanmitra_user', JSON.stringify(user));
  localStorage.setItem('kisanmitra_token', token);
};

const clearStoredAuth = () => {
  localStorage.removeItem('kisanmitra_user');
  localStorage.removeItem('kisanmitra_token');
};

function ProtectedRoute({ children, allowedRoles = [] }) {
  const user = getStoredUser();
  if (!user || !getStoredToken()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/* ---------------- Enhanced App Shell ---------------- */
function AppShell({ children }) {
  const user = getStoredUser();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user?.role === 'farmer') {
      api.get('/cart')
        .then(({ data }) => {
          const totalQty = (data?.cart?.items || []).reduce((acc, curr) => acc + (curr.quantity || 1), 0);
          setCartCount(totalQty);
        })
        .catch(() => setCartCount(0));
    }
  }, [user?.role]);

  const handleLogout = () => {
    clearStoredAuth();
    navigate('/login');
  };

  const navClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <Link to="/" className="brand-logo-link">
            <div className="brand-badge glow"><Sprout size={20} /></div>
            <div>
              <div className="brand-name">KisanMitra</div>
              <div className="brand-tag">Smart Agriculture Ecosystem</div>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="topnav desktop-nav">
          <NavLink to="/" className={navClass}>Home</NavLink>
          {user?.role === 'farmer' && (
            <>
              <NavLink to="/farmer/dashboard" className={navClass}><Tractor size={15} /> Dashboard</NavLink>
              <NavLink to="/farmer/crop" className={navClass}><Leaf size={15} /> Crop Care</NavLink>
              <NavLink to="/farmer/products" className={navClass}><Store size={15} /> Catalogue</NavLink>
              <NavLink to="/farmer/recommendations" className={navClass}><Sparkles size={15} /> AI Advice</NavLink>
              <NavLink to="/orders" className={navClass}><PackageCheck size={15} /> My Orders</NavLink>
            </>
          )}
          {user?.role === 'retailer' && (
            <>
              <NavLink to="/retailer/dashboard" className={navClass}>Dashboard</NavLink>
              <NavLink to="/retailer/products" className={navClass}>Products</NavLink>
              <NavLink to="/retailer/products/new" className={navClass}>+ Add Product</NavLink>
              <NavLink to="/retailer/orders" className={navClass}>Orders</NavLink>
            </>
          )}
          {user?.role === 'delivery' && (
            <NavLink to="/delivery/dashboard" className={navClass}><Truck size={15} /> Deliveries</NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin/dashboard" className={navClass}><ShieldCheck size={15} /> Admin</NavLink>
          )}
        </nav>

        {/* Actions */}
        <div className="user-actions">
          {user?.role === 'farmer' && (
            <Link to="/cart" className="action-badge-btn" title="View Cart">
              <ShoppingCart size={19} />
              {cartCount > 0 && <span className="counter-pill">{cartCount}</span>}
            </Link>
          )}

          {user && (
            <div className="relative-wrap">
              <button
                className="action-badge-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
                type="button"
              >
                <Bell size={19} />
                <span className="dot-indicator" />
              </button>

              {showNotifications && (
                <div className="dropdown-panel notification-drawer">
                  <h4>Recent Alerts</h4>
                  <p className="notification-empty">No new notifications.</p>
                </div>
              )}
            </div>
          )}

          {!user ? (
            <div className="guest-actions">
              <Link className="btn btn-secondary btn-small" to="/login">Sign In</Link>
              <Link className="btn btn-primary btn-small" to="/register">Register</Link>
            </div>
          ) : (
            <div className="profile-pill">
              <span className="user-badge"><User size={14} /> {user.name}</span>
              <button className="btn btn-secondary btn-icon-only" onClick={handleLogout} title="Log Out" type="button">
                <LogOut size={16} />
              </button>
            </div>
          )}

          <button
            className="mobile-toggle btn-icon-only"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            type="button"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-drawer" onClick={() => setMobileMenuOpen(false)}>
          <div
            id="mobile-navigation"
            className="drawer-content"
            onClick={(e) => {
              e.stopPropagation();
              if (e.target.closest('a')) setMobileMenuOpen(false);
            }}
          >
            <NavLink to="/" className={navClass}>Home</NavLink>
            {!user && (
              <>
                <NavLink to="/delivery/login" className={navClass}>Delivery Login</NavLink>
                <NavLink to="/delivery/register" className={navClass}>Delivery Partner Register</NavLink>
              </>
            )}
            {user?.role === 'farmer' && (
              <>
                <NavLink to="/farmer/dashboard" className={navClass}>Dashboard</NavLink>
                <NavLink to="/farmer/crop" className={navClass}>Crop Care</NavLink>
                <NavLink to="/farmer/products" className={navClass}>Products</NavLink>
                <NavLink to="/farmer/recommendations" className={navClass}>AI Guidance</NavLink>
                <NavLink to="/cart" className={navClass}>Cart ({cartCount})</NavLink>
                <NavLink to="/orders" className={navClass}>My Orders</NavLink>
              </>
            )}
            {user?.role === 'retailer' && (
              <>
                <NavLink to="/retailer/dashboard" className={navClass}>Dashboard</NavLink>
                <NavLink to="/retailer/products" className={navClass}>Products</NavLink>
                <NavLink to="/retailer/orders" className={navClass}>Orders</NavLink>
              </>
            )}
            {user?.role === 'admin' && (
              <NavLink to="/admin/dashboard" className={navClass}>Admin Control</NavLink>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

function StatCard({ label, value, trend, tone = 'green' }) {
  return (
    <div className={`stat-card tone-${tone} stat-glass`}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {trend && <span className="stat-trend">{trend}</span>}
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function HomePage() {
  const user = getStoredUser();
  return (
    <main className="page-shell home-page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow glow-pill">🌱 Smart Agriculture & Commerce Platform</span>
          <h1>Empowering Farmers With Intelligence & Direct Access</h1>
          <p>
            Bridging crop health diagnostics, verified retailer inventory, swift checkout,
            and doorstep delivery tracking in a unified digital network.
          </p>
          <div className="cta-row">
            {!user ? (
              <>
                <Link className="btn btn-primary" to="/login">Farmer Portal</Link>
                <Link className="btn btn-secondary" to="/retailer/login">Retailer Hub</Link>
              </>
            ) : (
              <Link
                className="btn btn-primary"
                to={
                  user.role === 'farmer'
                    ? '/farmer/dashboard'
                    : user.role === 'retailer'
                    ? '/retailer/dashboard'
                    : user.role === 'delivery'
                    ? '/delivery/dashboard'
                    : '/admin/dashboard'
                }
              >
                Launch Dashboard <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
        <div className="hero-panel">
          <div className="mini-card pulse"><Sprout size={20} /> AI Crop Intelligence</div>
          <div className="mini-card"><Wallet size={20} /> Secure Escrow Payments</div>
          <div className="mini-card"><Truck size={20} /> Real-Time GPS Tracking</div>
        </div>
      </section>

      <section className="role-grid">
        <RoleCard title="Farmer" description="Discover crop solutions, order inputs, and inspect customized harvest recommendations." route="/login" icon={<Tractor size={28} />} />
        <RoleCard title="Retailer" description="List agro-chemicals, seeds, and equipment with streamlined fulfillment pipelines." route="/retailer/login" icon={<Store size={28} />} />
        <RoleCard title="Delivery Partner" description="Pick up verified parcels and fulfill door-to-door farm dispatches." route="/delivery/register" icon={<Truck size={28} />} />
        <RoleCard title="Admin" description="Supervise network participants, review verifications, and audit transaction volumes." route="/admin/login" icon={<ShieldCheck size={28} />} />
      </section>
    </main>
  );
}

function RoleCard({ title, description, route, icon }) {
  return (
    <Link className="role-card" to={route}>
      <div className="role-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="role-link">Enter Portal <ArrowRight size={16} /></span>
    </Link>
  );
}

/* ---------------- Farmer Authentication ---------------- */
function FarmerLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user && user.role === 'farmer') navigate('/farmer/dashboard');
  }, [navigate]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { ...form, role: 'farmer' });
      setStoredAuth(data.user, data.token);
      navigate('/farmer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-badge glow"><Sprout size={18} /></div>
          <h2>Farmer Login</h2>
          <p>Welcome back to KisanMitra</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email or Mobile
            <input type="text" name="email" value={form.email} onChange={handleChange} placeholder="farmer@example.com" required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
          </label>
          {error && <div className="feedback error">{error}</div>}
          <div className="auth-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
            <Link className="btn btn-secondary" to="/register">Create account</Link>
          </div>
        </form>
      </div>
    </main>
  );
}

function FarmerRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', password: '', confirmPassword: '',
    homeAddress: '', farmAddress: '', city: '', state: '', pincode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', { ...form, role: 'farmer' });
      setStoredAuth(data.user, data.token);
      navigate('/farmer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell auth-shell">
      <div className="auth-card" style={{ maxWidth: 720 }}>
        <div className="auth-header">
          <div className="brand-badge glow"><Sprout size={18} /></div>
          <h2>Farmer Registration</h2>
          <p>Create your account to start receiving intelligent crop assistance</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="info-grid">
            <label>Full name<input type="text" name="name" value={form.name} onChange={handleChange} required /></label>
            <label>Mobile<input type="tel" name="mobile" value={form.mobile} onChange={handleChange} required /></label>
            <label>Email<input type="email" name="email" value={form.email} onChange={handleChange} required /></label>
            <label>City<input type="text" name="city" value={form.city} onChange={handleChange} /></label>
            <label>State<input type="text" name="state" value={form.state} onChange={handleChange} /></label>
            <label>Pincode<input type="text" name="pincode" value={form.pincode} onChange={handleChange} /></label>
          </div>
          <label>Home address<input type="text" name="homeAddress" value={form.homeAddress} onChange={handleChange} required /></label>
          <label>Farm address<input type="text" name="farmAddress" value={form.farmAddress} onChange={handleChange} required /></label>
          <div className="info-grid">
            <label>Password<input type="password" name="password" value={form.password} onChange={handleChange} required /></label>
            <label>Confirm password<input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required /></label>
          </div>
          {error && <div className="feedback error">{error}</div>}
          <div className="auth-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
            <Link className="btn btn-secondary" to="/login">Already registered?</Link>
          </div>
        </form>
      </div>
    </main>
  );
}

function RoleAuthPage({ role, label }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      if (user.role === 'farmer') navigate('/farmer/dashboard');
      if (user.role === 'retailer') navigate('/retailer/dashboard');
      if (user.role === 'delivery') navigate('/delivery/dashboard');
      if (user.role === 'admin') navigate('/admin/dashboard');
    }
  }, [navigate]);

  const onInputChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = role === 'retailer' ? '/auth/retailer/login' : '/auth/login';
      const { data } = await api.post(endpoint, { ...form, role });
      setStoredAuth(data.user, data.token);
      if (data.user.role === 'farmer') navigate('/farmer/dashboard');
      if (data.user.role === 'retailer') navigate('/retailer/dashboard');
      if (data.user.role === 'delivery') navigate('/delivery/dashboard');
      if (data.user.role === 'admin') navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-badge glow"><Sprout size={18} /></div>
          <h2>{label}</h2>
          <p>Secure Portal Authentication</p>
        </div>
        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Email or Mobile
            <input type="text" name="email" value={form.email} onChange={onInputChange} placeholder="username@kisanmitra.com" required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={onInputChange} placeholder="••••••••" required />
          </label>
          {error && <div className="feedback error">{error}</div>}
          <div className="auth-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
            {role === 'delivery' && (
              <Link className="btn btn-secondary" to="/delivery/register">Create Delivery Partner Account</Link>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

function DeliveryRegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    vehicleType: '',
    vehicleRegistration: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const change = (event) => {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    setError('');
    setNotice('');
  };

  const submit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      const { data } = await api.post('/auth/delivery/register', form);

      // Delivery partners require admin verification before they can work.
      // Do not store the pending registration token as an active login session.
      setNotice(
        data.message ||
        'Registration submitted successfully. Your account is pending admin verification.'
      );
      setForm({
        name: '',
        email: '',
        mobile: '',
        vehicleType: '',
        vehicleRegistration: '',
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to register delivery partner.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell auth-shell">
      <div className="auth-card" style={{ maxWidth: 720 }}>
        <div className="auth-header">
          <div className="brand-badge glow"><Truck size={18} /></div>
          <h2>Delivery Partner Registration</h2>
          <p>Join KisanMitra and deliver agricultural products to farmers</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="info-grid">
            <label>
              Full name
              <input type="text" name="name" value={form.name} onChange={change} required />
            </label>

            <label>
              Mobile number
              <input
                type="tel"
                name="mobile"
                value={form.mobile}
                onChange={change}
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                required
              />
            </label>

            <label>
              Email address
              <input type="email" name="email" value={form.email} onChange={change} required />
            </label>

            <label>
              Vehicle type
              <select name="vehicleType" value={form.vehicleType} onChange={change}>
                <option value="">Select vehicle type</option>
                <option value="Bike">Bike</option>
                <option value="Scooter">Scooter</option>
                <option value="Auto">Auto</option>
                <option value="Pickup Van">Pickup Van</option>
                <option value="Mini Truck">Mini Truck</option>
                <option value="Truck">Truck</option>
              </select>
            </label>

            <label>
              Vehicle registration number
              <input
                type="text"
                name="vehicleRegistration"
                value={form.vehicleRegistration}
                onChange={change}
                placeholder="MH12AB1234"
                autoComplete="off"
              />
            </label>
          </div>

          <div className="info-grid">
            <label>
              Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={change}
                minLength={8}
                required
              />
            </label>

            <label>
              Confirm password
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={change}
                minLength={8}
                required
              />
            </label>
          </div>

          <div className="feedback" role="status">
            <strong>Verification required:</strong> After registration, an admin must verify your delivery partner account before you can accept deliveries.
          </div>

          {error && <div className="feedback error" role="alert">{error}</div>}
          {notice && <div className="feedback success" role="status">{notice}</div>}

          <div className="auth-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Create Delivery Account'}
            </button>
            <Link className="btn btn-secondary" to="/delivery/login">Already registered?</Link>
            {notice && (
              <button className="btn btn-secondary" type="button" onClick={() => navigate('/delivery/login')}>
                Go to Delivery Login
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

function RetailerRegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/retailer/register', form);
      setStoredAuth(data.user, data.token);
      navigate('/retailer/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to register retailer account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-badge glow"><Store size={18} /></div>
          <h2>Retailer Registration</h2>
          <p>Join the KisanMitra input supplier network</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label>Business / Owner name<input name="name" value={form.name} onChange={change} required /></label>
          <label>Email address<input type="email" name="email" value={form.email} onChange={change} required /></label>
          <label>Mobile number<input type="tel" name="mobile" value={form.mobile} onChange={change} required /></label>
          <label>Password<input type="password" name="password" value={form.password} onChange={change} minLength={8} required /></label>
          <label>Confirm password<input type="password" name="confirmPassword" value={form.confirmPassword} onChange={change} minLength={8} required /></label>
          {error && <div className="feedback error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
      </div>
    </main>
  );
}

/* ---------------- Farmer Profile & Dashboard ---------------- */
function FarmerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', mobile: '', email: '', homeAddress: '', farmAddress: '', city: '', state: '', pincode: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/farmer/profile')
      .then(({ data }) => {
        const user = data.user;
        setProfile(user);
        setForm({
          name: user.name || '',
          mobile: user.mobile || '',
          email: user.email || '',
          homeAddress: user.homeAddress || '',
          farmAddress: user.farmAddress || '',
          city: user.city || '',
          state: user.state || '',
          pincode: user.pincode || ''
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const { data } = await api.put('/farmer/profile', form);
      setProfile(data.user);
      setStoredAuth(data.user, getStoredToken());
      setNotice('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-shell loader">Loading profile...</div>;
  if (!profile && error) return <main className="page-shell"><div className="feedback error" role="alert">{error}</div></main>;

  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Settings</span>
          <h2>Farmer Profile: {profile?.name}</h2>
        </div>
      </section>
      <form className="panel auth-form" onSubmit={handleSubmit}>
        <div className="info-grid">
          <label>Full name<input type="text" name="name" value={form.name} onChange={handleChange} /></label>
          <label>Mobile<input type="tel" name="mobile" value={form.mobile} onChange={handleChange} /></label>
          <label>Email<input type="email" name="email" value={form.email} onChange={handleChange} /></label>
          <label>City<input type="text" name="city" value={form.city} onChange={handleChange} /></label>
          <label>State<input type="text" name="state" value={form.state} onChange={handleChange} /></label>
          <label>Pincode<input type="text" name="pincode" value={form.pincode} onChange={handleChange} /></label>
        </div>
        <label>Home address<input type="text" name="homeAddress" value={form.homeAddress} onChange={handleChange} /></label>
        <label>Farm address<input type="text" name="farmAddress" value={form.farmAddress} onChange={handleChange} /></label>
        {error && <div className="feedback error">{error}</div>}
        {notice && <div className="feedback success" role="status">{notice}</div>}
        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </main>
  );
}

function FarmerDashboard() {
  const [data, setData] = useState({ user: null, selectedCrop: 'Not selected', selectedCropId: null });
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/farmer/dashboard'), api.get('/orders/my')])
      .then(([dashboardResponse, orderResponse]) => {
        setData(dashboardResponse.data);
        setOrders(orderResponse.data.orders || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load your farm dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-shell loader">Loading farm cockpit...</div>;

  const activeOrders = orders.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.orderStatus));
  const latestOrder = orders[0];

  return (
    <main className="page-shell farmer-dashboard-page">
      <section className="section-header">
        <div>
          <span className="eyebrow">Farmer Cockpit</span>
          <h2>Welcome back, {data.user?.name || 'Farmer'}</h2>
          <p className="section-description">Your crop selection, assessments, and order activity in one place.</p>
        </div>
        <div className="auth-actions">
          <Link className="btn btn-primary" to="/farmer/crop"><Leaf size={16} /> Switch Crop</Link>
          <Link className="btn btn-secondary" to="/farmer/profile"><User size={16} /> Profile</Link>
        </div>
      </section>

      {error && <div className="feedback error" role="alert">{error}</div>}

      {!error && (
        <>
          <div className="stats-grid">
            <StatCard label="Current Crop" value={data.selectedCrop} trend="Selected crop" />
            <StatCard label="Active Orders" value={activeOrders.length} trend="From your orders" tone="blue" />
            <StatCard label="Latest Order" value={latestOrder?.orderStatus || 'None yet'} trend={latestOrder?.orderNumber || 'No orders yet'} tone="amber" />
            <StatCard label="Farm Assessment" value={data.selectedCropId ? 'Available' : 'Not started'} trend={data.selectedCropId ? 'Review your answers' : 'Choose a crop to begin'} tone="green" />
          </div>

          <div className="quick-actions-bar panel">
            <Link to="/farmer/crop" className="quick-action-btn"><Leaf size={18} /><span>Crop Choice</span></Link>
            <Link to="/farmer/recommendations" className="quick-action-btn"><Sparkles size={18} /><span>AI Solutions</span></Link>
            <Link to="/farmer/products" className="quick-action-btn"><Store size={18} /><span>Agro Store</span></Link>
            <Link to="/orders" className="quick-action-btn"><Truck size={18} /><span>Deliveries</span></Link>
          </div>

          <div className="dashboard-grid-split">
            <div className="panel card-tall">
              <span className="eyebrow">Crop Assessment</span>
              <h3>{data.selectedCrop === 'Not selected' ? 'Start with your crop' : `${data.selectedCrop} assessment`}</h3>
              <p className="mt-sm">
                {data.selectedCropId
                  ? `Update your survey responses for ${data.selectedCrop} to refine custom fertilizing schedules.`
                  : 'Select your crop to trigger intelligent agrochemical recommendations.'}
              </p>
              <div className="mt-md">
                <Link
                  className="btn btn-primary"
                  to={data.selectedCropId ? `/farmer/questions/${data.selectedCropId}` : '/farmer/crop'}
                >
                  {data.selectedCropId ? 'Resume Questionnaire' : 'Select Crop'}
                </Link>
              </div>
            </div>
            <div className="panel card-tall">
              <span className="eyebrow">Recent Activity</span>
              <h3>{latestOrder ? latestOrder.orderNumber : 'No orders yet'}</h3>
              <p className="mt-sm">
                {latestOrder
                  ? `Payment: ${latestOrder.paymentStatus || 'Pending'} · Delivery: ${latestOrder.deliveryStatus || latestOrder.orderStatus}`
                  : 'Your order updates will appear here after checkout.'}
              </p>
              {latestOrder && (
                <div className="mt-md">
                  <Link className="btn btn-secondary" to={`/orders/${latestOrder.id || latestOrder._id}`}>View order</Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

/* ---------------- Crop Selection & Questionnaire ---------------- */
function CropSelectionPage() {
  const [crops, setCrops] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectingCropId, setSelectingCropId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/crops')
      .then(({ data }) => setCrops(data.crops || []))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load crops.'))
      .finally(() => setLoading(false));
  }, []);

  const visibleCrops = crops.filter((crop) => crop.name.toLowerCase().includes(search.trim().toLowerCase()));

  const selectCrop = async (crop) => {
    setSelectingCropId(crop._id);
    setError('');
    try {
      await api.post('/farmer/select-crop', { cropId: crop._id });
      navigate(`/farmer/questions/${crop._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to select this crop.');
    } finally {
      setSelectingCropId('');
    }
  };

  return (
    <main className="page-shell">
      <section className="section-header centered">
        <div>
          <span className="eyebrow">Crop Intelligence</span>
          <h2>Select Your Target Crop</h2>
          <p className="section-description">Choose a crop to unlock diagnostic guidance and fertilizer matching.</p>
        </div>
      </section>

      <label className="crop-search">
        <Search size={18} aria-hidden="true" />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search crops (Wheat, Paddy, Cotton...)" />
      </label>

      {error && <div className="feedback error">{error}</div>}
      {loading ? <div className="loader">Loading crops...</div> : visibleCrops.length === 0 ? (
        <div className="panel empty-state">No crops found matching your criteria.</div>
      ) : (
        <div className="card-grid crop-grid">
          {visibleCrops.map((crop) => (
            <article className="crop-card" key={crop._id}>
              {crop.image && <img src={crop.image} alt={crop.name} loading="lazy" />}
              <div className="crop-body">
                <div className="crop-meta"><span>{crop.category}</span>{crop.season && <span>{crop.season}</span>}</div>
                <h3>{crop.name}</h3>
                <p>{crop.description}</p>
                <button className="btn btn-primary" disabled={Boolean(selectingCropId)} onClick={() => selectCrop(crop)}>
                  {selectingCropId === crop._id ? 'Selecting...' : 'Choose Crop'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function FarmerQuestionnairePage() {
  const { cropId } = useParams();
  const [crop, setCrop] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get(`/questions/crop/${cropId}`),
      api.get(`/questions/answers/${cropId}`)
    ])
      .then(([questionResponse, answerResponse]) => {
        if (!active) return;
        setCrop(questionResponse.data.crop);
        setQuestions(questionResponse.data.questions || []);
        const saved = answerResponse.data.submission?.answers || [];
        setAnswers(saved.reduce((res, entry) => {
          res[entry.questionId] = entry.answer;
          return res;
        }, {}));
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Unable to load questionnaire.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [cropId]);

  const question = questions[currentIndex];
  const currentAnswer = question ? answers[question._id] : undefined;
  const hasCurrentAnswer = Array.isArray(currentAnswer)
    ? currentAnswer.length > 0
    : currentAnswer !== undefined && currentAnswer !== null && String(currentAnswer).trim() !== '';
  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError('');
  };

  const submitAnswers = async () => {
    setError('');
    setSubmitting(true);
    try {
      const answerList = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
      await api.post('/questions/answers', { cropId, answers: answerList });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit answers.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-shell loader">Loading questions...</div>;
  if (submitted) {
    return (
      <main className="page-shell">
        <section className="panel questionnaire-success">
          <h2>Answers Recorded!</h2>
          <p>We've calibrated recommendations specifically for your {crop?.name} farm.</p>
          <Link className="btn btn-primary" to="/farmer/recommendations">View AI Recommendations</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Survey</span>
          <h2>{crop?.name} Soil & Farm Questions</h2>
        </div>
      </section>
      {error && <div className="feedback error" role="alert">{error}</div>}
      {questions.length === 0 && !error ? (
        <div className="panel empty-state">No questions found for this crop.</div>
      ) : questions.length > 0 ? (
        <div className="panel questionnaire-panel">
          <div className="questionnaire-progress" aria-live="polite">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <div className="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax={questions.length} aria-valuenow={currentIndex + 1}>
              <span style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
            </div>
          </div>
          <div className="questionnaire-card">
            {question?.category && <span className="question-category">{question.category}</span>}
            <h3>{question?.questionText} {question?.required && <span className="required-mark" aria-label="required">*</span>}</h3>
            {question?.questionType === 'select' ? (
              <select
                value={currentAnswer || ''}
                onChange={(event) => setAnswer(question._id, event.target.value)}
                required={question.required}
              >
                <option value="">Choose an answer</option>
                {(question.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : question?.questionType === 'radio' || question?.questionType === 'yes/no' ? (
              <div className="question-options">
                {(question.questionType === 'yes/no' ? ['yes', 'no'] : question.options || []).map((option) => (
                  <label className="question-choice" key={option}>
                    <input
                      type="radio"
                      name={question._id}
                      value={option}
                      checked={currentAnswer === option}
                      onChange={() => setAnswer(question._id, option)}
                    />
                    <span>{option === 'yes' ? 'Yes' : option === 'no' ? 'No' : option}</span>
                  </label>
                ))}
              </div>
            ) : question?.questionType === 'checkbox' ? (
              <div className="question-options">
                {(question.options || []).map((option) => {
                  const checked = Array.isArray(currentAnswer) && currentAnswer.includes(option);
                  return (
                    <label className="question-choice" key={option}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const current = Array.isArray(currentAnswer) ? currentAnswer : [];
                          setAnswer(question._id, event.target.checked
                            ? [...current, option]
                            : current.filter((value) => value !== option));
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <input
                type={question?.questionType === 'number' ? 'number' : 'text'}
                className="mt-sm"
                value={currentAnswer ?? ''}
                onChange={(event) => setAnswer(
                  question._id,
                  question.questionType === 'number'
                    ? (event.target.value === '' ? '' : Number(event.target.value))
                    : event.target.value
                )}
                placeholder={question?.questionType === 'number' ? 'Enter a number' : 'Type your answer here...'}
                required={question?.required}
              />
            )}
          </div>
          <div className="action-row mt-md">
            <button
              className="btn btn-secondary"
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
            >
              Previous
            </button>
            {currentIndex < questions.length - 1 ? (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  if (question.required && !hasCurrentAnswer) {
                    setError('Please answer this required question before continuing.');
                    return;
                  }
                  setCurrentIndex((idx) => idx + 1);
                  setError('');
                }}
              >
                Next
              </button>
            ) : (
              <button className="btn btn-primary" type="button" onClick={submitAnswers} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Complete Questionnaire'}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}

/* ---------------- Products, Cart & Details ---------------- */
function ProductCard({ product }) {
  const image = product.images?.[0] || product.image;
  return (
    <article className="product-card">
      {image ? <img src={image} alt={product.name} loading="lazy" /> : <div className="product-image-placeholder">Product image unavailable</div>}
      <div className="product-body">
        <div className="product-card-meta">
          <span>{product.category}</span>
          <span className={`availability ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {product.stock > 0 ? 'In stock' : 'Out of stock'}
          </span>
        </div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="price-row">
          <strong>₹{Number(product.price).toLocaleString('en-IN')}</strong>
          <span>per {product.unit || 'pack'}</span>
        </div>
        <Link className="btn btn-secondary product-detail-link" to={`/products/${product.id || product._id}`}>
          View Details
        </Link>
      </div>
    </article>
  );
}

function FarmerProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/products')
      .then(({ data }) => setProducts(data.products || []))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load products.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Catalogue</span>
          <h2>Agricultural Inputs</h2>
        </div>
      </section>
      {error && <div className="feedback error" role="alert">{error}</div>}
      {loading ? <div className="loader">Loading products...</div> : !error && products.length ? (
        <div className="card-grid product-grid">
          {products.map((p) => <ProductCard product={p} key={p.id || p._id} />)}
        </div>
      ) : !error ? <div className="panel empty-state">No products are available right now.</div> : null}
    </main>
  );
}

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => setProduct(data.product))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load product details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async (goToCheckout = false) => {
    setAdding(true);
    setError('');
    try {
      await api.post('/cart/add', { productId: product.id || product._id, quantity });
      navigate(goToCheckout ? '/checkout' : '/cart');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add this product to your cart.');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="page-shell loader">Loading details...</div>;
  if (!product) return <div className="page-shell"><div className="feedback error" role="alert">{error || 'Product not found.'}</div></div>;

  return (
    <main className="page-shell product-detail-page">
      <div className="detail-layout">
        <div className="detail-gallery">
          {product.images?.[0]
            ? <img className="detail-image" src={product.images[0]} alt={product.name} />
            : <div className="detail-image image-empty-state">No product image available</div>}
        </div>
        <div className="detail-content">
          <span className="eyebrow">{product.category || 'Farm input'}</span>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <div className="price-box">₹{Number(product.price).toLocaleString('en-IN')} <small>/ {product.unit || 'unit'}</small></div>
          <div className={`availability ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </div>
          {product.retailerName && <p className="product-seller">Sold by {product.retailerName}</p>}
          <div className="quantity-row" aria-label="Product quantity">
            <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
            <span>{quantity}</span>
            <button type="button" aria-label="Increase quantity" disabled={quantity >= product.stock} onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}>+</button>
          </div>
          {error && <div className="feedback error mt-md" role="alert">{error}</div>}
          <div className="detail-actions">
            <button className="btn btn-primary" onClick={() => addToCart()} disabled={adding || product.stock < 1}>
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <button className="btn btn-secondary" onClick={() => addToCart(true)} disabled={adding || product.stock < 1}>
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function CartPage() {
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/cart')
      .then(({ data }) => setCart(data.cart || { items: [] }))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load your cart.'))
      .finally(() => setLoading(false));
  }, []);

  const total = (cart.items || []).reduce((sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 0), 0);
  const updateQuantity = async (item, quantity) => {
    setUpdatingId(item.productId);
    setError('');
    try {
      const { data } = await api.patch('/cart/update', { productId: item.productId, quantity });
      setCart(data.cart || { items: [] });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update your cart.');
    } finally {
      setUpdatingId('');
    }
  };
  const removeItem = async (productId) => {
    setUpdatingId(productId);
    setError('');
    try {
      const { data } = await api.delete(`/cart/${productId}`);
      setCart(data.cart || { items: [] });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove this item.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <main className="page-shell">
      <section className="section-header">
        <div><span className="eyebrow">Your basket</span><h2>My Cart</h2></div>
        <Link className="btn btn-secondary" to="/farmer/products">Continue shopping</Link>
      </section>
      {error && <div className="feedback error" role="alert">{error}</div>}
      {loading ? <div className="loader">Loading your cart...</div> : !error && (
      <div className="cart-layout mt-md">
        <div className="panel list-stack">
          {(!cart.items || cart.items.length === 0) ? <div className="empty-state">Your cart is empty.</div> : cart.items.map((item) => (
            <div key={item.productId} className="cart-item">
              {item.product?.image && <img className="cart-product-image" src={item.product.image} alt="" />}
              <div className="cart-product-info">
                <strong>{item.product?.name || 'Unavailable product'}</strong>
                <p>₹{Number(item.product?.price || 0).toLocaleString('en-IN')} / {item.product?.unit || 'unit'}</p>
                {item.product?.stock === 0 && <span className="availability out-of-stock">Out of stock</span>}
              </div>
              <div className="cart-controls">
                <button type="button" aria-label={`Decrease quantity of ${item.product?.name || 'unavailable product'}`} disabled={!item.product || updatingId === item.productId || item.quantity <= 1} onClick={() => updateQuantity(item, item.quantity - 1)}>−</button>
                <span>Qty: {item.quantity}</span>
                <button type="button" aria-label={`Increase quantity of ${item.product?.name || 'unavailable product'}`} disabled={!item.product || updatingId === item.productId || item.quantity >= item.product.stock} onClick={() => updateQuantity(item, item.quantity + 1)}>+</button>
                <button type="button" className="btn btn-secondary btn-small" disabled={updatingId === item.productId} onClick={() => removeItem(item.productId)}>
                  {updatingId === item.productId ? 'Updating...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="panel">
          <h3>Order Summary</h3>
          <div className="summary-line"><span>Subtotal</span><strong>₹{total.toLocaleString('en-IN')}</strong></div>
          <div className="summary-line total"><span>Items subtotal</span><strong>₹{total.toLocaleString('en-IN')}</strong></div>
          <p className="checkout-note">Delivery charges are added when your order is created.</p>
          {cart.items.length
            ? <Link className="btn btn-primary full-width mt-md" to="/checkout">Proceed to Checkout</Link>
            : <button className="btn btn-primary full-width mt-md" type="button" disabled>Proceed to Checkout</button>}
        </div>
      </div>
      )}
    </main>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [loadingCart, setLoadingCart] = useState(true);
  const [error, setError] = useState('');
  const [checkoutKey] = useState(() => window.crypto?.randomUUID?.() || `checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const [pendingOrderId, setPendingOrderId] = useState('');

  useEffect(() => {
    Promise.all([api.get('/cart'), api.get('/farmer/profile')])
      .then(([cartResponse, profileResponse]) => {
        setCart(cartResponse.data.cart || { items: [] });
        const user = profileResponse.data.user;
        setAddress(user?.homeAddress || user?.farmAddress || '');
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load checkout information.'))
      .finally(() => setLoadingCart(false));
  }, []);

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      let orderId = pendingOrderId;
      if (!orderId) {
        const { data } = await api.post('/orders/create', { deliveryAddress: address, checkoutKey });
        orderId = data.order.id;
        setPendingOrderId(orderId);
      }
      const paymentResult = await startRazorpayPayment(orderId);
      navigate(`/payments/result/${orderId}`, { state: { paymentStatus: paymentResult.status } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 0), 0);

  return (
    <main className="page-shell checkout-page">
      <section className="section-header"><div><span className="eyebrow">Secure checkout</span><h2>Delivery & Payment</h2></div></section>
      {error && <div className="feedback error" role="alert">{error}</div>}
      {loadingCart ? <div className="loader">Loading checkout...</div> : (
        <div className="checkout-layout">
          <div className="panel">
            <h3>Delivery address</h3>
            <label className="checkout-address">
              Address
              <textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={4} placeholder="Enter your complete farm or delivery address" required disabled={Boolean(pendingOrderId)} />
            </label>
            {pendingOrderId && <p className="checkout-note">An unpaid order already exists for this checkout. Its delivery address is locked while payment is retried.</p>}
            <div className="payment-method-card">
              <ShieldCheck size={18} />
              <div><strong>Razorpay secure payment</strong><span>Test mode checkout</span></div>
            </div>
          </div>
          <aside className="panel checkout-summary">
            <h3>Order summary</h3>
            {cart.items.length === 0 ? <p className="empty-state">Your cart is empty.</p> : (
              <div className="checkout-items">
                {cart.items.map((item) => (
                  <div className="summary-line" key={item.productId}>
                    <span>{item.product?.name || 'Product'} × {item.quantity}</span>
                    <strong>₹{(Number(item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}</strong>
                  </div>
                ))}
              </div>
            )}
            <div className="summary-line"><span>Subtotal</span><strong>₹{subtotal.toLocaleString('en-IN')}</strong></div>
            <p className="checkout-note">Delivery fee and final payable amount are calculated securely when the order is created.</p>
            <button className="btn btn-primary full-width mt-md" onClick={handlePay} disabled={loading || loadingCart || !cart.items.length || !address.trim()}>
              {loading ? 'Processing...' : 'Continue to secure payment'}
            </button>
            <p className="checkout-note">Your payment is verified by the backend. No payment secret is stored in this page.</p>
          </aside>
        </div>
      )}
    </main>
  );
}

function RecommendationsPage() {
  const [data, setData] = useState({ recommendations: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/farmer/profile')
      .then(({ data: profileData }) => {
        const cId = profileData.user?.selectedCropId;
        if (cId) return api.get(`/recommendations/${cId}`);
        return { data: { recommendations: [] } };
      })
      .then(({ data: recData }) => setData(recData || { recommendations: [] }))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load recommendations.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-shell">
      <section className="section-header">
        <div><span className="eyebrow">Crop-specific inputs</span><h2>Recommended for You</h2></div>
        <Link className="btn btn-secondary" to="/farmer/crop">Change crop</Link>
      </section>
      {error && <div className="feedback error" role="alert">{error}</div>}
      {loading ? <div className="loader">Loading recommendations...</div> : error ? null : (data.recommendations || []).length ? (
        <div className="card-grid product-grid mt-md">
          {data.recommendations.map((prod) => <ProductCard product={prod} key={prod.id || prod._id} />)}
        </div>
      ) : (
        <div className="panel recommendation-empty">
          <h3>No recommendations yet</h3>
          <p>Select a crop and complete its questionnaire to receive product recommendations.</p>
          <Link className="btn btn-primary mt-md" to="/farmer/crop">Choose a crop</Link>
        </div>
      )}
    </main>
  );
}

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/orders/my')
      .then(({ data }) => setOrders(data.orders || []))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load your orders.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-shell">
      <section className="section-header"><div><span className="eyebrow">Purchases</span><h2>My Orders</h2></div></section>
      {error && <div className="feedback error" role="alert">{error}</div>}
      {loading ? <div className="loader">Loading your orders...</div> : error ? null : orders.length ? (
        <div className="list-stack mt-md">
          {orders.map((order) => (
            <article key={order.id || order._id} className="panel order-row">
              <div className="order-row-main">
                <strong>{order.orderNumber || order.id}</strong>
                <p>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Date unavailable'} · {order.items?.length || 0} items</p>
              </div>
              <span className="pill green">{order.orderStatus || 'Status unavailable'}</span>
              <span className="order-payment-status">Payment: {order.paymentStatus || 'Unknown'}</span>
              <strong>₹{Number(order.amount || 0).toLocaleString('en-IN')}</strong>
              <Link className="btn btn-secondary btn-small" to={`/orders/${order.id || order._id}`}>View Details</Link>
            </article>
          ))}
        </div>
      ) : <div className="panel empty-state">You have no orders yet.</div>}
    </main>
  );
}

function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load order details.'))
      .finally(() => setLoading(false));
  }, [id]);

  const retryPayment = async () => {
    setPaying(true);
    setError('');
    try {
      const result = await startRazorpayPayment(order.id || order.orderNumber);
      navigate(`/payments/result/${encodeURIComponent(order.id || order.orderNumber)}`, { state: { paymentStatus: result.status } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to retry payment.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="page-shell loader">Loading order...</div>;
  if (!order) return <main className="page-shell"><div className="feedback error" role="alert">{error || 'Order not found.'}</div></main>;

  return (
    <main className="page-shell order-detail-page">
      <section className="section-header">
        <div><span className="eyebrow">Order details</span><h2>{order.orderNumber || order.id}</h2></div>
        <Link className="btn btn-secondary" to="/orders">Back to orders</Link>
      </section>
      <div className="order-detail-grid">
        <section className="panel">
          <h3>Items</h3>
          <div className="list-stack">
            {(order.items || []).map((item) => (
              <div className="order-item" key={item.productId || item.name}>
                {item.image && <img src={item.image} alt="" />}
                <div><strong>{item.productName || item.name}</strong><p>Sold by {order.retailerName || 'Retailer'} · Qty {item.quantity}</p></div>
                <strong>₹{(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('en-IN')}</strong>
              </div>
            ))}
          </div>
          <div className="summary-line"><span>Delivery fee</span><strong>₹{Number(order.deliveryFee || 0).toLocaleString('en-IN')}</strong></div>
          <div className="summary-line total"><span>Total</span><strong>₹{Number(order.amount || 0).toLocaleString('en-IN')}</strong></div>
        </section>
        <aside className="panel">
          <h3>Delivery & payment</h3>
          <div className="info-grid">
            <div><span>Order status</span><strong>{order.orderStatus || 'Unknown'}</strong></div>
            <div><span>Delivery status</span><strong>{order.deliveryStatus || 'Unknown'}</strong></div>
            <div><span>Payment status</span><strong>{order.paymentStatus || 'Unknown'}</strong></div>
            <div><span>Payment method</span><strong>{order.paymentMethod || 'Razorpay'}</strong></div>
            <div><span>Order date</span><strong>{order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : 'Unavailable'}</strong></div>
          </div>
          <div className="order-address"><strong>Delivery address</strong><p>{order.deliveryAddress || 'No delivery address recorded.'}</p></div>
          {error && <div className="feedback error" role="alert">{error}</div>}
          {order.paymentStatus !== 'PAID' && order.orderStatus !== 'CANCELLED' && (
            <button className="btn btn-primary" type="button" onClick={retryPayment} disabled={paying}>
              {paying ? 'Opening secure checkout...' : 'Retry payment'}
            </button>
          )}
          {order.statusHistory?.length > 0 && (
            <div className="retailer-order-timeline">
              <h3>Order updates</h3>
              <ol>{order.statusHistory.map((entry, index) => (
                <li key={`${entry.status}-${entry.updatedAt || index}`}>
                  <strong>{entry.status}</strong>
                  {(entry.timestamp || entry.updatedAt) && <span>{new Date(entry.timestamp || entry.updatedAt).toLocaleString('en-IN')}</span>}
                </li>
              ))}</ol>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function PaymentResultPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${orderId}`)
      .then(({ data }) => setOrder(data.order))
      .catch((err) => setError(err.response?.data?.message || 'Unable to verify the latest order status.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const paymentSucceeded = order?.paymentStatus === 'PAID';
  const paymentWasCancelled = location.state?.paymentStatus === 'FAILED' || order?.paymentStatus === 'FAILED';

  return (
    <main className="page-shell payment-result-shell">
      <div className={`panel payment-result ${paymentSucceeded ? 'payment-success' : paymentWasCancelled ? 'payment-failure' : 'payment-pending'}`}>
        <span className="eyebrow">Order {order?.orderNumber || orderId}</span>
        <h2>{loading ? 'Checking payment status...' : paymentSucceeded ? 'Payment successful' : error ? 'Unable to confirm payment' : paymentWasCancelled ? 'Payment not completed' : 'Payment status pending'}</h2>
        <p>{paymentSucceeded
          ? 'Your payment has been verified. You can follow the latest delivery status from your orders.'
          : paymentWasCancelled
            ? 'The payment was not completed. Your order remains available in My Orders.'
            : 'We could not confirm a completed payment yet. Check the latest status before trying again.'}</p>
        {error && <div className="feedback error" role="alert">{error}</div>}
        {order && <div className="payment-result-facts">
          <div><span>Order status</span><strong>{order.orderStatus}</strong></div>
          <div><span>Payment status</span><strong>{order.paymentStatus}</strong></div>
          <div><span>Amount</span><strong>₹{Number(order.amount || 0).toLocaleString('en-IN')}</strong></div>
        </div>}
        <Link className="btn btn-primary mt-sm" to="/orders">View My Orders</Link>
      </div>
    </main>
  );
}

function DeliveryDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/delivery/dashboard');
        if (!active) return;
        setDashboard(data);
        if (data.profile?.isAvailable && data.profile?.status === 'VERIFIED') {
          const availableResponse = await api.get('/delivery/available');
          if (active) setAvailableDeliveries(availableResponse.data.deliveries || []);
        } else {
          setAvailableDeliveries([]);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Unable to load delivery dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [refreshKey]);

  const updateAvailability = async () => {
    const isAvailable = !dashboard?.profile?.isAvailable;
    setBusyId('availability');
    setError('');
    try {
      await api.patch('/delivery/availability', { isAvailable });
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update availability.');
    } finally {
      setBusyId('');
    }
  };

  const claimDelivery = async (deliveryId) => {
    setBusyId(deliveryId);
    setError('');
    try {
      await api.post(`/delivery/deliveries/${deliveryId}/claim`);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to claim this delivery.');
    } finally {
      setBusyId('');
    }
  };

  const updateDeliveryStatus = async (delivery) => {
    const nextStatus = {
      READY_FOR_PICKUP: 'PICKED_UP',
      PICKED_UP: 'OUT_FOR_DELIVERY',
      OUT_FOR_DELIVERY: 'DELIVERED'
    }[delivery.status];
    if (!nextStatus) return;
    setBusyId(delivery.id);
    setError('');
    try {
      await api.put(`/delivery/deliveries/${delivery.id}/status`, { status: nextStatus });
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update delivery status.');
    } finally {
      setBusyId('');
    }
  };

  if (loading && !dashboard) return <div className="page-shell loader">Loading delivery dashboard...</div>;
  if (!dashboard && error) {
    return (
      <main className="page-shell">
        <div className="feedback error" role="alert">{error}</div>
        <button type="button" className="btn btn-secondary mt-md" onClick={() => setRefreshKey((value) => value + 1)}>Retry</button>
      </main>
    );
  }

  return (
    <main className="page-shell delivery-dashboard-page">
      <section className="section-header">
        <div><span className="eyebrow">Delivery operations</span><h2>Welcome, {dashboard?.profile?.name || 'Delivery Partner'}</h2>
          <p className="section-description">Review your assigned deliveries and update each stop as it progresses.</p>
        </div>
        <div className="delivery-availability">
          <span className={`pill ${dashboard?.profile?.isAvailable ? 'green' : 'amber'}`}>
            {dashboard?.profile?.status === 'VERIFIED' ? (dashboard.profile.isAvailable ? 'Available' : 'Unavailable') : dashboard?.profile?.status || 'Status unavailable'}
          </span>
          {dashboard?.profile?.status === 'VERIFIED' && (
            <button type="button" className="btn btn-secondary" onClick={updateAvailability} disabled={busyId === 'availability'}>
              {busyId === 'availability' ? 'Updating...' : dashboard.profile.isAvailable ? 'Go offline' : 'Go available'}
            </button>
          )}
        </div>
      </section>
      {error && <div className="feedback error" role="alert">{error}</div>}
      <div className="stats-grid delivery-stats-grid">
        <StatCard label="Assigned" value={dashboard?.stats?.assigned ?? 0} />
        <StatCard label="Pickup pending" value={dashboard?.stats?.pickupPending ?? 0} tone="amber" />
        <StatCard label="Out for delivery" value={dashboard?.stats?.outForDelivery ?? 0} tone="blue" />
        <StatCard label="Delivered" value={dashboard?.stats?.delivered ?? 0} />
      </div>
      <section className="panel mt-md">
        <div className="section-header"><div><span className="eyebrow">My route</span><h3>Assigned deliveries</h3></div></div>
        {dashboard?.deliveries?.length ? (
          <div className="delivery-list">
            {dashboard.deliveries.map((delivery) => (
              <article className="delivery-card" key={delivery.id}>
                <div className="delivery-card-heading"><strong>{delivery.orderNumber}</strong><span className="pill green">{delivery.status.replaceAll('_', ' ')}</span></div>
                <div className="delivery-details">
                  <div><span>Pickup</span><strong>{delivery.pickupAddress || 'Address unavailable'}</strong></div>
                  <div><span>Drop-off</span><strong>{delivery.deliveryAddress || 'Address unavailable'}</strong></div>
                  <div><span>Farmer</span><strong>{delivery.farmer?.name || 'Unavailable'} {delivery.farmer?.mobile && `· ${delivery.farmer.mobile}`}</strong></div>
                  <div><span>Retailer</span><strong>{delivery.retailer?.name || 'Unavailable'}</strong></div>
                </div>
                <details className="delivery-extra-details">
                  <summary>View delivery details</summary>
                  <p>{(delivery.items || []).map((item) => `${item.name} × ${item.quantity}`).join(', ') || 'No item details available.'}</p>
                  {delivery.currentLocation && <p>Latest coordinates: {delivery.currentLocation.lat}, {delivery.currentLocation.lng}</p>}
                  {delivery.locationUpdatedAt && <p>Location updated: {new Date(delivery.locationUpdatedAt).toLocaleString('en-IN')}</p>}
                </details>
                {delivery.status !== 'DELIVERED' && (
                  <button type="button" className="btn btn-primary" disabled={busyId === delivery.id} onClick={() => updateDeliveryStatus(delivery)}>
                    {busyId === delivery.id ? 'Updating...' : `Mark ${({ READY_FOR_PICKUP: 'picked up', PICKED_UP: 'out for delivery', OUT_FOR_DELIVERY: 'delivered' })[delivery.status]}`}
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : <div className="empty-state">No deliveries are currently assigned to you.</div>}
      </section>
      {dashboard?.profile?.isAvailable && (
        <section className="panel mt-md">
          <div className="section-header"><div><span className="eyebrow">Pickup queue</span><h3>Available deliveries</h3></div></div>
          {availableDeliveries.length ? (
            <div className="delivery-list">
              {availableDeliveries.map((delivery) => (
                <article className="delivery-card" key={delivery.id}>
                  <div className="delivery-card-heading"><strong>{delivery.orderNumber}</strong><span className="pill amber">{delivery.status.replaceAll('_', ' ')}</span></div>
                  <div className="delivery-details">
                    <div><span>Pickup</span><strong>{delivery.pickupAddress || 'Address unavailable'}</strong></div>
                    <div><span>Drop-off</span><strong>{delivery.deliveryAddress || 'Address unavailable'}</strong></div>
                    <div><span>Items</span><strong>{delivery.items?.length || 0}</strong></div>
                  </div>
                  <button type="button" className="btn btn-primary" disabled={busyId === delivery.id} onClick={() => claimDelivery(delivery.id)}>
                    {busyId === delivery.id ? 'Claiming...' : 'Claim delivery'}
                  </button>
                </article>
              ))}
            </div>
          ) : <div className="empty-state">No paid pickup jobs are available right now.</div>}
        </section>
      )}
    </main>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [orderActivity, setOrderActivity] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api.get('/admin/dashboard'), api.get('/admin/overview-stats')])
      .then(([dashboardResponse, overviewResponse]) => {
        setStats(dashboardResponse.data.totals || {});
        setOrderActivity(dashboardResponse.data.charts?.ordersByDay || []);
        setOrderStatuses(dashboardResponse.data.charts?.ordersByStatus || []);
        setRegistrations(overviewResponse.data.data?.growth || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load admin dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const monthlyOrders = orderStatuses.reduce((summary, entry) => {
    summary[entry.status] = (summary[entry.status] || 0) + entry.count;
    return summary;
  }, {});
  const maxRegistrationCount = Math.max(1, ...registrations.map((entry) => entry.count));
  const maxDailyOrders = Math.max(1, ...orderActivity.map((entry) => entry.orders));

  return (
    <AdminPageLayout>
      <main className="page-shell admin-dashboard">
        <nav className="admin-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span aria-hidden="true">/</span><span>Admin</span>
        </nav>
        <section className="section-header admin-dashboard-heading">
          <div><span className="eyebrow">Administration</span><h2>System Overview</h2><p className="section-description">Live platform activity from registered users, products, orders, and payments.</p></div>
        </section>
        {error && <div className="feedback error" role="alert">{error}</div>}
        {loading ? <div className="loader">Loading live statistics...</div> : !stats ? null : (
          <>
            <div className="stats-grid admin-stats-grid">
              <StatCard label="Farmers" value={stats?.farmers ?? 0} />
              <StatCard label="Retailers" value={stats?.retailers ?? 0} />
              <StatCard label="Delivery partners" value={stats?.deliveryPartners ?? 0} />
              <StatCard label="Products" value={stats?.totalProducts ?? 0} />
              <StatCard label="Orders" value={stats?.totalOrders ?? 0} />
              <StatCard label="Revenue" value={`₹${Number(stats?.revenue || 0).toLocaleString('en-IN')}`} tone="amber" />
            </div>
            <div className="admin-analytics-grid">
              <section className="panel admin-chart-panel">
                <div className="section-header"><div><span className="eyebrow">Past quarter</span><h3>New account registrations</h3></div></div>
                {registrations.length ? (
                  <div className="admin-bars" role="img" aria-label="Monthly new account registrations">
                    {registrations.map((entry) => {
                      const label = new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(entry._id.year, entry._id.month - 1, 1));
                      return <div className="admin-bar-item" key={`${entry._id.year}-${entry._id.month}`}>
                        <strong>{entry.count}</strong>
                        <span className="admin-bar-track"><i style={{ height: `${(entry.count / maxRegistrationCount) * 100}%` }} /></span>
                        <span>{label}</span>
                      </div>;
                    })}
                  </div>
                ) : <div className="empty-state">No account registrations in this period.</div>}
              </section>
              <section className="panel admin-chart-panel">
                <div className="section-header"><div><span className="eyebrow">Last 14 days</span><h3>Order activity</h3></div></div>
                {orderActivity.length ? (
                  <div className="admin-bars" role="img" aria-label="Daily order activity over the past two weeks">
                    {orderActivity.map((entry) => (
                      <div className="admin-bar-item" key={entry.date}>
                        <strong>{entry.orders}</strong>
                        <span className="admin-bar-track"><i className="admin-bar-orders" style={{ height: `${(entry.orders / maxDailyOrders) * 100}%` }} /></span>
                        <span>{new Date(`${entry.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    ))}
                  </div>
                ) : <div className="empty-state">No orders in this period.</div>}
              </section>
            </div>
            <section className="panel admin-status-panel">
              <div className="section-header"><div><span className="eyebrow">Order management</span><h3>Orders by status</h3></div></div>
              {Object.keys(monthlyOrders).length ? (
                <div className="admin-status-list">
                  {Object.entries(monthlyOrders).map(([status, count]) => (
                    <div className="admin-status-item" key={status}><span>{status.replaceAll('_', ' ')}</span><strong>{count}</strong></div>
                  ))}
                </div>
              ) : <div className="empty-state">No order records are available.</div>}
            </section>
          </>
        )}
      </main>
    </AdminPageLayout>
  );
}

/* ---------------- Root Route Component ---------------- */
export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<FarmerLoginPage />} />
          <Route path="/register" element={<FarmerRegisterPage />} />
          <Route path="/retailer/login" element={<RoleAuthPage role="retailer" label="Retailer Login" />} />
          <Route path="/retailer/register" element={<RetailerRegistrationPage />} />
          <Route path="/delivery/login" element={<RoleAuthPage role="delivery" label="Delivery Partner Login" />} />
          <Route path="/delivery/register" element={<DeliveryRegistrationPage />} />
          <Route path="/admin/login" element={<RoleAuthPage role="admin" label="Admin Login" />} />

          {/* Farmer Features */}
          <Route path="/farmer/profile" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerProfilePage /></ProtectedRoute>} />
          <Route path="/farmer/dashboard" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerDashboard /></ProtectedRoute>} />
          <Route path="/farmer/crop" element={<ProtectedRoute allowedRoles={['farmer']}><CropSelectionPage /></ProtectedRoute>} />
          <Route path="/farmer/questions/:cropId" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerQuestionnairePage /></ProtectedRoute>} />
          <Route path="/farmer/products" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerProductsPage /></ProtectedRoute>} />
          <Route path="/farmer/recommendations" element={<ProtectedRoute allowedRoles={['farmer']}><RecommendationsPage /></ProtectedRoute>} />

          {/* Commerce & Payments */}
          <Route path="/products/:id" element={<ProtectedRoute allowedRoles={['farmer']}><ProductDetailPage /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute allowedRoles={['farmer']}><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute allowedRoles={['farmer']}><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute allowedRoles={['farmer']}><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute allowedRoles={['farmer']}><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/payments/result/:orderId" element={<ProtectedRoute allowedRoles={['farmer']}><PaymentResultPage /></ProtectedRoute>} />

          {/* Retailer & Operations */}
          <Route path="/retailer/dashboard" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerDashboardPage /></ProtectedRoute>} />
          <Route path="/retailer/profile" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerProfilePage /></ProtectedRoute>} />
          <Route path="/retailer/products" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerProductsPage /></ProtectedRoute>} />
          <Route path="/retailer/products/new" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerProductFormPage /></ProtectedRoute>} />
          <Route path="/retailer/products/:id/edit" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerProductFormPage /></ProtectedRoute>} />
          <Route path="/retailer/orders" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerOrdersPage /></ProtectedRoute>} />
          <Route path="/retailer/orders/:id" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerOrderDetailsPage /></ProtectedRoute>} />
          <Route path="/delivery/dashboard" element={<ProtectedRoute allowedRoles={['delivery']}><DeliveryDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['admin']}><AdminProductsPage /></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={['admin']}><AdminInventoryPage /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrdersPage /></ProtectedRoute>} />
          <Route path="/admin/orders/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrderDetailsPage /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminAccountPage /></ProtectedRoute>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
