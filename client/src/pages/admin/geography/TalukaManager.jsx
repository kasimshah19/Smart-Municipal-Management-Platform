import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosConfig.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/uiSlice.js';
import Modal from '../../../components/Modal.jsx';

function TalukaManager() {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    marathiName: '',
    districtId: '',
    state: 'Maharashtra',
    isActive: true
  });

  useEffect(() => {
    fetchData();
    fetchDistricts();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/geography/talukas');
      setData(res.data.data || []);
    } catch (err) {
      dispatch(showToast('Failed to fetch talukas'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async () => {
    try {
      const res = await api.get('/geography/districts');
      setDistricts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch districts', err);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        marathiName: item.marathiName || '',
        districtId: item.districtId?._id || item.districtId || '',
        state: item.state || 'Maharashtra',
        isActive: item.isActive !== false
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        marathiName: '',
        districtId: '',
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
        await api.put(`/geography/talukas/${editingItem._id}`, formData);
        dispatch(showToast('Taluka updated successfully'));
      } else {
        await api.post('/geography/talukas', formData);
        dispatch(showToast('Taluka created successfully'));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      dispatch(showToast(err.response?.data?.message || 'Failed to save taluka'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this taluka? Check if it has dependent municipalities first.')) {
      try {
        await api.delete(`/geography/talukas/${id}`);
        dispatch(showToast('Taluka deleted successfully'));
        fetchData();
      } catch (err) {
        dispatch(showToast(err.response?.data?.message || 'Failed to delete taluka'));
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
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = districtFilter ? (item.districtId?._id === districtFilter || item.districtId === districtFilter) : true;
    const matchesStatus = statusFilter ? (statusFilter === 'ACTIVE' ? item.isActive === true : item.isActive === false) : true;
    return matchesSearch && matchesDistrict && matchesStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
          Talukas
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          + Add Taluka
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 text-[14px] outline-none w-1/3"
          style={inputStyles}
        />
        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="px-3 py-2 text-[14px] outline-none"
          style={inputStyles}
        >
          <option value="">All Districts</option>
          {districts.map(dist => (
            <option key={dist._id} value={dist._id}>{dist.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-[14px] outline-none"
          style={inputStyles}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
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
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>District</th>
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
                    <td className="py-4" style={{ color: 'var(--muted)' }}>
                      {item.districtName || item.districtId?.name || 'Unknown'}
                    </td>
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
                    No talukas found.
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
        title={editingItem ? 'Edit Taluka' : 'Add Taluka'}
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
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>District *</label>
            <select
              required
              value={formData.districtId}
              onChange={(e) => setFormData({...formData, districtId: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none"
              style={inputStyles}
            >
              <option value="" disabled>Select District</option>
              {districts.map(dist => (
                <option key={dist._id} value={dist._id}>{dist.name}</option>
              ))}
            </select>
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
              {editingItem ? 'Save Changes' : 'Create Taluka'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TalukaManager;
