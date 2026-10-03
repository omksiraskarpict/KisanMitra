import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function RetailerProductsPage() {
  const [products, setProducts] = useState([]);
  const [stockValues, setStockValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savingId, setSavingId] = useState('');

  const loadProducts = async () => {
    const { data } = await api.get('/retailer/products');
    setProducts(data.products || []);
    setStockValues(Object.fromEntries((data.products || []).map((product) => [product.id, String(product.stock)])));
  };

  useEffect(() => {
    let active = true;
    api.get('/retailer/products')
      .then(({ data }) => {
        if (!active) return;
        setProducts(data.products || []);
        setStockValues(Object.fromEntries((data.products || []).map((product) => [product.id, String(product.stock)])));
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load products.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const updateStock = async (productId) => {
    setSavingId(productId);
    setError('');
    setNotice('');
    try {
      await api.patch(`/retailer/products/${productId}/stock`, { stock: Number(stockValues[productId]) });
      await loadProducts();
      setNotice('Stock updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update stock.');
    } finally {
      setSavingId('');
    }
  };

  const deactivate = async (productId) => {
    setSavingId(productId);
    setError('');
    setNotice('');
    try {
      await api.delete(`/retailer/products/${productId}`);
      await loadProducts();
      setNotice('Product deactivated; historical order lines are preserved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to deactivate product.');
    } finally {
      setSavingId('');
    }
  };

  if (loading) return <div className="page-shell loader">Loading your products...</div>;

  return (
    <main className="page-shell">
      <section className="section-header">
        <div><span className="eyebrow">Retailer inventory</span><h2>Products</h2></div>
        <Link className="btn btn-primary" to="/retailer/products/new">Add product</Link>
      </section>
      {error && <div className="feedback error" role="alert">{error}</div>}
      {notice && <div className="feedback success" role="status">{notice}</div>}
      {products.length === 0 ? <section className="panel empty-state">No products in this retailer account yet.</section> : (
        <div className="retailer-product-list">
          {products.map((product) => (
            <article className="panel retailer-product-row" key={product.id}>
              {product.images?.[0] && <img src={product.images[0]} alt={product.name} />}
              <div className="retailer-product-info">
                <span className={`pill ${product.active ? 'green' : 'amber'}`}>{product.active ? 'Active' : 'Inactive'}</span>
                <h3>{product.name}</h3>
                <p>{product.category} · {(product.applicableCrops || []).map((crop) => crop.name).join(', ')}</p>
                <strong>₹{Number(product.price).toLocaleString('en-IN')} / {product.unit || 'unit'}</strong>
              </div>
              <div className="retailer-stock-control">
                <label>Stock ({product.unit || 'units'})<input type="number" min="0" step="1" value={stockValues[product.id] ?? product.stock} onChange={(event) => setStockValues((previous) => ({ ...previous, [product.id]: event.target.value }))} /></label>
                {product.stock <= 5 && <span className="pill amber">Low stock</span>}
                <button className="btn btn-secondary btn-small" onClick={() => updateStock(product.id)} disabled={savingId === product.id}>{savingId === product.id ? 'Saving...' : 'Update stock'}</button>
              </div>
              <div className="retailer-product-actions">
                <Link className="btn btn-secondary btn-small" to={`/retailer/products/${product.id}/edit`}>Edit</Link>
                {product.active && <button className="btn btn-secondary btn-small" onClick={() => deactivate(product.id)} disabled={savingId === product.id}>Deactivate</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
