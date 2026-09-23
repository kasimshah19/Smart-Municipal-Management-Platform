import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosConfig.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/uiSlice.js';
import Modal from '../../../components/Modal.jsx';
import SearchableSelect from '../../../components/common/SearchableSelect.jsx';

function DistrictManager() {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    marathiName: '',
    code: '',
    divisionId: '',
    state: 'Maharashtra',
    isActive: true
  });

  useEffect(() => {
    fetchData();
    fetchDivisions();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/geography/districts');
      setData(res.data.data || []);
    } catch (err) {
      dispatch(showToast('Failed to fetch districts'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisions = async () => {
    try {
      const res = await api.get('/geography/divisions');
      setDivisions(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch divisions', err);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        marathiName: item.marathiName || '',
        code: item.code || '',
        divisionId: item.divisionId?._id || item.divisionId || '',
        state: item.state || 'Maharashtra',
        isActive: item.isActive !== false
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        marathiName: '',
        code: '',
        divisionId: '',
        state: 'Maharashtra',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/geography/districts/${editingItem._id}`, formData);
        dispatch(showToast('District updated successfully'));
      } else {
        await api.post('/geography/districts', formData);
        dispatch(showToast('District created successfully'));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      dispatch(showToast(err.response?.data?.message || 'Failed to save district'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this district? Check if it has dependent talukas first.')) {
      try {
        await api.delete(`/geography/districts/${id}`);
        dispatch(showToast('District deleted successfully'));
        fetchData();
      } catch (err) {
        dispatch(showToast(err.response?.data?.message || 'Failed to delete district'));
      }
    }
  };

  const inputStyles = {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--line)',
    borderRadius: '8px',
    color: 'var(--ink)',
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDivision = divisionFilter ? (item.divisionId?._id === divisionFilter || item.divisionId === divisionFilter) : true;
    const matchesStatus = statusFilter ? (statusFilter === 'ACTIVE' ? item.isActive === true : item.isActive === false) : true;
    return matchesSearch && matchesDivision && matchesStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
          Districts
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          + Add District
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 text-[14px] outline-none w-1/3"
          style={inputStyles}
        />
        <div className="w-48">
          <SearchableSelect
            name="divisionFilter"
            options={divisions.map(div => ({ value: div._id, label: div.name }))}
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            placeholder="All Divisions"
          />
        </div>
        <div className="w-48">
          <SearchableSelect
            name="statusFilter"
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All Status"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
          Loading...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)' }}>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Name</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>मराठी नाव</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Code</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Division</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Status</th>
                <th className="pb-3 font-semibold text-right" style={{ color: 'var(--muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map(item => (
                  <tr key={item._id} className="group" style={{ borderBottom: '1px solid var(--line)' }}>
                    <td className="py-4 font-medium" style={{ color: 'var(--ink)' }}>{item.name}</td>
                    <td className="py-4 text-sm" style={{ color: 'var(--muted)' }}>{item.marathiName || '—'}</td>
                    <td className="py-4 font-mono text-xs" style={{ color: 'var(--primary)' }}>{item.code}</td>
                    <td className="py-4" style={{ color: 'var(--muted)' }}>
                      {item.divisionId?.name || 'Unknown'}
                    </td>
                    <td className="py-4">
                      <span 
                        className="px-2 py-1 text-[11px] font-medium rounded-md"
                        style={{
                          backgroundColor: item.isActive ? 'var(--status-verified-bg)' : 'var(--status-rejected-bg)',
                          color: item.isActive ? 'var(--status-verified-text)' : 'var(--status-rejected-text)',
                        }}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="mr-3 text-xs font-medium transition-colors hover:opacity-80"
                        style={{ color: 'var(--primary)' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(item._id)}
                        className="text-xs font-medium transition-colors hover:opacity-80"
                        style={{ color: 'var(--danger)' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center" style={{ color: 'var(--muted)' }}>
                    No districts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit District' : 'Add District'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none"
              style={inputStyles}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>मराठी नाव</label>
            <input
              type="text"
              value={formData.marathiName}
              onChange={(e) => setFormData({...formData, marathiName: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none"
              style={inputStyles}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Code *</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({...formData, code: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none uppercase"
              style={inputStyles}
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Division *</label>
            <SearchableSelect
              name="divisionId"
              options={divisions.map(div => ({ value: div._id, label: div.name }))}
              value={formData.divisionId}
              onChange={(e) => setFormData({...formData, divisionId: e.target.value})}
              placeholder="Select Division"
              isClearable={false}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>State *</label>
            <input
              type="text"
              required
              value={formData.state}
              onChange={(e) => setFormData({...formData, state: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none"
              style={inputStyles}
            />
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="h-4 w-4 rounded"
            />
            <label htmlFor="isActive" className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
              Active Status
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid var(--line)' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-[13px] font-medium"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--line)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {editingItem ? 'Save Changes' : 'Create District'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DistrictManager;
