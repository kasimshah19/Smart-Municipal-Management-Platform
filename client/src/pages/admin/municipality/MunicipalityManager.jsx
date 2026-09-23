import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosConfig.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/uiSlice.js';
import Modal from '../../../components/Modal.jsx';
import { LOCAL_BODY_TYPES, LOCAL_BODY_TYPE_OPTIONS } from '../../../constants/localBodyTypes.js';
import { MAHARASHTRA_DISTRICTS } from '../../../constants/maharashtraDistricts.js';

function MunicipalityManager() {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [talukaFilter, setTalukaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: LOCAL_BODY_TYPES.MUNICIPAL_COUNCIL.value,
    district: '',
    talukaId: '',
    state: 'Maharashtra',
    country: 'India',
    address: '',
    pincode: '',
    contactPhone: '',
    contactEmail: '',
    website: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
    fetchDivisions();
    fetchDistricts();
    fetchTalukas();
  }, []);

  const fetchDivisions = async () => {
    try {
      const res = await api.get('/geography/divisions');
      setDivisions(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch divisions', err);
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

  const fetchTalukas = async () => {
    try {
      const res = await api.get('/geography/talukas');
      setTalukas(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch talukas', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/municipalities?limit=2000');
      setData(res.data.data?.results || res.data.data || res.data || []);
    } catch (err) {
      dispatch(showToast('Failed to fetch municipalities'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null, defaultType = LOCAL_BODY_TYPES.MUNICIPAL_COUNCIL.value) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        code: item.code || '',
        type: item.type || LOCAL_BODY_TYPES.MUNICIPAL_COUNCIL.value,
        district: item.district || '',
        talukaId: item.talukaId?._id || item.talukaId || '',
        state: item.state || 'Maharashtra',
        country: item.country || 'India',
        address: item.address || '',
        pincode: item.pincode || '',
        contactPhone: item.contactPhone || '',
        contactEmail: item.contactEmail || '',
        website: item.website || '',
        isActive: item.isActive !== false
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        code: '',
        type: defaultType,
        district: '',
        talukaId: '',
        state: 'Maharashtra',
        country: 'India',
        address: '',
        pincode: '',
        contactPhone: '',
        contactEmail: '',
        website: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/municipalities/${editingItem._id}`, formData);
        dispatch(showToast('Municipality updated successfully'));
      } else {
        await api.post('/municipalities', formData);
        dispatch(showToast('Municipality created successfully'));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      dispatch(showToast(err.response?.data?.message || 'Failed to save municipality'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this municipality?')) {
      try {
        await api.delete(`/municipalities/${id}`);
        dispatch(showToast('Municipality deleted successfully'));
        fetchData();
      } catch (err) {
        dispatch(showToast(err.response?.data?.message || 'Failed to delete municipality'));
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
    const matchesType = typeFilter ? item.type === typeFilter : true;
    
    // The municipality district field is a string name or ID.
    // The geography mapping: division -> district -> taluka -> municipality
    // But municipality schema currently only has district (String) and talukaId (ObjectId).
    
    const matchesDistrict = districtFilter ? 
      (item.district === districts.find(d => d._id === districtFilter)?.name || item.district === districtFilter) : true;
      
    const matchesTaluka = talukaFilter ? (item.talukaId?._id === talukaFilter || item.talukaId === talukaFilter) : true;
      
    const matchesStatus = statusFilter ? (statusFilter === 'ACTIVE' ? item.isActive === true : item.isActive === false) : true;
    
    return matchesSearch && matchesType && matchesDistrict && matchesTaluka && matchesStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
          Local Bodies
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => handleOpenModal(null, LOCAL_BODY_TYPES.MUNICIPAL_CORPORATION.value)}
            className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            + Add Maha Nagar Palika
          </button>
          <button 
            onClick={() => handleOpenModal(null, LOCAL_BODY_TYPES.MUNICIPAL_COUNCIL.value)}
            className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            + Add Nagar Palika
          </button>
          <button 
            onClick={() => handleOpenModal(null, LOCAL_BODY_TYPES.MUNICIPAL_COUNCIL.value)}
            className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            + Add Nagar Parishad
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 text-[14px] outline-none flex-1 min-w-[200px]"
          style={inputStyles}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-[14px] outline-none"
          style={inputStyles}
        >
          <option value="">All Types</option>
          {LOCAL_BODY_TYPE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={divisionFilter}
          onChange={(e) => {
            setDivisionFilter(e.target.value);
            setDistrictFilter('');
            setTalukaFilter('');
          }}
          className="px-3 py-2 text-[14px] outline-none"
          style={inputStyles}
        >
          <option value="">All Divisions</option>
          {divisions.map(div => (
            <option key={div._id} value={div._id}>{div.name}</option>
          ))}
        </select>
        <select
          value={districtFilter}
          onChange={(e) => {
            setDistrictFilter(e.target.value);
            setTalukaFilter('');
          }}
          className="px-3 py-2 text-[14px] outline-none"
          style={inputStyles}
          disabled={!!divisionFilter && districts.filter(d => d.divisionId?._id === divisionFilter || d.divisionId === divisionFilter).length === 0}
        >
          <option value="">All Districts</option>
          {districts
            .filter(d => !divisionFilter || d.divisionId?._id === divisionFilter || d.divisionId === divisionFilter)
            .map(dist => (
              <option key={dist._id} value={dist._id}>{dist.name}</option>
            ))
          }
        </select>
        <select
          value={talukaFilter}
          onChange={(e) => setTalukaFilter(e.target.value)}
          className="px-3 py-2 text-[14px] outline-none"
          style={inputStyles}
          disabled={!districtFilter}
        >
          <option value="">All Talukas</option>
          {talukas
            .filter(t => !districtFilter || t.districtId?._id === districtFilter || t.districtId === districtFilter)
            .map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))
          }
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
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Code</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Type</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Division</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>District</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Taluka</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Status</th>
                <th className="pb-3 font-semibold text-right" style={{ color: 'var(--muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map(item => {
                  const typeObj = LOCAL_BODY_TYPES[item.type];
                  return (
                    <tr key={item._id} className="group" style={{ borderBottom: '1px solid var(--line)' }}>
                      <td className="py-4 font-medium" style={{ color: 'var(--ink)' }}>{item.name}</td>
                      <td className="py-4 font-mono text-xs" style={{ color: 'var(--primary)' }}>{item.code}</td>
                      <td className="py-4 text-xs" style={{ color: 'var(--muted)' }}>
                        <div>{typeObj ? typeObj.label : item.type?.replace('_', ' ')}</div>
                        {typeObj && <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>{typeObj.marathiLabel}</div>}
                      </td>
                      <td className="py-4" style={{ color: 'var(--muted)' }}>
                        {(() => {
                          const dist = districts.find(d => d.name === item.district);
                          const divId = dist?.divisionId?._id || dist?.divisionId;
                          const div = divisions.find(d => d._id === divId);
                          return div ? div.name : '-';
                        })()}
                      </td>
                      <td className="py-4" style={{ color: 'var(--muted)' }}>{item.district}</td>
                      <td className="py-4" style={{ color: 'var(--muted)' }}>
                        {(() => {
                          if (!item.talukaId) return '-';
                          const tId = typeof item.talukaId === 'object' ? item.talukaId._id : item.talukaId;
                          const taluka = talukas.find(t => t._id === tId);
                          return taluka ? taluka.name : tId;
                        })()}
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center" style={{ color: 'var(--muted)' }}>
                    No municipalities found.
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
        title={editingItem ? 'Edit Municipality' : 'Add Municipality'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
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
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Local Body Type *</label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none"
              style={inputStyles}
            >
              {LOCAL_BODY_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.marathiLabel})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>District *</label>
              <select
                required
                value={formData.district}
                onChange={(e) => setFormData({...formData, district: e.target.value, talukaId: ''})}
                className="px-3 py-2 text-[14px] outline-none"
                style={inputStyles}
              >
                <option value="" disabled>Select District</option>
                {districts.map(dist => (
                  <option key={dist.name} value={dist.name}>{dist.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Taluka</label>
              <select
                value={formData.talukaId}
                onChange={(e) => setFormData({...formData, talukaId: e.target.value})}
                className="px-3 py-2 text-[14px] outline-none"
                style={inputStyles}
                disabled={!formData.district}
              >
                <option value="">Select Taluka</option>
                {talukas
                  .filter(t => {
                    const distObj = districts.find(d => d.name === formData.district);
                    return distObj && (t.districtId?._id === distObj._id || t.districtId === distObj._id);
                  })
                  .map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>State</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({...formData, state: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none"
              style={inputStyles}
            />
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
              {editingItem ? 'Save Changes' : 'Create Municipality'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default MunicipalityManager;
