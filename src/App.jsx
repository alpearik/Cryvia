import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Leaderboard from './Leaderboard';

function App() {
  const [user, setUser] = useState(() => {
    const username = localStorage.getItem("user_username");
    const id = localStorage.getItem("user_id");
    return username && id ? { username, id } : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user_username", user.username);
      localStorage.setItem("user_id", user.id);
    } else {
      localStorage.removeItem("user_username");
      localStorage.removeItem("user_id");
    }
  }, [user]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setUser={setUser} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/" />} />
        <Route path="/leaderboard" element={user ? <Leaderboard user={user} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;