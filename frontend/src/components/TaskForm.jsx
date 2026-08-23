import { useState } from 'react';
import './TaskForm.css';

function TaskForm({ token, onTaskCreated }) {
  const [form, setForm] = useState({ title: '', description: '', status: 'pending' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setForm({ title: '', description: '', status: 'pending' });
        onTaskCreated();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create task');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h3>Create New Task</h3>
      <input
        type="text"
        placeholder="Task title"
        value={form.title}
        onChange={(e) => setForm({...form, title: e.target.value})}
        required
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => setForm({...form, description: e.target.value})}
      />
      <select
        value={form.status}
        onChange={(e) => setForm({...form, status: e.target.value})}
      >
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Add Task'}
      </button>
    </form>
  );
}

export default TaskForm;
