import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosConfig.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/uiSlice.js';
import Modal from '../../../components/Modal.jsx';
import SearchableSelect from '../../../components/common/SearchableSelect.jsx';

const LEVELS = ['EXECUTIVE', 'OFFICER', 'SUPERVISOR', 'STAFF', 'WORKER'];

function DesignationManager() {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    municipalityId: '',
    name: '',
    code: '',
    level: 'STAFF',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
    fetchMunicipalities();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/designations');
      setData(res.data.data?.results || res.data.data || res.data || []);
    } catch (err) {
      dispatch(showToast('Failed to fetch designations'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMunicipalities = async () => {
    try {
      const res = await api.get('/municipalities');
      const list = res.data.data?.results || res.data.data || res.data || [];
      setMunicipalities(list);
    } catch (err) {
      console.error('Failed to fetch municipalities', err);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        municipalityId: item.municipalityId?._id || item.municipalityId || '',
        name: item.name || '',
        code: item.code || '',
        level: item.level || 'STAFF',
        description: item.description || '',
        isActive: item.isActive !== false
      });
    } else {
      setEditingItem(null);
      setFormData({
        municipalityId: municipalities.length > 0 ? municipalities[0]._id : '',
        name: '',
        code: '',
        level: 'STAFF',
        description: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/designations/${editingItem._id}`, formData);
        dispatch(showToast('Designation updated successfully'));
      } else {
        await api.post('/designations', formData);
        dispatch(showToast('Designation created successfully'));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      dispatch(showToast(err.response?.data?.message || 'Failed to save designation'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this designation?')) {
      try {
        await api.delete(`/designations/${id}`);
        dispatch(showToast('Designation deleted successfully'));
        fetchData();
      } catch (err) {
        dispatch(showToast(err.response?.data?.message || 'Failed to delete designation'));
      }
    }
  };

  const inputStyles = {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--line)',
    borderRadius: '8px',
    color: 'var(--ink)',
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
          Designations
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          + Add Designation
        </button>
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
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Name / Code</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Level</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Municipality</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Status</th>
                <th className="pb-3 font-semibold text-right" style={{ color: 'var(--muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map(item => (
                  <tr key={item._id} className="group" style={{ borderBottom: '1px solid var(--line)' }}>
                    <td className="py-4">
                      <div className="font-medium" style={{ color: 'var(--ink)' }}>{item.name}</div>
                      <div className="text-xs font-mono" style={{ color: 'var(--primary)' }}>{item.code}</div>
                    </td>
                    <td className="py-4 text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                      {item.level}
                    </td>
                    <td className="py-4 text-xs" style={{ color: 'var(--muted)' }}>
                      {item.municipalityId?.name || 'N/A'}
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
                  <td colSpan="5" className="py-8 text-center" style={{ color: 'var(--muted)' }}>
                    No designations found.
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
        title={editingItem ? 'Edit Designation' : 'Add Designation'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Municipality *</label>
            <SearchableSelect
              name="municipalityId"
              options={municipalities.map(m => ({ value: m._id, label: m.name }))}
              value={formData.municipalityId}
              onChange={(e) => setFormData({...formData, municipalityId: e.target.value})}
              placeholder="Select Municipality"
              isClearable={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Designation Name *</label>
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
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Hierarchy Level</label>
            <SearchableSelect
              name="level"
              options={LEVELS.map(l => ({ value: l, label: l }))}
              value={formData.level}
              onChange={(e) => setFormData({...formData, level: e.target.value})}
              placeholder="Select Level"
              isClearable={false}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none resize-none"
              style={inputStyles}
              rows={3}
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
              {editingItem ? 'Save Changes' : 'Create Designation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DesignationManager;
