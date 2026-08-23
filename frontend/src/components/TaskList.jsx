import { useState } from 'react';
import './TaskList.css';

function TaskList({ tasks, token, onTaskUpdated, onTaskDeleted }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', status: '' });

  const handleEdit = (task) => {
    setEditingId(task.id);
    setEditForm({ title: task.title, description: task.description || '', status: task.status });
  };

  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditingId(null);
        onTaskUpdated();
      } else {
        alert('Failed to update task');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onTaskDeleted();
      } else {
        alert('Failed to delete task');
      }
    } catch {
      alert('Network error');
    }
  };

  if (tasks.length === 0) {
    return <p className="no-tasks">No tasks yet. Create one above!</p>;
  }

  return (
    <div className="task-list">
      <h3>Your Tasks</h3>
      {tasks.map((task) => (
        <div key={task.id} className="task-card">
          {editingId === task.id ? (
            <div className="task-edit">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                placeholder="Title"
              />
              <input
                type="text"
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                placeholder="Description"
              />
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({...editForm, status: e.target.value})}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <div className="task-actions">
                <button onClick={() => handleUpdate(task.id)} className="btn-save">Save</button>
                <button onClick={() => setEditingId(null)} className="btn-cancel">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="task-content">
                <h4>{task.title}</h4>
                <p>{task.description || 'No description'}</p>
                <span className={`task-status ${task.status}`}>{task.status}</span>
              </div>
              <div className="task-actions">
                <button onClick={() => handleEdit(task)} className="btn-edit">Edit</button>
                <button onClick={() => handleDelete(task.id)} className="btn-delete">Delete</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default TaskList;
