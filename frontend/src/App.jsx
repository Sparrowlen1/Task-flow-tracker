import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUser();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const fetchUser = async () => {
  try {
    console.log('Fetching user with token:', token);
    const res = await fetch('http://localhost:5000/api/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Response status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('User data:', data);
      setUser(data);
    } else {
      console.log('Token validation failed, logging out');
      logout();
    }
  } catch (error) {
    console.log('Network error:', error);
    logout();
  }
};

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <div className="app">
      <Navbar user={user} logout={logout} />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={token ? <Dashboard token={token} user={user} /> : <Navigate to="/login" />}
          />
          <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
