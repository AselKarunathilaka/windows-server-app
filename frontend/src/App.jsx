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

  useEffect(() => {
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
        setStatus(prev => ({
          ...prev,
          backend: 'error',
          database: 'unknown'
        }));
      });
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="dashboard-grid">
        <div className="status-card">
          <h3>Frontend Status</h3>
          <div className={`status-value status-${status.frontend}`}>{status.frontend}</div>
          <small>React Vite UI</small>
        </div>
        <div className="status-card">
          <h3>Backend Status</h3>
          <div className={`status-value status-${status.backend}`}>{status.backend}</div>
          <small>Spring Boot API</small>
        </div>
        <div className="status-card">
          <h3>Database Status</h3>
          <div className={`status-value status-${status.database === 'connected' ? 'connected' : 'error'}`}>
            {status.database}
          </div>
          <small>MongoDB</small>
        </div>
        <div className="status-card">
          <h3>App Version</h3>
          <div className="status-value">{status.version}</div>
          <small>From Backend API</small>
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
  }, []);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Intern List</h2>
        <Link to="/add" className="btn btn-success">Add Intern</Link>
      </div>

      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Search by intern number" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={fetchInterns}>Search</button>
      </div>

      {loading ? (
        <p>Loading...</p>
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
              <tr><td colSpan="5">No interns found.</td></tr>
            ) : (
              interns.map(intern => (
                <tr key={intern.id}>
                  <td>{intern.internNumber}</td>
                  <td>{intern.fullName}</td>
                  <td>{intern.department}</td>
                  <td>{intern.status}</td>
                  <td>
                    <Link to={`/edit/${intern.id}`} className="btn btn-primary">Edit</Link>
                    <button className="btn btn-danger" onClick={() => handleDelete(intern.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
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
          // Format dates for input fields
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
    <div className="card">
      <h2>{isEdit ? 'Edit Intern' : 'Add New Intern'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Intern Number</label>
          <input type="text" name="internNumber" value={formData.internNumber} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} />
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
          <label>Phone Number</label>
          <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Start Date</label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>End Date</label>
          <input type="date" name="endDate" value={formData.endDate || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleChange} required>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="TERMINATED">TERMINATED</option>
          </select>
        </div>
        <button type="submit" className="btn btn-success">Save</button>
        <button type="button" className="btn" onClick={() => navigate('/interns')}>Cancel</button>
      </form>
    </div>
  );
}

function App() {
  return (
    <Router>
      <header>
        <h1>Server Deployment Lab App</h1>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/interns">Intern List</Link>
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
