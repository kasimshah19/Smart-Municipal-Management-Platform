import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosConfig.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/uiSlice.js';
import Modal from '../../../components/Modal.jsx';
import { MAHARASHTRA_DISTRICTS } from '../../../constants/maharashtraDistricts.js';

const DEPT_TYPES = [
  'SANITATION', 'WATER_SUPPLY', 'ROADS', 'ELECTRICAL', 'DRAINAGE', 
  'HEALTH', 'GARDEN', 'BUILDING', 'REVENUE', 'ADMINISTRATION'
];

function DepartmentManager() {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [municipalityFilter, setMunicipalityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    municipalityId: '',
    name: '',
    code: '',
    type: 'ADMINISTRATION',
    description: '',
    contactPhone: '',
    contactEmail: '',
    officeLocation: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
    fetchMunicipalities();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      setData(res.data.data?.results || res.data.data || res.data || []);
    } catch (err) {
      dispatch(showToast('Failed to fetch departments'));
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
        type: item.type || 'ADMINISTRATION',
        description: item.description || '',
        contactPhone: item.contactPhone || '',
        contactEmail: item.contactEmail || '',
        officeLocation: item.officeLocation || '',
        isActive: item.isActive !== false
      });
    } else {
      setEditingItem(null);
      setFormData({
        municipalityId: municipalities.length > 0 ? municipalities[0]._id : '',
        name: '',
        code: '',
        type: 'ADMINISTRATION',
        description: '',
        contactPhone: '',
        contactEmail: '',
        officeLocation: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/departments/${editingItem._id}`, formData);
        dispatch(showToast('Department updated successfully'));
      } else {
        await api.post('/departments', formData);
        dispatch(showToast('Department created successfully'));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      dispatch(showToast(err.response?.data?.message || 'Failed to save department'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await api.delete(`/departments/${id}`);
        dispatch(showToast('Department deleted successfully'));
        fetchData();
      } catch (err) {
        dispatch(showToast(err.response?.data?.message || 'Failed to delete department'));
      }
    }
  };

  const inputStyles = {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--line)',
    borderRadius: '8px',
    color: 'var(--ink)',
  };

  const filteredMunicipalities = districtFilter
    ? municipalities.filter(m => m.district === districtFilter)
    : municipalities;

  const filteredData = data.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const itemMuniId = item.municipalityId?._id || item.municipalityId;
    const itemMuni = municipalities.find(m => m._id === itemMuniId);
    
    const matchesDistrict = districtFilter ? itemMuni?.district === districtFilter : true;
    const matchesMunicipality = municipalityFilter ? itemMuniId === municipalityFilter : true;
    const matchesStatus = statusFilter ? (statusFilter === 'ACTIVE' ? item.isActive === true : item.isActive === false) : true;
    
    return matchesSearch && matchesDistrict && matchesMunicipality && matchesStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
          Departments
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          + Add Department
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input 
          type="text" 
          placeholder="Search departments..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 text-[14px] outline-none w-64"
          style={inputStyles}
        />
        <select
          value={districtFilter}
          onChange={(e) => {
            setDistrictFilter(e.target.value);
            setMunicipalityFilter('');
          }}
          className="px-3 py-2 text-[14px] outline-none"
          style={inputStyles}
        >
          <option value="">All Districts</option>
          {MAHARASHTRA_DISTRICTS.map(dist => (
            <option key={dist} value={dist}>{dist}</option>
          ))}
        </select>
        <select
          value={municipalityFilter}
          onChange={(e) => setMunicipalityFilter(e.target.value)}
          className="px-3 py-2 text-[14px] outline-none w-64 truncate"
          style={inputStyles}
        >
          <option value="">All Municipalities</option>
          {filteredMunicipalities.map(m => (
            <option key={m._id} value={m._id}>{m.name}</option>
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
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Name / Code</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Type</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Municipality</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Contact</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Status</th>
                <th className="pb-3 font-semibold text-right" style={{ color: 'var(--muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map(item => (
                  <tr key={item._id} className="group" style={{ borderBottom: '1px solid var(--line)' }}>
                    <td className="py-4">
                      <div className="font-medium" style={{ color: 'var(--ink)' }}>{item.name}</div>
                      <div className="text-xs font-mono" style={{ color: 'var(--primary)' }}>{item.code}</div>
                    </td>
                    <td className="py-4 text-xs" style={{ color: 'var(--muted)' }}>
                      {item.type?.replace('_', ' ')}
                    </td>
                    <td className="py-4 text-xs" style={{ color: 'var(--muted)' }}>
                      {item.municipalityId?.name || 'N/A'}
                    </td>
                    <td className="py-4 text-xs" style={{ color: 'var(--muted)' }}>
                      <div>{item.contactPhone || '-'}</div>
                      <div>{item.contactEmail || '-'}</div>
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
                    No departments found.
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
        title={editingItem ? 'Edit Department' : 'Add Department'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Municipality *</label>
            <select
              required
              value={formData.municipalityId}
              onChange={(e) => setFormData({...formData, municipalityId: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none"
              style={inputStyles}
            >
              <option value="" disabled>Select Municipality</option>
              {municipalities.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Department Name *</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="px-3 py-2 text-[14px] outline-none"
                style={inputStyles}
              >
                {DEPT_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Office Location</label>
              <input
                type="text"
                value={formData.officeLocation}
                onChange={(e) => setFormData({...formData, officeLocation: e.target.value})}
                className="px-3 py-2 text-[14px] outline-none"
                style={inputStyles}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Contact Phone</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                className="px-3 py-2 text-[14px] outline-none"
                style={inputStyles}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                className="px-3 py-2 text-[14px] outline-none"
                style={inputStyles}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none resize-none"
              style={inputStyles}
              rows={2}
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
              {editingItem ? 'Save Changes' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DepartmentManager;
