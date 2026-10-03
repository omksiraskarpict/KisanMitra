import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, LogOut, MapPin, PackageCheck, Search, ShieldCheck, ShoppingCart, Sprout, Store, Tractor, Truck, UserRound, Wallet } from 'lucide-react';
import api from './api';
import { startRazorpayPayment } from './services/paymentService';
import RetailerDashboardPage from './retailer/pages/RetailerDashboardPage';
import RetailerProfilePage from './retailer/pages/RetailerProfilePage';
import RetailerProductsPage from './retailer/pages/RetailerProductsPage';
import RetailerProductFormPage from './retailer/pages/RetailerProductFormPage';
import RetailerOrdersPage, { RetailerOrderDetailsPage } from './retailer/pages/RetailerOrdersPage';

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

function AppShell({ children }) {
  const user = getStoredUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearStoredAuth();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-badge"><Sprout size={18} /></div>
          <div>
            <div className="brand-name">KisanMitra</div>
            <div className="brand-tag">Agriculture Network</div>
          </div>
        </div>

        <nav className="topnav">
          <Link to="/">Home</Link>
          {user?.role === 'farmer' && (
            <>
              <Link to="/farmer/dashboard">Dashboard</Link>
              <Link to="/farmer/profile">Profile</Link>
              <Link to="/farmer/crop">Select Crop</Link>
              <Link to="/farmer/products">Products</Link>
              <Link to="/farmer/recommendations">Recommendations</Link>
              <Link to="/cart">Cart</Link>
              <Link to="/orders">My Orders</Link>
            </>
          )}
          {user?.role === 'retailer' && (
            <>
              <Link to="/retailer/dashboard">Dashboard</Link>
              <Link to="/retailer/profile">Business Profile</Link>
              <Link to="/retailer/products">Products</Link>
              <Link to="/retailer/products/new">Add Product</Link>
              <Link to="/retailer/orders">Orders</Link>
            </>
          )}
          {user?.role === 'delivery' && (
            <>
              <Link to="/delivery/dashboard">Deliveries</Link>
            </>
          )}
          {user?.role === 'admin' && <Link to="/admin/dashboard">Admin</Link>}
        </nav>

        <div className="user-actions">
          {!user ? (
            <Link className="btn btn-secondary" to="/login">Login</Link>
          ) : (
            <>
              <span className="user-badge">{user.name}</span>
              <button className="btn btn-secondary btn-small" onClick={handleLogout}><LogOut size={14} /> Logout</button>
            </>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}

function StatCard({ label, value, tone = 'green' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function HomePage() {
  const user = getStoredUser();
  return (
    <main className="page-shell home-page">
      <section className="hero">
        <div>
          <span className="eyebrow">Smart agriculture platform</span>
          <h1>Grow better with KisanMitra</h1>
          <p>
            A complete digital farming ecosystem for crop guidance, product discovery, cart and checkout,
            retailer fulfillment, secure payments, and delivery tracking.
          </p>
          <div className="cta-row">
            {!user ? (
              <>
                <Link className="btn btn-primary" to="/login">Farmer Login</Link>
                <Link className="btn btn-secondary" to="/retailer/login">Retailer Login</Link>
              </>
            ) : (
              <Link className="btn btn-primary" to={user.role === 'farmer' ? '/farmer/dashboard' : user.role === 'retailer' ? '/retailer/dashboard' : user.role === 'delivery' ? '/delivery/dashboard' : '/admin/dashboard'}>
                Go to dashboard
              </Link>
            )}
          </div>
        </div>
        <div className="hero-panel">
          <div className="mini-card"><Sprout size={18} /> Crop intelligence</div>
          <div className="mini-card"><Wallet size={18} /> Secure payments</div>
          <div className="mini-card"><Truck size={18} /> Live tracking</div>
        </div>
      </section>

      <section className="role-grid">
        <RoleCard title="Farmer" description="Get crop suggestions, recommendations, cart checkout, and order tracking." route="/login" icon={<Tractor size={28} />} />
        <RoleCard title="Retailer" description="Create products, manage stock, and fulfill orders through the retail dashboard." route="/retailer/login" icon={<Store size={28} />} />
        <RoleCard title="Delivery Partner" description="Receive orders, pick up parcels, and share live location updates." route="/delivery/login" icon={<Truck size={28} />} />
        <RoleCard title="Admin" description="Manage farmers, retailers, products, orders, and verification queues." route="/admin/login" icon={<ShieldCheck size={28} />} />
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
      <span className="role-link">Open portal <ArrowRight size={16} /></span>
    </Link>
  );
}

function RoleAuthPage({ role, label }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStoredUser()) {
      const user = getStoredUser();
      if (user.role === 'farmer') navigate('/farmer/dashboard');
      if (user.role === 'retailer') navigate('/retailer/dashboard');
      if (user.role === 'delivery') navigate('/delivery/dashboard');
      if (user.role === 'admin') navigate('/admin/dashboard');
    }
  }, [navigate]);

  const onInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post(role === 'retailer' ? '/auth/retailer/login' : '/auth/login', {
        ...form,
        role
      });
      setStoredAuth(data.user, data.token);
      if (data.user.role === 'farmer') navigate('/farmer/dashboard');
      if (data.user.role === 'retailer') navigate('/retailer/dashboard');
      if (data.user.role === 'delivery') navigate('/delivery/dashboard');
      if (data.user.role === 'admin') navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-badge"><Sprout size={18} /></div>
          <h2>{label}</h2>
          <p>Secure access portal</p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Email or Mobile
            <input type="text" name="email" value={form.email} onChange={onInputChange} placeholder="example@kisanmitra.com" required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={onInputChange} placeholder="********" required />
          </label>

          {error && <div className="feedback error">{error}</div>}

          <div className="auth-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
          </div>
        </form>

        <div className="auth-links">
          <Link to="/login">Farmer Login</Link>
          <Link to="/register">Farmer Register</Link>
          <Link to="/retailer/login">Retailer Login</Link>
          <Link to="/retailer/register">Retailer Register</Link>
          <Link to="/delivery/login">Delivery Login</Link>
          <Link to="/admin/login">Admin Login</Link>
        </div>
      </div>
    </main>
  );
}

function FarmerLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStoredUser()) {
      const user = getStoredUser();
      if (user.role === 'farmer') navigate('/farmer/dashboard');
    }
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', {
        ...form,
        role: 'farmer'
      });
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
          <div className="brand-badge"><Sprout size={18} /></div>
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
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="********" required />
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
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    homeAddress: '',
    farmAddress: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/register', {
        ...form,
        role: 'farmer'
      });
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
          <div className="brand-badge"><Sprout size={18} /></div>
          <h2>Farmer Registration</h2>
          <p>Create your account and start using KisanMitra</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="info-grid">
            <label>
              Full name
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label>
              Mobile
              <input type="tel" name="mobile" value={form.mobile} onChange={handleChange} required />
            </label>
            <label>
              Email
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </label>
            <label>
              City
              <input type="text" name="city" value={form.city} onChange={handleChange} />
            </label>
            <label>
              State
              <input type="text" name="state" value={form.state} onChange={handleChange} />
            </label>
            <label>
              Pincode
              <input type="text" name="pincode" value={form.pincode} onChange={handleChange} />
            </label>
          </div>

          <label>
            Home address
            <input type="text" name="homeAddress" value={form.homeAddress} onChange={handleChange} required />
          </label>

          <label>
            Farm address
            <input type="text" name="farmAddress" value={form.farmAddress} onChange={handleChange} required />
          </label>

          <div className="info-grid">
            <label>
              Password
              <input type="password" name="password" value={form.password} onChange={handleChange} required />
            </label>
            <label>
              Confirm password
              <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
            </label>
          </div>

          {error && <div className="feedback error">{error}</div>}

          <div className="auth-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
            <Link className="btn btn-secondary" to="/login">Already have an account?</Link>
          </div>
        </form>
      </div>
    </main>
  );
}

function FarmerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', mobile: '', email: '', homeAddress: '', farmAddress: '', city: '', state: '', pincode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/farmer/profile');
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
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const { data } = await api.put('/farmer/profile', form);
      setProfile(data.user);
      setStoredAuth(data.user, getStoredToken());
      alert('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile.');
    }
  };

  if (loading) return <div className="page-shell loader">Loading profile...</div>;

  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Farmer profile</span>
          <h2>{profile?.name || 'My profile'}</h2>
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

        <div className="auth-actions">
          <button className="btn btn-primary" type="submit">Save profile</button>
        </div>
      </form>
    </main>
  );
}

function FarmerDashboard() {
  const [data, setData] = useState({ user: null, crops: [], selectedCrop: 'Wheat', questions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/farmer/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => setData({ user: getStoredUser(), crops: [], selectedCrop: 'Wheat', questions: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-shell loader">Loading dashboard...</div>;

  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Farmer workspace</span>
          <h2>Welcome, {data.user?.name || 'Farmer'}</h2>
        </div>
        <div className="auth-actions">
          <Link className="btn btn-primary" to="/farmer/crop">Select crop</Link>
          <Link className="btn btn-secondary" to="/farmer/profile">Edit profile</Link>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard label="Selected crop" value={data.selectedCrop} />
        <StatCard label="Orders" value="3" />
        <StatCard label="Active order" value="1" />
        <StatCard label="Delivery status" value="In transit" tone="amber" />
      </div>

      <section className="panel">
        <h3>Profile summary</h3>
        <div className="info-grid">
          <div><strong>Name</strong><span>{data.user?.name || '—'}</span></div>
          <div><strong>Email</strong><span>{data.user?.email || '—'}</span></div>
          <div><strong>Phone</strong><span>{data.user?.mobile || '—'}</span></div>
          <div><strong>Farm address</strong><span>{data.user?.farmAddress || '—'}</span></div>
        </div>
      </section>

      <section className="panel-grid dashboard-grid">
        <div className="panel card-tall">
          <h3>Crop assessment</h3>
          <p>{data.selectedCropId ? `Continue the ${data.selectedCrop} questionnaire or choose a different crop.` : 'Choose a crop to start a crop-specific farming questionnaire.'}</p>
          <Link className="btn btn-primary dashboard-assessment-link" to={data.selectedCropId ? `/farmer/questions/${data.selectedCropId}` : '/farmer/crop'}>
            {data.selectedCropId ? 'Continue questionnaire' : 'Choose a crop'}
          </Link>
        </div>

        <div className="panel card-tall">
          <h3>My farm status</h3>
          <div className="badge-list">
            <span className="pill green">Soil healthy</span>
            <span className="pill blue">Irrigation monitored</span>
            <span className="pill amber">Weather alert</span>
          </div>
          <ul className="simple-list">
            <li>Rain interval: 4 days</li>
            <li>Soil moisture: 58%</li>
            <li>Best fertilizer window: This week</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

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
          <span className="eyebrow">Crop intelligence</span>
          <h2>Select your crop</h2>
          <p className="section-description">Choose a crop to open its farming questionnaire.</p>
        </div>
      </section>

      <label className="crop-search">
        <Search size={18} aria-hidden="true" />
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search crops" aria-label="Search crops" />
      </label>

      {error && <div className="feedback error" role="alert">{error}</div>}
      {loading ? <div className="loader">Loading crops...</div> : visibleCrops.length === 0 ? (
        <div className="panel empty-state">{search ? 'No crops match your search.' : 'No active crops are available yet.'}</div>
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
                  {selectingCropId === crop._id ? 'Opening...' : 'Choose crop'}
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
        const savedAnswers = answerResponse.data.submission?.answers || [];
        setAnswers(savedAnswers.reduce((result, entry) => {
          result[entry.questionId] = entry.answer;
          return result;
        }, {}));
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Unable to load this crop questionnaire.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [cropId]);

  const question = questions[currentIndex];
  const answerIsPresent = (answer) => Array.isArray(answer)
    ? answer.length > 0
    : typeof answer === 'string'
      ? answer.trim().length > 0
      : answer !== undefined && answer !== null;

  const setAnswer = (questionId, value) => {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
    setError('');
  };

  const changeCheckbox = (questionId, option, checked) => {
    const selected = Array.isArray(answers[questionId]) ? answers[questionId] : [];
    setAnswer(questionId, checked ? [...selected, option] : selected.filter((value) => value !== option));
  };

  const goNext = () => {
    if (question?.required && !answerIsPresent(answers[question._id])) {
      setError('Please answer this required question before continuing.');
      return;
    }
    setError('');
    setCurrentIndex((index) => Math.min(index + 1, questions.length - 1));
  };

  const submitAnswers = async () => {
    const missingIndex = questions.findIndex((item) => item.required && !answerIsPresent(answers[item._id]));
    if (missingIndex !== -1) {
      setCurrentIndex(missingIndex);
      setError('Please answer all required questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const answerList = Object.entries(answers)
        .filter(([, answer]) => answerIsPresent(answer))
        .map(([questionId, answer]) => ({ questionId, answer }));
      await api.post('/questions/answers', { cropId, answers: answerList });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save your answers.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionControl = () => {
    if (!question) return null;
    const value = answers[question._id];
    if (question.questionType === 'text') {
      return <textarea value={value || ''} onChange={(event) => setAnswer(question._id, event.target.value)} required={question.required} rows={4} />;
    }
    if (question.questionType === 'number') {
      return <input type="number" value={value ?? ''} onChange={(event) => setAnswer(question._id, event.target.value === '' ? '' : Number(event.target.value))} required={question.required} />;
    }
    if (question.questionType === 'select') {
      return (
        <select value={value || ''} onChange={(event) => setAnswer(question._id, event.target.value)} required={question.required}>
          <option value="">Choose an answer</option>
          {(question.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    if (question.questionType === 'checkbox') {
      return <div className="question-options">{(question.options || []).map((option) => (
        <label className="question-choice" key={option}>
          <input type="checkbox" checked={(value || []).includes(option)} onChange={(event) => changeCheckbox(question._id, option, event.target.checked)} />
          <span>{option}</span>
        </label>
      ))}</div>;
    }

    const options = question.questionType === 'yes/no' ? ['Yes', 'No'] : (question.options || []);
    return <div className="question-options">{options.map((option) => {
      const optionValue = question.questionType === 'yes/no' ? option === 'Yes' : option;
      return (
        <label className="question-choice" key={option}>
          <input
            type="radio"
            name={question._id}
            checked={value === optionValue}
            onChange={() => setAnswer(question._id, optionValue)}
            required={question.required && value === undefined}
          />
          <span>{option}</span>
        </label>
      );
    })}</div>;
  };

  if (loading) return <div className="page-shell loader">Loading questionnaire...</div>;
  if (error && !crop) return <main className="page-shell"><div className="feedback error" role="alert">{error}</div><Link className="btn btn-secondary" to="/farmer/crop">Back to crops</Link></main>;

  if (submitted) {
    return (
      <main className="page-shell questionnaire-shell">
        <section className="panel questionnaire-success">
          <span className="eyebrow">Questionnaire saved</span>
          <h2>{crop?.name} answers are ready for analysis</h2>
          <p>Your responses are saved to your farmer account and can now be used to match products for this crop.</p>
          <div className="auth-actions">
            <Link className="btn btn-primary" to="/farmer/recommendations">View recommendations</Link>
            <Link className="btn btn-secondary" to="/farmer/dashboard">Return to dashboard</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell questionnaire-shell">
      <section className="section-header questionnaire-heading">
        <div>
          <span className="eyebrow">Crop assessment</span>
          <h2>{crop?.name || 'Questionnaire'}</h2>
          <p className="section-description">{crop?.description}</p>
        </div>
        <Link className="btn btn-secondary" to="/farmer/crop"><ArrowLeft size={16} /> Change crop</Link>
      </section>

      {questions.length === 0 ? (
        <section className="panel empty-state">No active questions are available for this crop yet.</section>
      ) : (
        <section className="panel questionnaire-panel">
          <div className="questionnaire-progress">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <div className="progress-track" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={questions.length}>
              <span style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          {question && (
            <div className="question-card questionnaire-card">
              {question.category && <span className="question-category">{question.category}</span>}
              <h3>{question.questionText}{question.required && <span className="required-mark" aria-label="required"> *</span>}</h3>
              {renderQuestionControl()}
            </div>
          )}

          {error && <div className="feedback error" role="alert">{error}</div>}

          <div className="questionnaire-actions">
            <button className="btn btn-secondary" type="button" onClick={() => { setError(''); setCurrentIndex((index) => Math.max(index - 1, 0)); }} disabled={currentIndex === 0}>
              <ArrowLeft size={16} /> Previous
            </button>
            {currentIndex < questions.length - 1 ? (
              <button className="btn btn-primary" type="button" onClick={goNext}>Next question <ArrowRight size={16} /></button>
            ) : (
              <button className="btn btn-primary" type="button" onClick={submitAnswers} disabled={submitting}>
                {submitting ? 'Saving answers...' : 'Submit questionnaire'}
              </button>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function ProductCard({ product }) {
  const cropNames = (product.applicableCrops || []).map((crop) => crop.name).filter(Boolean);

  return (
    <article className="product-card">
      {product.images?.[0] && <img src={product.images[0]} alt={product.name} loading="lazy" />}
      <div className="product-body">
        <div className="product-card-meta">
          <span>{product.category}</span>
          <span className={`availability ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {product.stock > 0 ? 'In stock' : 'Out of stock'}
          </span>
        </div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-facts">
          {cropNames.length > 0 && <span>For {cropNames.join(', ')}</span>}
          {product.retailer?.businessName && <span>{product.retailer.businessName}</span>}
        </div>
        {product.recommendationReason && <p className="recommendation-reason">{product.recommendationReason}</p>}
        <div className="price-row">
          <strong>₹{Number(product.price).toLocaleString('en-IN')}</strong>
          <span>per {product.unit || 'unit'}</span>
        </div>
        <Link
          className="btn btn-secondary product-detail-link"
          to={`/products/${product.id}`}
          state={product.recommendationReason ? { recommendationReason: product.recommendationReason } : undefined}
        >
          View details
        </Link>
      </div>
    </article>
  );
}

function FarmerProductsPage() {
  const [products, setProducts] = useState([]);
  const [crops, setCrops] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', crop: '', category: '', minPrice: '', maxPrice: '', availability: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/crops'), api.get('/categories')])
      .then(([cropResponse, categoryResponse]) => {
        if (!active) return;
        setCrops(cropResponse.data.crops || []);
        setCategories(categoryResponse.data.categories || []);
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load product filters.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError('');
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
      api.get('/products', { params })
        .then(({ data }) => { if (active) setProducts(data.products || []); })
        .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load products.'); })
        .finally(() => { if (active) setLoading(false); });
    }, filters.search ? 250 : 0);

    return () => { active = false; clearTimeout(timer); };
  }, [filters]);

  const updateFilter = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Farmer catalogue</span>
          <h2>Products for your farm</h2>
        </div>
      </section>

      <section className="catalog-toolbar" aria-label="Product filters">
        <label className="catalog-search"><Search size={17} aria-hidden="true" /><input name="search" value={filters.search} onChange={updateFilter} placeholder="Search products, crops or tags" aria-label="Search products" /></label>
        <label><span>Crop</span><select name="crop" value={filters.crop} onChange={updateFilter}><option value="">All crops</option>{crops.map((crop) => <option value={crop._id} key={crop._id}>{crop.name}</option>)}</select></label>
        <label><span>Category</span><select name="category" value={filters.category} onChange={updateFilter}><option value="">All categories</option>{categories.map((category) => <option value={category._id} key={category._id}>{category.name}</option>)}</select></label>
        <label><span>Min price</span><input type="number" name="minPrice" min="0" value={filters.minPrice} onChange={updateFilter} placeholder="₹0" /></label>
        <label><span>Max price</span><input type="number" name="maxPrice" min="0" value={filters.maxPrice} onChange={updateFilter} placeholder="No limit" /></label>
        <label><span>Availability</span><select name="availability" value={filters.availability} onChange={updateFilter}><option value="">All stock</option><option value="available">In stock</option><option value="unavailable">Out of stock</option></select></label>
      </section>

      {error && <div className="feedback error" role="alert">{error}</div>}
      {loading ? <div className="loader">Loading products...</div> : products.length === 0 ? (
        <div className="panel empty-state">No products match these filters.</div>
      ) : (
        <div className="card-grid product-grid">{products.map((product) => <ProductCard product={product} key={product.id} />)}</div>
      )}
    </main>
  );
}

function RecommendationsPage() {
  const [cropId, setCropId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadRecommendations = async () => {
      try {
        const { data: profileData } = await api.get('/farmer/profile');
        const selectedCropId = profileData.user.selectedCropId?.toString();
        if (!selectedCropId) {
          if (active) setData({ recommendations: [], message: 'Select a crop and complete its questionnaire first.' });
          return;
        }
        const { data: recommendationData } = await api.get(`/recommendations/${selectedCropId}`);
        if (active) {
          setCropId(selectedCropId);
          setData(recommendationData);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Unable to load recommendations.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadRecommendations();
    return () => { active = false; };
  }, []);

  if (loading) return <div className="page-shell loader">Analyzing your crop answers...</div>;
  const emptyTitle = data?.answerSummary
    ? 'No matching products are currently available.'
    : data?.message?.startsWith('Complete')
      ? 'Questionnaire answers needed'
      : 'Select a crop to continue';

  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Based on your farm answers</span>
          <h2>{data?.crop?.name ? `${data.crop.name} recommendations` : 'Recommended products'}</h2>
        </div>
        {cropId && <Link className="btn btn-secondary" to={`/farmer/questions/${cropId}`}>Review answers</Link>}
      </section>

      {error && <div className="feedback error" role="alert">{error}</div>}
      {data?.answerSummary && (
        <section className="panel answer-summary">
          <h3>Questionnaire summary</h3>
          <p>{data.answerSummary.answeredCount} answers analyzed</p>
          <div className="answer-summary-grid">
            {Object.entries(data.answerSummary.farmingConditions || {}).map(([category, values]) => (
              <div key={category}><strong>{category}</strong><span>{values.join(', ')}</span></div>
            ))}
          </div>
        </section>
      )}

      {!error && (data?.recommendations || []).length === 0 ? (
        <div className="panel empty-state recommendation-empty">
          <h3>{emptyTitle}</h3>
          <p>{data?.message || 'Try the product catalogue or update your questionnaire answers.'}</p>
          <Link className="btn btn-secondary" to="/farmer/products">Browse all products</Link>
        </div>
      ) : (
        <div className="card-grid product-grid">{(data?.recommendations || []).map((product) => <ProductCard product={product} key={product.id} />)}</div>
      )}
    </main>
  );
}

function ProductDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartError, setCartError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    let active = true;
    api.get(`/products/${id}`)
      .then(({ data }) => { if (active) setProduct(data.product); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load product details.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="page-shell loader">Loading product details...</div>;
  if (error || !product) return <main className="page-shell"><div className="feedback error" role="alert">{error || 'Product not found.'}</div><Link className="btn btn-secondary" to="/farmer/products">Back to products</Link></main>;

  const cropNames = (product.applicableCrops || []).map((crop) => crop.name).filter(Boolean);
  const addToCart = async () => {
    setAddingToCart(true);
    setCartError('');
    try {
      await api.post('/cart/add', { productId: product.id, quantity: 1 });
      navigate('/cart');
    } catch (err) {
      setCartError(err.response?.data?.message || 'Unable to add this product to your cart.');
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <main className="page-shell product-detail-page">
      <section className="section-header">
        <div><span className="eyebrow">{product.category}</span><h2>{product.name}</h2></div>
        <Link className="btn btn-secondary" to="/farmer/products">Back to products</Link>
      </section>
      <div className="detail-layout">
        <div className="detail-gallery">
          {(product.images || []).map((image, index) => <img className="detail-image" src={image} alt={`${product.name} ${index + 1}`} key={image} />)}
        </div>
        <div className="detail-content">
          <span className={`availability ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>{product.stock > 0 ? `${product.stock} ${product.unit || 'units'} available` : 'Out of stock'}</span>
          <p>{product.description}</p>
          <div className="price-box">₹{Number(product.price).toLocaleString('en-IN')} <small>per {product.unit || 'unit'}</small></div>
          {location.state?.recommendationReason && <p className="recommendation-reason">{location.state.recommendationReason}</p>}
          <div className="meta-grid">
            <div><strong>Applicable crops</strong><span>{cropNames.join(', ') || 'Not specified'}</span></div>
            <div><strong>Brand</strong><span>{product.brand || 'Not specified'}</span></div>
            <div><strong>Usage</strong><span>{product.usage || 'See product label'}</span></div>
            <div><strong>Retailer</strong><span>{product.retailer?.businessName || product.retailer?.name || 'Not listed'}</span></div>
            {product.retailer?.businessCategory && <div><strong>Retailer type</strong><span>{product.retailer.businessCategory}</span></div>}
            {(product.retailer?.city || product.retailer?.state) && <div><strong>Location</strong><span>{[product.retailer.city, product.retailer.state].filter(Boolean).join(', ')}</span></div>}
          </div>
          {product.benefits?.length > 0 && <div className="product-benefits"><h3>Benefits</h3><ul>{product.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul></div>}
          {product.tags?.length > 0 && <div className="product-tags">{product.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
          {cartError && <div className="feedback error" role="alert">{cartError}</div>}
          <button className="btn btn-primary" type="button" onClick={addToCart} disabled={addingToCart || product.stock <= 0}>
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </main>
  );
}

function CartPage() {
  const [cart, setCart] = useState({ items: [] });

  const fetchCart = () => {
    api.get('/cart').then(({ data }) => setCart(data.cart || { items: [] })).catch(() => setCart({ items: [] }));
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const total = cart.items.reduce((sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 0), 0);

  const updateQuantity = async (productId, quantity) => {
    await api.patch('/cart/update', { productId, quantity });
    fetchCart();
  };

  const removeItem = async (productId) => {
    await api.delete(`/cart/${productId}`);
    fetchCart();
  };

  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Cart</span>
          <h2>Your selected products</h2>
        </div>
        <Link className="btn btn-primary" to="/checkout">Proceed to checkout</Link>
      </section>

      <div className="cart-layout">
        <div className="panel list-stack">
          {cart.items.length === 0 ? <p>No products in your cart.</p> : cart.items.map((item) => (
            <div key={item.productId} className="cart-item">
              <div>
                <strong>{item.product?.name}</strong>
                <p>₹{item.product?.price} each</p>
              </div>
              <div className="cart-controls">
                <button onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
              </div>
              <button className="btn btn-secondary btn-small" onClick={() => removeItem(item.productId)}>Remove</button>
            </div>
          ))}
        </div>

        <aside className="panel summary-panel">
          <h3>Order summary</h3>
          <div className="summary-line"><span>Subtotal</span><strong>₹{total}</strong></div>
          <div className="summary-line"><span>Delivery</span><strong>₹120</strong></div>
          <div className="summary-line total"><span>Total</span><strong>₹{total + 120}</strong></div>
          <Link className="btn btn-primary full-width" to="/checkout">Checkout</Link>
        </aside>
      </div>
    </main>
  );
}

function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [farmer, setFarmer] = useState(getStoredUser());
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [farmAddress, setFarmAddress] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutKey] = useState(() => {
    const existingKey = sessionStorage.getItem('kisanmitra_checkout_key');
    if (existingKey) return existingKey;
    const newKey = window.crypto?.randomUUID?.() || `checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem('kisanmitra_checkout_key', newKey);
    return newKey;
  });

  useEffect(() => {
    let active = true;
    const pendingOrderId = sessionStorage.getItem('kisanmitra_pending_order');
    Promise.all([
      api.get('/cart'),
      api.get('/farmer/profile'),
      pendingOrderId ? api.get(`/orders/${pendingOrderId}`).catch(() => null) : Promise.resolve(null)
    ])
      .then(([cartResponse, profileResponse, orderResponse]) => {
        if (!active) return;
        const profile = profileResponse.data.user;
        setCart(cartResponse.data.cart || { items: [] });
        setFarmer(profile);
        setDeliveryAddress(profile.homeAddress || '');
        setFarmAddress(profile.farmAddress || '');
        if (orderResponse?.data.order) setOrder(orderResponse.data.order);
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load checkout.'); })
      .finally(() => { if (active) setPageLoading(false); });
    return () => { active = false; };
  }, []);

  const subtotal = cart.items.reduce((sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 0), 0);
  const displayedTotal = order?.amount ?? subtotal + 120;

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      let activeOrder = order;
      if (!activeOrder) {
        const { data } = await api.post('/orders/create', { checkoutKey, deliveryAddress, farmAddress });
        activeOrder = data.order;
        setOrder(activeOrder);
        sessionStorage.setItem('kisanmitra_pending_order', activeOrder.id);
      }
      if (activeOrder.paymentStatus === 'PAID') {
        navigate(`/payments/result/${activeOrder.id}`);
        return;
      }
      await startRazorpayPayment(activeOrder.id);
      navigate(`/payments/result/${activeOrder.id}`);
    } catch (err) {
      const savedOrderId = order?.id || sessionStorage.getItem('kisanmitra_pending_order');
      if (savedOrderId) {
        try {
          const { data } = await api.get(`/orders/${savedOrderId}`);
          setOrder(data.order);
        } catch {
          // Preserve the initiating error if status refresh is unavailable.
        }
      }
      setError(err.response?.data?.message || err.message || 'Unable to start payment. Your order remains unpaid.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="page-shell loader">Loading checkout...</div>;

  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Checkout</span>
          <h2>Review and pay</h2>
        </div>
      </section>

      <div className="checkout-layout">
        <div className="panel">
          <h3>Customer information</h3>
          <div className="info-grid">
            <div><strong>Name</strong><span>{farmer?.name || 'Farmer'}</span></div>
            <div><strong>Mobile</strong><span>{farmer?.mobile || 'Not provided'}</span></div>
            <div><strong>Email</strong><span>{farmer?.email || 'Not provided'}</span></div>
          </div>
          <label className="checkout-address">Delivery address<input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} required /></label>
          <label className="checkout-address">Farm address<input value={farmAddress} onChange={(event) => setFarmAddress(event.target.value)} /></label>
        </div>

        <div className="panel">
          <h3>Order summary</h3>
          {cart.items.map((item) => (
            <div key={item.productId} className="summary-line">
              <span>{item.product?.name} × {item.quantity}</span>
              <strong>₹{(item.product?.price || 0) * item.quantity}</strong>
            </div>
          ))}
          <div className="summary-line"><span>Delivery</span><strong>₹{order?.deliveryFee ?? 120}</strong></div>
          <div className="summary-line total"><span>Total</span><strong>₹{displayedTotal}</strong></div>
          {order && <div className="summary-line"><span>Order</span><strong>{order.orderNumber}</strong></div>}
        </div>
      </div>

      {error && <div className="feedback error" role="alert">{error}</div>}
      {!order && cart.items.length === 0 && <div className="feedback error">Your cart is empty.</div>}
      <div className="action-row">
        <button className="btn btn-primary" onClick={handlePayment} disabled={loading || (!order && cart.items.length === 0) || !deliveryAddress.trim()}>
          {loading ? 'Opening secure checkout...' : order ? (order.paymentStatus === 'FAILED' ? 'Retry Payment' : 'Pay Now') : 'Create Order and Pay'}
        </button>
      </div>
    </main>
  );
}

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    api.get('/orders/my').then(({ data }) => setOrders(data.orders || [])).catch(() => setOrders([]));
  }, []);

  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Orders</span>
          <h2>My orders</h2>
        </div>
      </section>
      <div className="list-stack">
        {orders.length === 0 ? <div className="panel">No orders found.</div> : orders.map((order) => (
          <div className="panel order-row" key={order.id}>
            <div>
              <strong>{order.id}</strong>
              <p>{order.deliveryAddress}</p>
            </div>
            <div className="order-status-stack">
              <span className="pill blue">{order.orderStatus}</span>
              <span className={`pill ${order.paymentStatus === 'PAID' ? 'green' : 'amber'}`}>{order.paymentStatus}</span>
            </div>
            <Link className="btn btn-secondary btn-small" to={`/orders/${order.id}`}>View</Link>
          </div>
        ))}
      </div>
    </main>
  );
}

function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order)).catch((err) => setError(err.response?.data?.message || 'Unable to load order.'));
  }, [id]);

  if (!order && !error) return <div className="page-shell loader">Loading order details...</div>;
  if (error) return <main className="page-shell"><div className="feedback error" role="alert">{error}</div><Link className="btn btn-secondary" to="/orders">Back to orders</Link></main>;

  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Order</span>
          <h2>{order.id}</h2>
        </div>
      </section>
      <div className="panel">
        <div className="info-grid">
          <div><strong>Status</strong><span>{order.orderStatus}</span></div>
          <div><strong>Payment</strong><span>{order.paymentStatus}</span></div>
          <div><strong>Retailer</strong><span>{order.retailerName}</span></div>
          <div><strong>Delivery</strong><span>{order.deliveryStatus}</span></div>
          <div><strong>Payment ID</strong><span>{order.paymentId || 'Not paid'}</span></div>
          <div><strong>Payment amount</strong><span>₹{Number(order.amount).toLocaleString('en-IN')}</span></div>
          <div><strong>Payment date</strong><span>{order.paidAt ? new Date(order.paidAt).toLocaleString() : 'Not paid'}</span></div>
          <div><strong>Payment method</strong><span>{order.paymentMethod || 'Not paid'}</span></div>
        </div>
        {order.paymentStatus !== 'PAID' && order.orderStatus !== 'CANCELLED' && (
          <Link className="btn btn-primary order-pay-link" to={`/payments/result/${order.id}`}>
            {order.paymentStatus === 'FAILED' ? 'Retry Payment' : 'Pay Now'}
          </Link>
        )}
      </div>
    </main>
  );
}

function PaymentResultPage() {
  const { orderId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const loadStatus = async () => {
    setError('');
    try {
      const { data: paymentData } = await api.get(`/payments/order/${orderId}`);
      setData(paymentData);
      if (paymentData.order.paymentStatus === 'PAID') {
        sessionStorage.removeItem('kisanmitra_pending_order');
        sessionStorage.removeItem('kisanmitra_checkout_key');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load payment status.');
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => { loadStatus(); }, [orderId]);

  const startPayment = async () => {
    setChecking(true);
    setError('');
    try {
      await startRazorpayPayment(orderId);
      await loadStatus();
    } catch (err) {
      await loadStatus();
      setError(err.response?.data?.message || err.message || 'Unable to start payment.');
      setChecking(false);
    }
  };

  if (loading) return <div className="page-shell loader">Checking payment status...</div>;
  if (error && !data) return <main className="page-shell"><div className="feedback error" role="alert">{error}</div><Link className="btn btn-secondary" to="/orders">Back to orders</Link></main>;

  const order = data.order;
  const payment = data.payment;
  const isPaid = order.paymentStatus === 'PAID';
  const isFailed = !isPaid && (order.paymentStatus === 'FAILED' || payment?.status === 'FAILED');

  return (
    <main className="page-shell payment-result-shell">
      <section className={`panel payment-result ${isPaid ? 'payment-success' : isFailed ? 'payment-failure' : 'payment-pending'}`}>
        <span className="eyebrow">Order {order.orderNumber}</span>
        <h2>{isPaid ? 'Payment successful' : isFailed ? 'Payment failed' : 'Payment pending'}</h2>
        <p>{isPaid ? 'Your payment has been verified by the server.' : isFailed ? (payment?.failureReason || 'The order has not been paid. You can retry this payment.') : 'The order is not marked paid. Check status or continue test checkout.'}</p>
        <div className="payment-result-facts">
          <div><strong>Order number</strong><span>{order.orderNumber}</span></div>
          <div><strong>Amount</strong><span>₹{Number(order.amount).toLocaleString('en-IN')}</span></div>
          <div><strong>Order status</strong><span>{order.orderStatus}</span></div>
          <div><strong>Payment status</strong><span>{order.paymentStatus}</span></div>
          {payment?.razorpayPaymentId && <div><strong>Payment ID</strong><span>{payment.razorpayPaymentId}</span></div>}
          {(order.paidAt || payment?.createdAt) && <div><strong>Date</strong><span>{new Date(order.paidAt || payment.createdAt).toLocaleString()}</span></div>}
          {payment?.method && <div><strong>Method</strong><span>{payment.method}</span></div>}
        </div>
        {error && <div className="feedback error" role="alert">{error}</div>}
        <div className="auth-actions payment-result-actions">
          {isPaid ? (
            <Link className="btn btn-primary" to={`/orders/${order.id}`}>View Order</Link>
          ) : order.orderStatus !== 'CANCELLED' ? (
            <>
              <button className="btn btn-primary" type="button" onClick={startPayment} disabled={checking}>
                {checking ? 'Opening checkout...' : isFailed ? 'Retry Payment' : 'Pay Now'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => { setChecking(true); loadStatus(); }} disabled={checking}>Check Status</button>
              <Link className="btn btn-secondary" to={`/orders/${order.id}`}>Back to Order</Link>
            </>
          ) : <Link className="btn btn-secondary" to={`/orders/${order.id}`}>Back to Order</Link>}
        </div>
      </section>
    </main>
  );
}

function RetailerRegistrationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/retailer/register', form);
      setStoredAuth(data.user, data.token);
      navigate('/retailer/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to register retailer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell auth-shell">
      <div className="auth-card">
        <div className="auth-header"><div className="brand-badge"><Store size={18} /></div><h2>Retailer Registration</h2><p>Your account will remain pending review.</p></div>
        <form className="auth-form" onSubmit={submit}>
          <label>Owner/contact name<input name="name" value={form.name} onChange={change} required /></label>
          <label>Email<input type="email" name="email" value={form.email} onChange={change} required /></label>
          <label>Mobile<input type="tel" name="mobile" value={form.mobile} onChange={change} pattern="[0-9]{10}" minLength={10} maxLength={10} required /></label>
          <label>Password<input type="password" name="password" value={form.password} onChange={change} minLength={8} required /></label>
          <label>Confirm password<input type="password" name="confirmPassword" value={form.confirmPassword} onChange={change} minLength={8} required /></label>
          {error && <div className="feedback error" role="alert">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create retailer account'}</button>
        </form>
        <div className="auth-links"><Link to="/retailer/login">Already registered? Sign in</Link><Link to="/login">Farmer portal</Link></div>
      </div>
    </main>
  );
}

function DeliveryDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  useEffect(() => {
    api.get('/delivery/dashboard').then(({ data }) => setDeliveries(data.deliveries || [])).catch(() => setDeliveries([]));
  }, []);

  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Delivery partner</span>
          <h2>Assigned deliveries</h2>
        </div>
      </section>
      <div className="list-stack">
        {deliveries.length === 0 ? <div className="panel">No assigned deliveries.</div> : deliveries.map((delivery) => (
          <div className="panel order-row" key={delivery.id}>
            <div>
              <strong>{delivery.id}</strong>
              <p>{delivery.pickupLocation} to {delivery.deliveryLocation}</p>
            </div>
            <span className="pill amber">{delivery.status}</span>
          </div>
        ))}
      </div>
    </main>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({ farmers: 0, retailers: 0, deliveryPartners: 0, products: 0, orders: 0, revenue: 0 });
  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data.totals || {})).catch(() => setStats({ farmers: 0, retailers: 0, deliveryPartners: 0, products: 0, orders: 0, revenue: 0 }));
  }, []);

  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Admin</span>
          <h2>System overview</h2>
        </div>
      </section>
      <div className="stats-grid">
        <StatCard label="Farmers" value={stats.farmers || 0} />
        <StatCard label="Retailers" value={stats.retailers || 0} />
        <StatCard label="Delivery partners" value={stats.deliveryPartners || 0} />
        <StatCard label="Products" value={stats.products || 0} />
        <StatCard label="Orders" value={stats.orders || 0} />
        <StatCard label="Revenue" value={`₹${stats.revenue || 0}`} tone="amber" />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<FarmerLoginPage />} />
          <Route path="/register" element={<FarmerRegisterPage />} />
          <Route path="/retailer/login" element={<RoleAuthPage role="retailer" label="Retailer Login" />} />
          <Route path="/retailer/register" element={<RetailerRegistrationPage />} />
          <Route path="/delivery/login" element={<RoleAuthPage role="delivery" label="Delivery Partner Login" />} />
          <Route path="/admin/login" element={<RoleAuthPage role="admin" label="Admin Login" />} />

          <Route path="/farmer/profile" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerProfilePage /></ProtectedRoute>} />
          <Route path="/farmer/dashboard" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerDashboard /></ProtectedRoute>} />
          <Route path="/farmer/crop" element={<ProtectedRoute allowedRoles={['farmer']}><CropSelectionPage /></ProtectedRoute>} />
          <Route path="/farmer/questions/:cropId" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerQuestionnairePage /></ProtectedRoute>} />
          <Route path="/farmer/products" element={<ProtectedRoute allowedRoles={['farmer']}><FarmerProductsPage /></ProtectedRoute>} />
          <Route path="/farmer/recommendations" element={<ProtectedRoute allowedRoles={['farmer']}><RecommendationsPage /></ProtectedRoute>} />

          <Route path="/products/:id" element={<ProtectedRoute allowedRoles={['farmer']}><ProductDetailPage /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute allowedRoles={['farmer']}><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute allowedRoles={['farmer']}><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute allowedRoles={['farmer']}><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute allowedRoles={['farmer']}><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/payments/result/:orderId" element={<ProtectedRoute allowedRoles={['farmer']}><PaymentResultPage /></ProtectedRoute>} />

          <Route path="/retailer/dashboard" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerDashboardPage /></ProtectedRoute>} />
          <Route path="/retailer/profile" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerProfilePage /></ProtectedRoute>} />
          <Route path="/retailer/products" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerProductsPage /></ProtectedRoute>} />
          <Route path="/retailer/products/new" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerProductFormPage /></ProtectedRoute>} />
          <Route path="/retailer/products/:id/edit" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerProductFormPage /></ProtectedRoute>} />
          <Route path="/retailer/orders" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerOrdersPage /></ProtectedRoute>} />
          <Route path="/retailer/orders/:id" element={<ProtectedRoute allowedRoles={['retailer']}><RetailerOrderDetailsPage /></ProtectedRoute>} />
          <Route path="/delivery/dashboard" element={<ProtectedRoute allowedRoles={['delivery']}><DeliveryDashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
