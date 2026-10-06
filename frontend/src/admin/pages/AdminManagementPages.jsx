import { useEffect, useState } from 'react';
import { NavLink, Link, useParams } from 'react-router-dom';
import { BarChart3, Boxes, LayoutDashboard, Settings, ShoppingBag, Users } from 'lucide-react';
import api from '../../api';

const adminNavigation = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Products', path: '/admin/products', icon: ShoppingBag },
  { label: 'Inventory', path: '/admin/inventory', icon: Boxes },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: Settings }
];

export function AdminPageLayout({ children }) {
  return (
    <div className="admin-console">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar-heading"><span className="admin-sidebar-mark">KM</span><span>KisanMitra<br /><small>Administration</small></span></div>
        <nav>
          {adminNavigation.map(({ label, path, icon: Icon, end }) => (
            <NavLink key={path} to={path} end={end} className={({ isActive }) => `admin-sidebar-link${isActive ? ' active' : ''}`}>
              <Icon size={17} aria-hidden="true" /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-console-content">{children}</div>
    </div>
  );
}

export function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 25;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/admin/users', { params: { page, limit, role: role || undefined, status: status || undefined, search: submittedQuery || undefined } })
      .then(({ data }) => {
        if (!active) return;
        setUsers(data.users || []);
        setTotal(data.total || 0);
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load users.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, role, status, submittedQuery]);

  const updateStatus = async (user, nextStatus) => {
    setBusyId(user.id);
    setError('');
    try {
      await api.patch(`/admin/users/${user.id}/verify`, { status: nextStatus });
      setUsers((current) => current.map((entry) => entry.id === user.id
        ? { ...entry, status: nextStatus, accountStatus: nextStatus }
        : entry));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update user status.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <AdminPageLayout>
      <main className="page-shell admin-management-page">
        <header className="section-header"><div><span className="eyebrow">Administration</span><h2>Users</h2><p className="section-description">{total.toLocaleString('en-IN')} registered accounts</p></div></header>
        <form className="admin-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setSubmittedQuery(query.trim()); }}>
          <label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, mobile, business" /></label>
          <label>Role<select value={role} onChange={(event) => { setPage(1); setRole(event.target.value); }}><option value="">All roles</option><option value="farmer">Farmer</option><option value="retailer">Retailer</option><option value="delivery">Delivery</option><option value="admin">Admin</option></select></label>
          <label>Status<select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="VERIFIED">Verified</option><option value="REJECTED">Rejected</option></select></label>
          <button className="btn btn-primary" type="submit">Apply filters</button>
        </form>
        {error && <div className="feedback error" role="alert">{error}</div>}
        {loading ? <div className="loader">Loading users...</div> : error ? null : users.length ? (
          <div className="admin-record-list">
            {users.map((user) => (
              <article className="panel admin-record-card" key={user.id}>
                <div className="admin-record-primary"><strong>{user.name}</strong><span>{user.role}</span></div>
                <div><span>Email</span><strong>{user.email || 'Not provided'}</strong></div>
                <div><span>Mobile</span><strong>{user.mobile || 'Not provided'}</strong></div>
                <div><span>Region</span><strong>{[user.city, user.state].filter(Boolean).join(', ') || 'Not provided'}</strong></div>
                <div><span>Account status</span><strong className={`pill ${user.status === 'VERIFIED' ? 'green' : user.status === 'REJECTED' ? 'amber' : 'blue'}`}>{user.status || 'Unknown'}</strong></div>
                {['farmer', 'retailer', 'delivery'].includes(user.role) && user.status !== 'VERIFIED' && (
                  <div className="admin-record-actions">
                    <button type="button" className="btn btn-primary btn-small" disabled={busyId === user.id} onClick={() => updateStatus(user, 'VERIFIED')}>Verify</button>
                    {user.status !== 'REJECTED' && <button type="button" className="btn btn-secondary btn-small" disabled={busyId === user.id} onClick={() => updateStatus(user, 'REJECTED')}>Reject</button>}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : <div className="panel empty-state">No users match these filters.</div>}
        {!loading && total > limit && <div className="admin-pagination"><button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {Math.ceil(total / limit)}</span><button className="btn btn-secondary" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
      </main>
    </AdminPageLayout>
  );
}

export function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/admin/products', { params: { page, limit } })
      .then(({ data }) => {
        if (!active) return;
        setProducts(data.products || []);
        setTotal(data.total || 0);
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load products.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page]);

  const setProductActive = async (product) => {
    setBusyId(product.id || product._id);
    setError('');
    try {
      const { data } = await api.patch(`/admin/products/${product.id || product._id}`, { active: !product.active });
      setProducts((current) => current.map((entry) => (entry.id || entry._id) === (product.id || product._id) ? data.product : entry));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update product status.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <AdminPageLayout>
      <main className="page-shell admin-management-page">
        <header className="section-header"><div><span className="eyebrow">Administration</span><h2>Products</h2><p className="section-description">{total.toLocaleString('en-IN')} listed products</p></div></header>
        {error && <div className="feedback error" role="alert">{error}</div>}
        {loading ? <div className="loader">Loading products...</div> : error ? null : products.length ? (
          <div className="admin-record-list">
            {products.map((product) => (
              <article className="panel admin-product-card" key={product.id || product._id}>
                {(product.images?.[0] || product.image) && <img src={product.images?.[0] || product.image} alt="" />}
                <div className="admin-product-description"><strong>{product.name}</strong><span>{product.category?.name || product.category || 'Uncategorized'} · Sold by {product.retailer?.businessName || product.retailer?.name || 'Retailer'}</span><span>₹{Number(product.price || 0).toLocaleString('en-IN')} · Stock {product.stock ?? 0}</span></div>
                <span className={`pill ${product.active ? 'green' : 'amber'}`}>{product.active ? 'Active' : 'Inactive'}</span>
                <button type="button" className="btn btn-secondary btn-small" disabled={busyId === (product.id || product._id) || product.deleted} onClick={() => setProductActive(product)}>
                  {product.deleted ? 'Deleted' : product.active ? 'Deactivate' : 'Activate'}
                </button>
              </article>
            ))}
          </div>
        ) : <div className="panel empty-state">No products have been listed.</div>}
        {!loading && total > limit && <div className="admin-pagination"><button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {Math.ceil(total / limit)}</span><button className="btn btn-secondary" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
      </main>
    </AdminPageLayout>
  );
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [total, setTotal] = useState(0);
  const limit = 25;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/admin/orders', { params: { page, limit, orderStatus: orderStatus || undefined, paymentStatus: paymentStatus || undefined } })
      .then(({ data }) => {
        if (!active) return;
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load orders.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, orderStatus, paymentStatus]);

  return (
    <AdminPageLayout>
      <main className="page-shell admin-management-page">
        <header className="section-header"><div><span className="eyebrow">Administration</span><h2>Orders</h2><p className="section-description">{total.toLocaleString('en-IN')} orders</p></div></header>
        <div className="admin-filters">
          <label>Order status<select value={orderStatus} onChange={(event) => { setPage(1); setOrderStatus(event.target.value); }}><option value="">All statuses</option>{['ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label>
          <label>Payment status<select value={paymentStatus} onChange={(event) => { setPage(1); setPaymentStatus(event.target.value); }}><option value="">All payments</option>{['PENDING', 'PAID', 'FAILED', 'REFUNDED'].map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
        </div>
        {error && <div className="feedback error" role="alert">{error}</div>}
        {loading ? <div className="loader">Loading orders...</div> : error ? null : orders.length ? (
          <div className="admin-record-list">
            {orders.map((order) => (
              <article className="panel admin-order-card" key={order.id || order._id}>
                <div><span>Order</span><strong>{order.orderNumber || order.id}</strong></div>
                <div><span>Farmer</span><strong>{order.farmer?.name || 'Farmer'}</strong></div>
                <div><span>Placed</span><strong>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'Date unavailable'}</strong></div>
                <div><span>Order status</span><strong>{order.orderStatus}</strong></div>
                <div><span>Payment</span><strong>{order.paymentStatus}</strong></div>
                <strong>₹{Number(order.amount || 0).toLocaleString('en-IN')}</strong>
                <Link className="btn btn-secondary btn-small" to={`/admin/orders/${encodeURIComponent(order.id || order._id)}`}>View details</Link>
              </article>
            ))}
          </div>
        ) : <div className="panel empty-state">No orders match these filters.</div>}
        {!loading && total > limit && <div className="admin-pagination"><button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {Math.ceil(total / limit)}</span><button className="btn btn-secondary" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
      </main>
    </AdminPageLayout>
  );
}

export function AdminOrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/admin/orders/${encodeURIComponent(id)}`)
      .then(({ data }) => setOrder(data.order))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load order details.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AdminPageLayout>
      <main className="page-shell admin-management-page">
        {loading ? <div className="loader">Loading order...</div> : error ? <div className="feedback error" role="alert">{error}</div> : order && (
          <>
            <header className="section-header"><div><span className="eyebrow">Order detail</span><h2>{order.orderNumber}</h2></div><Link className="btn btn-secondary" to="/admin/orders">Back to orders</Link></header>
            <div className="order-detail-grid">
              <section className="panel"><h3>Items</h3>{(order.items || []).map((item) => <div className="order-item" key={item.productId || item.name}><div><strong>{item.name}</strong><p>Qty {item.quantity} · {order.retailerName || 'Retailer'}</p></div><strong>₹{(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('en-IN')}</strong></div>)}</section>
              <aside className="panel"><h3>Order summary</h3><div className="info-grid"><div><span>Farmer</span><strong>{order.farmer?.name || 'Farmer'}</strong></div><div><span>Payment</span><strong>{order.paymentStatus}</strong></div><div><span>Order status</span><strong>{order.orderStatus}</strong></div><div><span>Delivery status</span><strong>{order.deliveryStatus || 'Pending'}</strong></div><div><span>Delivery address</span><strong>{order.deliveryAddress || 'Not provided'}</strong></div><div><span>Amount</span><strong>₹{Number(order.amount || 0).toLocaleString('en-IN')}</strong></div></div></aside>
            </div>
          </>
        )}
      </main>
    </AdminPageLayout>
  );
}

export function AdminInventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/inventory-status')
      .then(({ data }) => setItems(data.data || data.lowStockItems || []))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load inventory status.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminPageLayout>
      <main className="page-shell admin-management-page">
        <header className="section-header"><div><span className="eyebrow">Stock monitoring</span><h2>Inventory alerts</h2><p className="section-description">Active products with stock at or below the low-stock threshold.</p></div></header>
        {error && <div className="feedback error" role="alert">{error}</div>}
        {loading ? <div className="loader">Loading inventory...</div> : error ? null : items.length ? (
          <div className="admin-record-list">
            {items.map((item) => <article className="panel admin-inventory-card" key={item._id}><div><strong>{item.name}</strong><span>{item.qty}</span></div><span className={`pill ${item.level === 'Critical' ? 'amber' : 'blue'}`}>{item.level}</span></article>)}
          </div>
        ) : <div className="panel empty-state">No active products currently need a stock alert.</div>}
      </main>
    </AdminPageLayout>
  );
}

export function AdminAccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load the administrator account.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminPageLayout>
      <main className="page-shell admin-management-page">
        <header className="section-header"><div><span className="eyebrow">Account</span><h2>Settings</h2></div></header>
        {error && <div className="feedback error" role="alert">{error}</div>}
        {loading ? <div className="loader">Loading account...</div> : user && <section className="panel admin-account-card"><div><span>Name</span><strong>{user.name}</strong></div><div><span>Email</span><strong>{user.email}</strong></div><div><span>Role</span><strong>{user.role}</strong></div><p>Account details are read from your authenticated admin profile.</p></section>}
      </main>
    </AdminPageLayout>
  );
}
