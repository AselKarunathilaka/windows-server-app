import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:19090/api';

function Dashboard() {
  const [status, setStatus] = useState({
    frontend: 'running',
    backend: 'checking...',
    database: 'checking...',
    version: '...'
  });
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch System Status
    axios.get(`${API_BASE_URL}/status`)
      .then(res => {
        setStatus(prev => ({
          ...prev,
          backend: res.data.backend,
          database: res.data.database,
          version: res.data.version
        }));
      })
      .catch(err => {
        setStatus(prev => ({ ...prev, backend: 'error', database: 'error' }));
      });

    // Fetch Interns for Analytics
    axios.get(`${API_BASE_URL}/interns`)
      .then(res => {
        setInterns(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching analytics", err);
        setLoading(false);
      });
  }, []);

  const activeInterns = interns.filter(i => i.status === 'ACTIVE').length;
  const completedInterns = interns.filter(i => i.status === 'COMPLETED').length;
  
  // Sort by created date descending and take top 5
  const recentInterns = [...interns].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div>
      <h2>System Dashboard</h2>
      
      {/* Status Cards */}
      <div className="dashboard-grid">
        <div className="status-card">
          <h3>Frontend Status</h3>
          <div className={`status-value status-${status.frontend}`}>
            <div className="pulse"></div> {status.frontend}
          </div>
          <small>React Vite UI</small>
        </div>
        <div className="status-card">
          <h3>Backend Status</h3>
          <div className={`status-value status-${status.backend}`}>
            <div className="pulse"></div> {status.backend}
          </div>
          <small>Spring Boot API</small>
        </div>
        <div className="status-card">
          <h3>Database Status</h3>
          <div className={`status-value status-${status.database === 'connected' ? 'connected' : 'error'}`}>
             <div className="pulse"></div> {status.database}
          </div>
          <small>MongoDB Atlas</small>
        </div>
        <div className="status-card">
          <h3>App Version</h3>
          <div className="status-value">{status.version}</div>
          <small>From Backend API</small>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="analytics-section">
        <div className="card analytics-side">
          <h3>Internship Analytics</h3>
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Interns</span>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{loading ? '...' : interns.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active</span>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--secondary)' }}>{loading ? '...' : activeInterns}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Completed</span>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>{loading ? '...' : completedInterns}</span>
            </div>
          </div>
          <Link to="/interns" className="btn btn-primary" style={{ width: '100%', textAlign: 'center', marginTop: '15px', boxSizing: 'border-box' }}>
            Manage All Interns
          </Link>
        </div>

        <div className="card analytics-main">
          <h3>Recently Added Interns</h3>
          {loading ? (
            <p>Loading data...</p>
          ) : recentInterns.length === 0 ? (
            <p>No interns found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Intern #</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInterns.map(intern => (
                  <tr key={intern.id}>
                    <td style={{ fontWeight: '600' }}>{intern.internNumber}</td>
                    <td>{intern.fullName}</td>
                    <td>{intern.department}</td>
                    <td><span className={`badge badge-${intern.status}`}>{intern.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function InternList() {
  const [interns, setInterns] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInterns = () => {
    setLoading(true);
    const url = search 
      ? `${API_BASE_URL}/interns/search?internNumber=${search}`
      : `${API_BASE_URL}/interns`;
      
    axios.get(url)
      .then(res => {
        setInterns(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching interns", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInterns();
  }, [search]); // Re-fetch on search change

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this intern?')) {
      axios.delete(`${API_BASE_URL}/interns/${id}`)
        .then(() => {
          fetchInterns();
        })
        .catch(err => console.error("Error deleting intern", err));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Intern Directory</h2>
        <Link to="/add" className="btn btn-success">+ Add New Intern</Link>
      </div>

      <div className="card">
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search by exact intern number..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading directory...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Intern #</th>
                <th>Name</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {interns.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>No interns found.</td></tr>
              ) : (
                interns.map(intern => (
                  <tr key={intern.id}>
                    <td style={{ fontWeight: '600' }}>{intern.internNumber}</td>
                    <td>{intern.fullName}</td>
                    <td>{intern.department}</td>
                    <td><span className={`badge badge-${intern.status}`}>{intern.status}</span></td>
                    <td>
                      <Link to={`/edit/${intern.id}`} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Edit</Link>
                      <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleDelete(intern.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function InternForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const [formData, setFormData] = useState({
    internNumber: '',
    fullName: '',
    email: '',
    department: '',
    university: '',
    phoneNumber: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE'
  });
  
  useEffect(() => {
    if (isEdit) {
      axios.get(`${API_BASE_URL}/interns/${id}`)
        .then(res => {
          const data = res.data;
          if (data.startDate) data.startDate = data.startDate.split('T')[0];
          if (data.endDate) data.endDate = data.endDate.split('T')[0];
          setFormData(data);
        })
        .catch(err => console.error("Error fetching intern details", err));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const request = isEdit 
      ? axios.put(`${API_BASE_URL}/interns/${id}`, formData)
      : axios.post(`${API_BASE_URL}/interns`, formData);
      
    request
      .then(() => navigate('/interns'))
      .catch(err => {
        console.error("Error saving intern", err);
        alert("Failed to save intern. Check console for details.");
      });
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>{isEdit ? 'Edit Intern Profile' : 'Register New Intern'}</h2>
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Intern Number</label>
              <input type="text" name="internNumber" value={formData.internNumber} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input type="text" name="department" value={formData.department} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>University</label>
              <input type="text" name="university" value={formData.university} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" name="endDate" value={formData.endDate || ''} onChange={handleChange} />
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: '10px' }}>
            <label>Current Status</label>
            <select name="status" value={formData.status} onChange={handleChange} required>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="TERMINATED">TERMINATED</option>
            </select>
          </div>
          
          <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
            <button type="submit" className="btn btn-success" style={{ flex: 1 }}>Save Profile</button>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate('/interns')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <header>
        <div className="header-content">
          <h1>Deployment Lab App</h1>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/interns">Directory</Link>
          </div>
        </div>
      </header>
      <div className="container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/interns" element={<InternList />} />
          <Route path="/add" element={<InternForm />} />
          <Route path="/edit/:id" element={<InternForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
