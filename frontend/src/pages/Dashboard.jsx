import { useState, useEffect } from 'react';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import './Dashboard.css';

function Dashboard({ token, user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = async (pageNum = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/tasks?page=${pageNum}&per_page=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setTotalPages(data.pages);
        setPage(data.page);
      } else {
        setError('Failed to fetch tasks');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  const handleTaskCreated = () => fetchTasks(page);

  const handleTaskUpdated = () => fetchTasks(page);

  const handleTaskDeleted = () => fetchTasks(page);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {user?.username || 'User'}!</h2>
        <p>Manage your tasks below.</p>
      </div>
      <TaskForm token={token} onTaskCreated={handleTaskCreated} />
      {loading && <p>Loading tasks...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && (
        <>
          <TaskList
            tasks={tasks}
            token={token}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
          />
          <div className="pagination">
            <button
              onClick={() => fetchTasks(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => fetchTasks(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
