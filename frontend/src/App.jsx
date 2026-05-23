import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:19090/api';

const SPECIALIZATIONS = [
  "AI", "BA", "C#", "CICD", "Cloud", "Flutter", 
  "FullStack", "JAVA", "MERN", "PHP", "PM", "Other"
];

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

  // Chart Data Processing
  const universityData = Object.values(interns.reduce((acc, intern) => {
    const uni = intern.university || 'Unknown';
    acc[uni] = acc[uni] || { name: uni, value: 0 };
    acc[uni].value += 1;
    return acc;
  }, {}));

  const totalInterns = interns.length;

  const specializationData = Object.values(interns.reduce((acc, intern) => {
    const spec = intern.specialization || 'N/A';
    acc[spec] = acc[spec] || { name: spec, count: 0 };
    acc[spec].count += 1;
    return acc;
  }, {})).sort((a, b) => b.count - a.count).map(item => ({
    ...item,
    percent: totalInterns > 0 ? ((item.count / totalInterns) * 100).toFixed(0) : 0
  }));

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: '11px', fontWeight: 'bold' }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

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
                  <th>Specialization</th>
                  <th>University</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInterns.map(intern => (
                  <tr key={intern.id}>
                    <td style={{ fontWeight: '600' }}>{intern.internNumber}</td>
                    <td>{intern.fullName}</td>
                    <td><span className="badge" style={{ background: '#f3f4f6', color: '#374151' }}>{intern.specialization || 'N/A'}</span></td>
                    <td>{intern.university}</td>
                    <td><span className={`badge badge-${intern.status}`}>{intern.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="analytics-section" style={{ marginTop: '25px' }}>
        <div className="card" style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Interns by University</h3>
            <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>Total: {interns.length}</span>
          </div>
          <div style={{ height: '300px' }}>
            {loading ? <p>Loading chart...</p> : interns.length === 0 ? <p>No data</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={universityData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {universityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Interns`, 'Count']} />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Interns by Specialization</h3>
            <span className="badge" style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>Total: {interns.length}</span>
          </div>
          <div style={{ height: '300px' }}>
            {loading ? <p>Loading chart...</p> : interns.length === 0 ? <p>No data</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={specializationData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} formatter={(value) => [`${value} Interns`, 'Count']} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40}>
                    <LabelList dataKey="percent" position="top" formatter={(val) => `${val}%`} style={{ fontSize: '11px', fill: '#6B7280', fontWeight: 'bold' }} />
                    {specializationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InternList() {
  const [interns, setInterns] = useState([]);
  const [search, setSearch] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInterns = () => {
    setLoading(true);
    // Fetch all and filter in frontend for simplicity in this lab app
    axios.get(`${API_BASE_URL}/interns`)
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

  // Filter logic
  const filteredInterns = interns.filter(intern => {
    const term = search.toLowerCase();
    const matchesSearch = 
      intern.internNumber.toLowerCase().includes(term) || 
      intern.fullName.toLowerCase().includes(term);
    
    const matchesSpec = specializationFilter ? intern.specialization === specializationFilter : true;
    
    return matchesSearch && matchesSpec;
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Intern Directory Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Specialization Filter: ${specializationFilter || 'All'} | Search: ${search || 'None'}`, 14, 30);
    doc.text(`Total Records: ${filteredInterns.length}`, 14, 36);

    const tableColumn = ["Intern #", "Name", "Specialization", "University", "Status"];
    const tableRows = [];

    filteredInterns.forEach(intern => {
      const rowData = [
        intern.internNumber,
        intern.fullName,
        intern.specialization || 'N/A',
        intern.university || 'N/A',
        intern.status
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 42,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`intern_directory_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Intern Directory</h2>
        <div>
          <button className="btn btn-outline" style={{ marginRight: '10px' }} onClick={handleExportPDF}>Export PDF</button>
          <Link to="/add" className="btn btn-success">+ Add New Intern</Link>
        </div>
      </div>

      <div className="card">
        <div className="search-bar" style={{ display: 'flex', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Search by ID or Name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 2 }}
          />
          <select 
            value={specializationFilter} 
            onChange={(e) => setSpecializationFilter(e.target.value)}
            style={{ flex: 1, padding: '12px 20px', borderRadius: '30px', border: '1px solid rgba(0,0,0,0.1)' }}
          >
            <option value="">All Specializations</option>
            {SPECIALIZATIONS.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading directory...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Intern #</th>
                <th>Name</th>
                <th>Specialization</th>
                <th>University</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterns.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No interns found.</td></tr>
              ) : (
                filteredInterns.map(intern => (
                  <tr key={intern.id}>
                    <td style={{ fontWeight: '600' }}>{intern.internNumber}</td>
                    <td>{intern.fullName}</td>
                    <td><span className="badge" style={{ background: '#f3f4f6', color: '#374151' }}>{intern.specialization || 'N/A'}</span></td>
                    <td>{intern.university}</td>
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
    specialization: '',
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
              <label>Specialization</label>
              <select name="specialization" value={formData.specialization} onChange={handleChange} required>
                <option value="" disabled>Select Specialization</option>
                {SPECIALIZATIONS.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
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
            <div className="form-group">
              <label>Current Status</label>
              <select name="status" value={formData.status} onChange={handleChange} required>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
            </div>
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
