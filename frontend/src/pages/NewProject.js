import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NewProject({ user }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    domain: '',
    requirements: [''],
    maxStudents: 1,
    deadline: '',
    availability: 'open'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) return <div className="page">Please log in.</div>;
  if (user.role !== 'faculty' && user.role !== 'admin') {
    return <div className="page">Only faculty/admin can create projects.</div>;
  }

  const updateReq = (idx, value) => {
    setForm(prev => ({
      ...prev,
      requirements: prev.requirements.map((r, i) => i === idx ? value : r)
    }));
  };

  const addReq = () => setForm(prev => ({ ...prev, requirements: [...prev.requirements, ''] }));
  const removeReq = (idx) => setForm(prev => ({ ...prev, requirements: prev.requirements.filter((_, i) => i !== idx) }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.description.trim() || !form.domain.trim()) {
      setError('Title, Description and Domain are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        domain: form.domain.trim(),
        requirements: form.requirements.filter(r => r.trim()).map(r => r.trim()),
        maxStudents: Number(form.maxStudents) || 1,
        deadline: form.deadline ? new Date(form.deadline) : undefined,
        faculty: user.id,
        availability: form.availability || 'open',
      };
      const res = await fetch('http://localhost:5001/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to create project');
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <h2 className="page-title">Create New Project</h2>
      <form className="card" onSubmit={onSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="form-group">
          <label>Title</label>
          <input
            className="form-control"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            className="form-control"
            rows={5}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>Domain</label>
          <input
            className="form-control"
            value={form.domain}
            onChange={e => setForm({ ...form, domain: e.target.value })}
            placeholder="e.g., NLP, CV, HCI"
            required
          />
        </div>

        <div className="form-group">
          <label>Requirements</label>
          {form.requirements.map((req, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                className="form-control"
                value={req}
                onChange={e => updateReq(idx, e.target.value)}
                placeholder="e.g., Python, prior coursework"
              />
              <button type="button" className="btn btn-secondary" onClick={addReq}>+</button>
              {form.requirements.length > 1 && (
                <button type="button" className="btn btn-danger" onClick={() => removeReq(idx)}>-</button>
              )}
            </div>
          ))}
        </div>

        <div className="form-group">
          <label>Max Students</label>
          <input
            type="number"
            min={1}
            className="form-control"
            value={form.maxStudents}
            onChange={e => setForm({ ...form, maxStudents: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Deadline</label>
          <input
            type="date"
            className="form-control"
            value={form.deadline}
            onChange={e => setForm({ ...form, deadline: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Availability</label>
          <select
            className="form-control"
            value={form.availability || 'open'}
            onChange={e => setForm({ ...form, availability: e.target.value })}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <button disabled={submitting} className="btn btn-primary">
          {submitting ? 'Creating...' : 'Create Project'}
        </button>
      </form>
    </div>
  );
}
