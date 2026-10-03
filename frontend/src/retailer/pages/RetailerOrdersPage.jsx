import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api';

export default function RetailerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/retailer/orders')
      .then(({ data }) => { if (active) setOrders(data.orders || []); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load retailer orders.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="page-shell loader">Loading retailer orders...</div>;

  return (
    <main className="page-shell">
      <section className="section-header"><div><span className="eyebrow">Paid orders with your products</span><h2>Orders</h2></div></section>
      {error && <div className="feedback error" role="alert">{error}</div>}
      {orders.length === 0 ? <section className="panel empty-state">No paid orders contain your products yet.</section> : (
        <div className="list-stack">{orders.map((order) => (
          <article className="panel retailer-order-row" key={order.id}>
            <div><strong>{order.orderNumber}</strong><p>{order.farmer?.name || 'Farmer'} · {order.farmer?.mobile || 'No phone listed'}</p></div>
            <div><strong>₹{Number(order.retailerSubtotal).toLocaleString('en-IN')}</strong><p>{order.items.length} product line(s)</p></div>
            <span className="pill blue">{order.retailerStatus}</span>
            <span className="pill green">{order.paymentStatus}</span>
            <Link className="btn btn-secondary btn-small" to={`/retailer/orders/${order.id}`}>Details</Link>
          </article>
        ))}</div>
      )}
    </main>
  );
}

export function RetailerOrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadOrder = async () => {
    const { data } = await api.get(`/retailer/orders/${id}`);
    setOrder(data.order);
  };

  useEffect(() => {
    let active = true;
    api.get(`/retailer/orders/${id}`)
      .then(({ data }) => { if (active) setOrder(data.order); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load this order.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const nextStatus = { ORDER_PLACED: 'CONFIRMED', CONFIRMED: 'PROCESSING', PROCESSING: 'READY_FOR_PICKUP' }[order?.retailerStatus];
  const statusAction = { CONFIRMED: 'Confirm order', PROCESSING: 'Start processing', READY_FOR_PICKUP: 'Mark ready for pickup' }[nextStatus];

  const updateStatus = async () => {
    if (!nextStatus) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put(`/retailer/orders/${id}/status`, { status: nextStatus });
      setOrder(data.order);
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update order status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-shell loader">Loading order details...</div>;
  if (error && !order) return <main className="page-shell"><div className="feedback error" role="alert">{error}</div><Link className="btn btn-secondary" to="/retailer/orders">Back to orders</Link></main>;

  return (
    <main className="page-shell">
      <section className="section-header">
        <div><span className="eyebrow">Retailer fulfillment</span><h2>{order.orderNumber}</h2></div>
        <Link className="btn btn-secondary" to="/retailer/orders">Back to orders</Link>
      </section>
      <section className="panel retailer-order-summary">
        <div className="info-grid">
          <div><strong>Farmer</strong><span>{order.farmer?.name || 'Farmer'}</span></div>
          <div><strong>Contact</strong><span>{order.farmer?.mobile || 'Not provided'}</span></div>
          <div><strong>Payment</strong><span>{order.paymentStatus}</span></div>
          <div><strong>Your status</strong><span>{order.retailerStatus}</span></div>
          <div><strong>Your subtotal</strong><span>₹{Number(order.retailerSubtotal).toLocaleString('en-IN')}</span></div>
          <div><strong>Order date</strong><span>{new Date(order.createdAt).toLocaleString()}</span></div>
          <div><strong>Pickup address</strong><span>{order.pickupAddress || 'Business address not set'}</span></div>
          <div><strong>Farmer delivery address</strong><span>{order.deliveryAddress || 'Not provided'}</span></div>
        </div>
      </section>

      <section className="panel retailer-order-lines">
        <h3>Your products in this order</h3>
        <div className="list-stack">{order.items.map((item, index) => (
          <div className="list-item" key={`${item.productId}-${index}`}>
            <div><strong>{item.name}</strong><p>Quantity {item.quantity} · ₹{Number(item.price).toLocaleString('en-IN')} each</p></div>
            <strong>₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}</strong>
          </div>
        ))}</div>
      </section>

      <section className="panel retailer-order-timeline">
        <h3>Retailer status timeline</h3>
        {order.statusHistory?.length ? <ol>{order.statusHistory.map((entry, index) => (
          <li key={`${entry.status}-${entry.timestamp}-${index}`}><strong>{entry.status}</strong><span>{new Date(entry.timestamp).toLocaleString()}</span></li>
        ))}</ol> : <p>No status updates recorded.</p>}
      </section>

      {error && <div className="feedback error" role="alert">{error}</div>}
      {message && <div className="feedback success" role="status">{message}</div>}
      {statusAction && order.paymentStatus === 'PAID' && (
        <div className="action-row"><button className="btn btn-primary" onClick={updateStatus} disabled={saving}>{saving ? 'Updating...' : statusAction}</button></div>
      )}
      {!statusAction && order.retailerStatus === 'READY_FOR_PICKUP' && <div className="pill green">Parcel ready for pickup</div>}
    </main>
  );
}
