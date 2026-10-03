import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api';

const blankProduct = {
  name: '', description: '', categoryId: '', applicableCrops: [], usage: '', benefits: [],
  price: '', unit: '', stock: '', brand: '', tags: [], recommendationTags: [], images: [], active: true
};

const splitList = (text) => String(text || '').split(/[,\n]/).map((value) => value.trim()).filter(Boolean);

export default function RetailerProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(blankProduct);
  const [categories, setCategories] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const requests = [api.get('/categories'), api.get('/crops')];
    if (id) requests.push(api.get(`/retailer/products/${id}`));
    Promise.all(requests)
      .then((responses) => {
        if (!active) return;
        setCategories(responses[0].data.categories || []);
        setCrops(responses[1].data.crops || []);
        if (id) {
          const product = responses[2].data.product;
          setForm({
            ...blankProduct,
            ...product,
            categoryId: product.categoryId?._id || product.categoryId || '',
            applicableCrops: (product.applicableCrops || []).map((crop) => crop._id || crop),
            benefits: product.benefits || [],
            tags: product.tags || [],
            recommendationTags: product.recommendationTags || [],
            images: product.images || []
          });
        }
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load product form.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleCrop = (cropId) => {
    setForm((previous) => ({
      ...previous,
      applicableCrops: previous.applicableCrops.includes(cropId)
        ? previous.applicableCrops.filter((value) => value !== cropId)
        : [...previous.applicableCrops, cropId]
    }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      benefits: Array.isArray(form.benefits) ? form.benefits : splitList(form.benefits),
      tags: Array.isArray(form.tags) ? form.tags : splitList(form.tags),
      recommendationTags: Array.isArray(form.recommendationTags) ? form.recommendationTags : splitList(form.recommendationTags),
      images: Array.isArray(form.images) ? form.images : splitList(form.images)
    };
    try {
      if (id) await api.put(`/retailer/products/${id}`, payload);
      else await api.post('/retailer/products', payload);
      navigate('/retailer/products');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-shell loader">Loading product...</div>;

  return (
    <main className="page-shell">
      <section className="section-header">
        <div><span className="eyebrow">Retailer inventory</span><h2>{id ? 'Edit product' : 'Add product'}</h2></div>
        <Link className="btn btn-secondary" to="/retailer/products">Back to products</Link>
      </section>
      <form className="panel auth-form retailer-form" onSubmit={save}>
        <div className="info-grid">
          <label>Product name<input name="name" value={form.name} onChange={change} required /></label>
          <label>Category<select name="categoryId" value={form.categoryId} onChange={change} required><option value="">Select category</option>{categories.map((category) => <option value={category._id} key={category._id}>{category.name}</option>)}</select></label>
          <label>Price<input type="number" name="price" min="0" step="0.01" value={form.price} onChange={change} required /></label>
          <label>Unit<input name="unit" value={form.unit} onChange={change} required placeholder="Bag, bottle, pack" /></label>
          <label>Stock<input type="number" name="stock" min="0" step="1" value={form.stock} onChange={change} required /></label>
          <label>Brand<input name="brand" value={form.brand} onChange={change} /></label>
        </div>
        <label>Description<textarea name="description" rows={3} value={form.description} onChange={change} required /></label>
        <label>Applicable crops</label>
        <div className="retailer-crop-options">{crops.map((crop) => (
          <label className="question-choice" key={crop._id}><input type="checkbox" checked={form.applicableCrops.includes(crop._id)} onChange={() => toggleCrop(crop._id)} /><span>{crop.name}</span></label>
        ))}</div>
        <label>Usage<textarea name="usage" rows={2} value={form.usage} onChange={change} /></label>
        <label>Benefits (comma separated)<input value={form.benefits.join(', ')} onChange={(event) => setForm((previous) => ({ ...previous, benefits: splitList(event.target.value) }))} /></label>
        <label>Tags (comma separated)<input value={form.tags.join(', ')} onChange={(event) => setForm((previous) => ({ ...previous, tags: splitList(event.target.value) }))} /></label>
        <label>Recommendation tags (comma separated)<input value={form.recommendationTags.join(', ')} onChange={(event) => setForm((previous) => ({ ...previous, recommendationTags: splitList(event.target.value) }))} /></label>
        <label>Image URLs (comma separated)<textarea rows={2} value={form.images.join(', ')} onChange={(event) => setForm((previous) => ({ ...previous, images: splitList(event.target.value) }))} /></label>
        {id && <label className="retailer-active-toggle"><input type="checkbox" name="active" checked={Boolean(form.active)} onChange={change} /> Active product</label>}
        {error && <div className="feedback error" role="alert">{error}</div>}
        <div className="auth-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : id ? 'Save changes' : 'Create product'}</button>
          <Link className="btn btn-secondary" to="/retailer/products">Cancel</Link>
        </div>
      </form>
    </main>
  );
}
