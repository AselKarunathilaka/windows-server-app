import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Automatically point to the server's IP address for API requests when accessed over a network
const envUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = (envUrl?.includes('localhost') && window.location.hostname !== 'localhost')
  ? `${window.location.protocol}//${window.location.hostname}:19090/api`
  : envUrl || 'http://localhost:19090/api';

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

  const totalInterns = interns.length;

  const universityData = Object.values(interns.reduce((acc, intern) => {
    const uni = intern.university || 'Unknown';
    acc[uni] = acc[uni] || { name: uni, value: 0 };
    acc[uni].value += 1;
    return acc;
  }, {}));

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
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold shadow-sm">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <>
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="blob bg-purple-400 w-96 h-96 top-[-10%] left-[-10%]" style={{ animationDelay: '0s', animationDuration: '12s' }}></div>
        <div className="blob bg-pink-400 w-96 h-96 top-[40%] right-[-10%]" style={{ animationDelay: '2s', animationDuration: '15s' }}></div>
        <div className="blob bg-indigo-400 w-[30rem] h-[30rem] bottom-[-20%] left-[20%]" style={{ animationDelay: '4s', animationDuration: '18s' }}></div>
      </div>
      
      <div className="animate-fade-in space-y-6">
        <h2 className="text-4xl font-extrabold text-slate-800 drop-shadow-sm tracking-tight">System Dashboard</h2>
        
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Frontend Status', value: status.frontend, subtitle: 'React Vite UI', statusColor: 'text-secondary', pulseColor: 'bg-secondary' },
          { title: 'Backend Status', value: status.backend, subtitle: 'Spring Boot API', statusColor: status.backend === 'running' ? 'text-secondary' : 'text-danger', pulseColor: status.backend === 'running' ? 'bg-secondary' : 'bg-danger' },
          { title: 'Database Status', value: status.database, subtitle: 'MongoDB Atlas', statusColor: status.database === 'connected' ? 'text-secondary' : 'text-danger', pulseColor: status.database === 'connected' ? 'bg-secondary' : 'bg-danger' },
          { title: 'App Version', value: status.version, subtitle: 'From Backend API', statusColor: 'text-primary', pulseColor: 'bg-primary', noPulse: true }
        ].map((card, index) => (
          <div key={index} className="glass-card animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{card.title}</h3>
            <div className={`text-3xl font-bold mt-2 mb-1 flex items-center ${card.statusColor}`}>
              {!card.noPulse && (
                <span className="relative flex h-3 w-3 mr-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${card.pulseColor}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${card.pulseColor}`}></span>
                </span>
              )}
              {card.value}
            </div>
            <p className="text-xs text-gray-400">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="glass-card col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Internship Analytics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500 font-medium">Total Interns</span>
                <span className="text-2xl font-bold text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">{loading ? '...' : interns.length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500 font-medium">Active</span>
                <span className="text-2xl font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{loading ? '...' : activeInterns}</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-gray-500 font-medium">Completed</span>
                <span className="text-2xl font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{loading ? '...' : completedInterns}</span>
              </div>
            </div>
          </div>
          <Link to="/interns" className="btn btn-primary w-full mt-6 flex justify-center items-center group">
            Manage All Interns
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        <div className="glass-card col-span-1 lg:col-span-2 overflow-hidden">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Recently Added Interns</h3>
          {loading ? (
            <div className="animate-pulse space-y-4 mt-8">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>)}
            </div>
          ) : recentInterns.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 italic">No interns found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-4 rounded-tl-lg font-semibold">Intern #</th>
                    <th className="p-4 font-semibold">Name</th>
                    <th className="p-4 font-semibold">Specialization</th>
                    <th className="p-4 rounded-tr-lg font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentInterns.map((intern, idx) => (
                    <tr key={intern.id} className="hover:bg-gray-50/80 transition-colors duration-150 animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                      <td className="p-4 font-bold text-gray-700">{intern.internNumber}</td>
                      <td className="p-4 font-medium">{intern.fullName}</td>
                      <td className="p-4"><span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">{intern.specialization || 'N/A'}</span></td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                          intern.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                          intern.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {intern.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '500ms' }}>
        <div className="glass-card flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Interns by University</h3>
            <span className="bg-indigo-50 text-primary px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-indigo-100">Total: {interns.length}</span>
          </div>
          <div className="h-72 w-full flex-grow relative">
            {loading ? <div className="absolute inset-0 flex items-center justify-center animate-pulse bg-gray-100 rounded-xl"></div> : interns.length === 0 ? <p className="text-center text-gray-400 mt-20">No data</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={universityData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={110}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    className="drop-shadow-md"
                  >
                    {universityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} Interns`, 'Count']} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-card flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Interns by Specialization</h3>
            <span className="bg-indigo-50 text-primary px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-indigo-100">Total: {interns.length}</span>
          </div>
          <div className="h-72 w-full flex-grow relative">
            {loading ? <div className="absolute inset-0 flex items-center justify-center animate-pulse bg-gray-100 rounded-xl"></div> : interns.length === 0 ? <p className="text-center text-gray-400 mt-20">No data</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={specializationData} margin={{ top: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} interval={0} angle={-30} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                  <RechartsTooltip cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} formatter={(value) => [`${value} Interns`, 'Count']} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={40} className="drop-shadow-sm">
                    <LabelList dataKey="percent" position="top" formatter={(val) => `${val}%`} style={{ fontSize: '12px', fill: '#4B5563', fontWeight: 'bold' }} />
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
    </>
  );
}

function InternList() {
  const [interns, setInterns] = useState([]);
  const [search, setSearch] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchInterns = () => {
    setLoading(true);
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
        .then(() => fetchInterns())
        .catch(err => console.error("Error deleting intern", err));
    }
  };

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
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229);
    doc.text('Intern Directory Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Specialization Filter: ${specializationFilter || 'All'}  |  Search Query: ${search || 'None'}`, 14, 32);
    doc.text(`Total Records Found: ${filteredInterns.length}`, 14, 38);

    const tableColumn = ["Intern #", "Name", "Specialization", "University", "Status"];
    const tableRows = [];

    filteredInterns.forEach(intern => {
      tableRows.push([
        intern.internNumber,
        intern.fullName,
        intern.specialization || 'N/A',
        intern.university || 'N/A',
        intern.status
      ]);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      alternateRowStyles: { fillColor: [249, 250, 251] }
    });

    doc.save(`intern_directory_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <>
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="blob bg-teal-300 w-[40rem] h-[40rem] top-[-20%] right-[-10%]" style={{ animationDelay: '1s', animationDuration: '14s' }}></div>
        <div className="blob bg-blue-400 w-96 h-96 bottom-[10%] left-[-10%]" style={{ animationDelay: '3s', animationDuration: '16s' }}></div>
      </div>

      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-4xl font-extrabold text-slate-800 drop-shadow-sm tracking-tight">Intern Directory</h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <button className="btn btn-outline flex-1 sm:flex-none shadow-lg" onClick={handleExportPDF}>
              Export PDF
            </button>
            <Link to="/add" className="btn btn-success flex-1 sm:flex-none shadow-lg">
              + Add New Intern
            </Link>
          </div>
        </div>

      <div className="glass-card animate-slide-up">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              className="form-input pl-10" 
              placeholder="Search by ID or Name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="form-input md:w-64 cursor-pointer"
            value={specializationFilter} 
            onChange={(e) => setSpecializationFilter(e.target.value)}
          >
            <option value="">All Specializations</option>
            {SPECIALIZATIONS.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>)}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left border-collapse bg-white/50">
              <thead>
                <tr className="bg-gray-100/80 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Intern #</th>
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Specialization</th>
                  <th className="p-4 font-semibold">University</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInterns.length === 0 ? (
                  <tr><td colSpan="6" className="text-center p-8 text-gray-500 italic">No interns found matching your criteria.</td></tr>
                ) : (
                  filteredInterns.map((intern, idx) => (
                    <tr key={intern.id} className="hover:bg-indigo-50/50 transition-colors duration-200 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                      <td className="p-4 font-bold text-gray-800">{intern.internNumber}</td>
                      <td className="p-4 font-medium text-gray-700">{intern.fullName}</td>
                      <td className="p-4">
                        <span className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                          {intern.specialization || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{intern.university}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border ${
                          intern.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          intern.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {intern.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Link to={`/edit/${intern.id}`} className="bg-indigo-100 text-primary hover:bg-indigo-200 p-2 rounded-lg transition-colors" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </Link>
                          <button onClick={() => handleDelete(intern.id)} className="bg-red-100 text-danger hover:bg-red-200 p-2 rounded-lg transition-colors" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </>
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    <>
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="blob bg-rose-300 w-[30rem] h-[30rem] top-[20%] left-[30%]" style={{ animationDelay: '0s', animationDuration: '20s' }}></div>
      </div>

      <div className="animate-fade-in space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/interns')} className="bg-white/40 hover:bg-white/60 text-slate-800 p-3 rounded-full backdrop-blur-xl transition-all shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-4xl font-extrabold text-slate-800 drop-shadow-sm tracking-tight">{isEdit ? 'Edit Intern Profile' : 'Register New Intern'}</h2>
        </div>

      <div className="glass-card max-w-4xl mx-auto animate-slide-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Intern Number *</label>
              <input type="text" className="form-input" name="internNumber" value={formData.internNumber} onChange={handleChange} required placeholder="e.g. 3531" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Full Name *</label>
              <input type="text" className="form-input" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
              <input type="email" className="form-input" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
              <input type="text" className="form-input" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="0771234567" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Department *</label>
              <input type="text" className="form-input" name="department" value={formData.department} onChange={handleChange} required placeholder="Digital Platforms" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Specialization *</label>
              <select className="form-input cursor-pointer" name="specialization" value={formData.specialization} onChange={handleChange} required>
                <option value="" disabled>Select Specialization</option>
                {SPECIALIZATIONS.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">University</label>
              <input type="text" className="form-input" name="university" value={formData.university} onChange={handleChange} placeholder="SLIIT" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Current Status *</label>
              <select className="form-input cursor-pointer" name="status" value={formData.status} onChange={handleChange} required>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Start Date *</label>
              <input type="date" className="form-input cursor-pointer" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">End Date</label>
              <input type="date" className="form-input cursor-pointer" name="endDate" value={formData.endDate || ''} onChange={handleChange} />
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100 flex gap-4">
            <button type="submit" className="btn btn-success flex-1 text-lg py-3 shadow-lg flex justify-center items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Save Profile
            </button>
            <button type="button" className="btn bg-white/40 hover:bg-white/60 text-slate-700 flex-1 text-lg py-3 shadow-md border border-white/50" onClick={() => navigate('/interns')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <header className="glass-header">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2.5 rounded-2xl shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Intern Management</h1>
          </div>
          <nav className="flex gap-2">
            <Link to="/" className="text-slate-700 hover:text-indigo-600 hover:bg-white/40 px-5 py-2.5 rounded-xl font-bold transition-all">Dashboard</Link>
            <Link to="/interns" className="text-slate-700 hover:text-indigo-600 hover:bg-white/40 px-5 py-2.5 rounded-xl font-bold transition-all">Directory</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/interns" element={<InternList />} />
          <Route path="/add" element={<InternForm />} />
          <Route path="/edit/:id" element={<InternForm />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
