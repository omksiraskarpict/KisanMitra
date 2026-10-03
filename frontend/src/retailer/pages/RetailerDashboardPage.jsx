import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

const emptyStats = {
  totalProducts: 0,
  activeProducts: 0,
  lowStockProducts: 0,
  pendingOrders: 0,
  ordersProcessing: 0,
  readyForPickup: 0,
  completedOrders: 0
};

function Stat({ label, value, tone }) {
  return <div className={`stat-card tone-${tone || 'green'}`}><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>;
}

export default function RetailerDashboardPage() {
  const [data, setData] = useState({ user: null, stats: emptyStats });
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/retailer/dashboard'), api.get('/retailer/orders')])
      .then(([dashboardResponse, orderResponse]) => {
        if (!active) return;
        setData(dashboardResponse.data);
        setOrders((orderResponse.data.orders || []).slice(0, 5));
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load retailer dashboard.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="page-shell loader">Loading retailer dashboard...</div>;

  const stats = { ...emptyStats, ...(data.stats || {}) };
  return (
    <main className="page-shell">
      <section className="section-header">
        <div>
          <span className="eyebrow">Retail workspace</span>
          <h2>{data.user?.businessName || data.user?.name || 'Retailer dashboard'}</h2>
          <span className={`pill ${data.user?.status === 'VERIFIED' ? 'green' : 'amber'}`}>{data.user?.status || 'PENDING'}</span>
        </div>
        <div className="auth-actions">
          <Link className="btn btn-secondary" to="/retailer/profile">Business profile</Link>
          <Link className="btn btn-primary" to="/retailer/products/new">Add product</Link>
        </div>
      </section>

      {error && <div className="feedback error" role="alert">{error}</div>}
      <div className="stats-grid retailer-stats-grid">
        <Stat label="Total products" value={stats.totalProducts} />
        <Stat label="Active products" value={stats.activeProducts} tone="blue" />
        <Stat label="Low stock" value={stats.lowStockProducts} tone="amber" />
        <Stat label="Pending orders" value={stats.pendingOrders} tone="amber" />
        <Stat label="Processing" value={stats.ordersProcessing} tone="blue" />
        <Stat label="Ready for pickup" value={stats.readyForPickup} />
        <Stat label="Completed orders" value={stats.completedOrders} tone="blue" />
      </div>

      <section className="panel retailer-recent-orders">
        <div className="section-header">
          <div><span className="eyebrow">Paid orders with your products</span><h3>Recent orders</h3></div>
          <Link to="/retailer/orders">All orders</Link>
        </div>
        {orders.length ? <div className="list-stack">{orders.map((order) => (
          <div className="list-item" key={order.id}>
            <div><strong>{order.orderNumber}</strong><p>{order.farmer?.name || 'Farmer'} · ₹{Number(order.retailerSubtotal).toLocaleString('en-IN')}</p></div>
            <span className="pill blue">{order.retailerStatus}</span>
            <Link to={`/retailer/orders/${order.id}`}>Open</Link>
          </div>
        ))}</div> : <p className="empty-copy">No paid orders contain your products yet.</p>}
      </section>
    </main>
  );
}
