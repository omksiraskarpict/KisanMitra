import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

const emptyProfile = {
  ownerName: '', businessName: '', businessAddress: '', mobile: '', email: '', gstin: '',
  businessDescription: '', businessType: '', city: '', state: '', pincode: ''
};

export default function RetailerProfilePage() {
  const [form, setForm] = useState(emptyProfile);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/retailer/profile')
      .then(({ data }) => {
        if (!active) return;
        setForm({ ...emptyProfile, ...data.profile });
        setStatus(data.profile.status || 'PENDING');
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load business profile.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setMessage('');
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put('/retailer/profile', form);
      setForm((previous) => ({ ...previous, ...data.profile }));
      setStatus(data.profile.status || status);
      setMessage('Business profile saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save business profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-shell loader">Loading business profile...</div>;

  return (
    <main className="page-shell">
      <section className="section-header">
        <div><span className="eyebrow">Retailer account</span><h2>Business profile</h2></div>
        <span className={`pill ${status === 'VERIFIED' ? 'green' : 'amber'}`}>{status}</span>
      </section>
      <form className="panel retailer-form" onSubmit={save}>
        <div className="info-grid">
          <label>Owner/contact name<input name="ownerName" value={form.ownerName} onChange={change} required /></label>
          <label>Business name<input name="businessName" value={form.businessName} onChange={change} required /></label>
          <label>Email<input type="email" name="email" value={form.email} onChange={change} required /></label>
          <label>Mobile<input type="tel" name="mobile" value={form.mobile} onChange={change} required /></label>
          <label>Business type<input name="businessType" value={form.businessType} onChange={change} placeholder="Agricultural inputs" /></label>
          <label>GSTIN<input name="gstin" value={form.gstin} onChange={change} maxLength={15} /></label>
          <label>City<input name="city" value={form.city} onChange={change} required /></label>
          <label>State<input name="state" value={form.state} onChange={change} required /></label>
          <label>Pincode<input name="pincode" value={form.pincode} onChange={change} required /></label>
        </div>
        <label>Business address<input name="businessAddress" value={form.businessAddress} onChange={change} required /></label>
        <label>Business description<textarea name="businessDescription" rows={4} value={form.businessDescription} onChange={change} /></label>
        {status === 'PENDING' && <p className="retailer-status-note">Your account remains pending review. Saving this profile does not change its verification status.</p>}
        {error && <div className="feedback error" role="alert">{error}</div>}
        {message && <div className="feedback success" role="status">{message}</div>}
        <div className="auth-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
          <Link className="btn btn-secondary" to="/retailer/dashboard">Dashboard</Link>
        </div>
      </form>
    </main>
  );
}
