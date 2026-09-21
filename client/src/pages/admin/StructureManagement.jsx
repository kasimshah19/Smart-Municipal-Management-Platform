import React, { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout.jsx';
import api from '../../utils/axiosConfig.js';

const ENTITIES = [
  { key: 'municipalities', label: 'Municipalities', endpoint: '/municipalities' },
  { key: 'wards', label: 'Wards', endpoint: '/wards' },
  { key: 'areas', label: 'Areas', endpoint: '/areas' },
  { key: 'departments', label: 'Departments', endpoint: '/departments' },
  { key: 'designations', label: 'Designations', endpoint: '/designations' },
  { key: 'employees', label: 'Employees', endpoint: '/employees' },
  { key: 'worker-teams', label: 'Worker Teams', endpoint: '/worker-teams' },
];

function StructureManagement() {
  const [activeTab, setActiveTab] = useState(ENTITIES[0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(activeTab.endpoint);
      // API structure usually wraps in { success: true, data: [...] }
      if (res.data?.success) {
        setData(res.data.data.results || res.data.data);
      } else {
        setData(res.data || []);
      }
    } catch (err) {
      console.error(`Failed to fetch ${activeTab.label}`, err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
          Municipal Structure Management
        </h1>
        <p style={{ color: 'var(--ink)', opacity: 0.7 }}>
          Manage the core configuration and hierarchy of the municipality.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 border-b" style={{ borderColor: 'var(--line)' }}>
        {ENTITIES.map(entity => (
          <button
            key={entity.key}
            onClick={() => setActiveTab(entity)}
            className="px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors rounded-lg"
            style={{
              backgroundColor: activeTab.key === entity.key ? 'var(--primary)' : 'transparent',
              color: activeTab.key === entity.key ? 'white' : 'var(--ink)',
              opacity: activeTab.key === entity.key ? 1 : 0.7
            }}
          >
            {entity.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div
        className="p-5"
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '14px',
          border: '1px solid var(--line)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
            {activeTab.label} List
          </h2>
          <button 
            className="px-4 py-2 rounded font-medium text-sm text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            + Add {activeTab.label.slice(0, -1)}
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--ink)', opacity: 0.5 }}>
            Loading...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <th className="pb-3 font-medium opacity-70">Name</th>
                  <th className="pb-3 font-medium opacity-70">Code</th>
                  <th className="pb-3 font-medium opacity-70">Status</th>
                  <th className="pb-3 font-medium opacity-70 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map(item => (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td className="py-4 font-medium">{item.name || item.wardNumber || item.employeeCode}</td>
                      <td className="py-4 font-mono text-xs opacity-70">{item.code || item.employeeCode}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          {item.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button className="text-blue-500 hover:underline mr-3 text-xs font-medium">Edit</button>
                        <button className="text-red-500 hover:underline text-xs font-medium">Delete</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center opacity-50">
                      No {activeTab.label.toLowerCase()} found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default StructureManagement;
