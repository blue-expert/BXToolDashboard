import React, { useState, useEffect } from 'react';
import './App.css';
import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal // ⭐️ We'll get 'inProgress' from here
} from "@azure/msal-react";
import { loginRequest, protectedApiRequest } from './authConfig';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import AddTool from './AddTool';

// --- Login/Logout Buttons (Same as before) ---
const LoginButton = () => {
  const { instance } = useMsal();
  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => console.error(e));
  }
  return <button onClick={handleLogin}>Log In</button>
};

const LogoutButton = () => {
  const { instance } = useMsal();
  const handleLogout = () => {
    instance.logoutPopup().catch(e => console.error(e));
  }
  return <button onClick={handleLogout}>Log Out</button>
};
// ---------------------------------


// --- ⭐️ UPDATED Authenticated Content ⭐️ ---
const ToolGrid = () => {
  // Get 'inProgress' to know if MSAL is busy
  const { instance, accounts, inProgress } = useMsal();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true); // Start as true
  const [error, setError] = useState(null);

  const API_URL = `/api/tools`;

  const fetchTools = async () => {
    // We know an account exists because we're in AuthenticatedTemplate
    const account = accounts[0];

    try {
      // 1. Get the access token
      const response = await instance.acquireTokenSilent({
        ...protectedApiRequest,
        account: account
      });

      const token = response.accessToken;

      // 2. Make the authenticated API call
      const apiResponse = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!apiResponse.ok) {
        // If the server returns 401, 403, etc.
        throw new Error(`API Error: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      console.log("Response: ", apiResponse.json());

      const data = await apiResponse.json();
      setTools(data);

    } catch (e) {
      // Handle errors (e.g., token expired, API down)
      console.error(e);
      setError(e.message);
    } finally {
      // This *always* runs, even if there's an error
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if MSAL is NOT busy AND we have an account
    if (inProgress === 'none' && accounts.length > 0) {
      fetchTools();
    } else if (inProgress === 'none' && accounts.length === 0) {
      // Not busy, but no account. This is an error state.
      setLoading(false);
      setError("You are logged in, but no account was found.");
    }
    // If 'inProgress' is not 'none', we just wait.
    // The "Loading tools..." message will stay, which is correct.

  }, [instance, accounts, inProgress, API_URL]); // ⭐️ Add 'inProgress'

  const getToolUrl = (targetPath) => {
    if (targetPath.startsWith('http')) return targetPath;
    return targetPath;
  };

  // --- Render logic (Same as before) ---
  if (loading) {
    return <div>Loading tools...</div>;
  }

  if (error) {
    // ⭐️ You will now see this error instead of being stuck
    return <div className="App">Error loading tools: {error}</div>;
  }

  return (
    <main className="tool-grid">
      <div className="tool-grid-header">
        <h2>Available Tools</h2>
        <div className="tool-grid-actions">
          <button onClick={fetchTools} className="refresh-btn">
            Refresh
          </button>
          <Link to="/add-tool" className="add-tool-btn">
            Add New Tool
          </Link>
        </div>
      </div>
      
      <div className="tools-container">
        {tools.map((tool) => (
          <a
            key={tool.id}
            href={getToolUrl(tool.target_path)}
            className="tool-card"
            target={tool.target_path.startsWith('http') ? '_blank' : '_self'}
            rel="noopener noreferrer"
          >
            <h3>{tool.name}</h3>
            <p>{tool.description}</p>
          </a>
        ))}
      </div>
    </main>
  );
};
// ---------------------------------


// --- Main App Component with Routing ---
function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Company Tool Portal</h1>
          <AuthenticatedTemplate>
            <LogoutButton />
          </AuthenticatedTemplate>
          <UnauthenticatedTemplate>
            <LoginButton />
          </UnauthenticatedTemplate>
        </header>

        <AuthenticatedTemplate>
          <Routes>
            <Route path="/" element={<ToolGrid />} />
            <Route path="/add-tool" element={<AddTool />} />
          </Routes>
        </AuthenticatedTemplate>

        <UnauthenticatedTemplate>
          <p>Please log in to see the available tools.</p>
        </UnauthenticatedTemplate>
      </div>
    </Router>
  );
}

export default App;