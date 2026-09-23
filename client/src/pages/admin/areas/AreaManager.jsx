import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosConfig.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/uiSlice.js';
import Modal from '../../../components/Modal.jsx';
import { MAHARASHTRA_DISTRICTS } from '../../../constants/maharashtraDistricts.js';
import SearchableSelect from '../../../components/common/SearchableSelect.jsx';

function AreaManager() {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [municipalityFilter, setMunicipalityFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    municipalityId: '',
    wardId: '',
    name: '',
    code: '',
    description: '',
    pincode: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
    fetchMunicipalities();
  }, []);

  // When municipality changes in formData, fetch wards for that municipality
  useEffect(() => {
    if (formData.municipalityId) {
      fetchWards(formData.municipalityId);
    } else {
      setWards([]);
    }
  }, [formData.municipalityId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/areas');
      setData(res.data.data?.results || res.data.data || res.data || []);
    } catch (err) {
      dispatch(showToast('Failed to fetch areas'));
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

  const fetchWards = async (muniId) => {
    try {
      const res = await api.get(`/wards?municipalityId=${muniId}`);
      const list = res.data.data?.results || res.data.data || res.data || [];
      setWards(list);
    } catch (err) {
      console.error('Failed to fetch wards', err);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        municipalityId: item.municipalityId?._id || item.municipalityId || '',
        wardId: item.wardId?._id || item.wardId || '',
        name: item.name || '',
        code: item.code || '',
        description: item.description || '',
        pincode: item.pincode || '',
        isActive: item.isActive !== false
      });
    } else {
      setEditingItem(null);
      setFormData({
        municipalityId: municipalities.length > 0 ? municipalities[0]._id : '',
        wardId: '',
        name: '',
        code: '',
        description: '',
        pincode: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/areas/${editingItem._id}`, formData);
        dispatch(showToast('Area updated successfully'));
      } else {
        await api.post('/areas', formData);
        dispatch(showToast('Area created successfully'));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      dispatch(showToast(err.response?.data?.message || 'Failed to save area'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this area?')) {
      try {
        await api.delete(`/areas/${id}`);
        dispatch(showToast('Area deleted successfully'));
        fetchData();
      } catch (err) {
        dispatch(showToast(err.response?.data?.message || 'Failed to delete area'));
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

  // For the filter bar, we need all wards in the selected municipality if one is selected,
  // but AreaManager only fetches wards for the FORM when `formData.municipalityId` changes.
  // Actually, we can just filter `data` directly based on what's in the data item.
  // `item.wardId` has `_id`, `name`, `wardNumber`. 
  // We can derive municipality from `item.municipalityId`.
  
  const filteredData = data.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.pincode?.includes(searchTerm);
    
    const itemMuniId = item.municipalityId?._id || item.municipalityId;
    const itemMuni = municipalities.find(m => m._id === itemMuniId);
    const itemWardId = item.wardId?._id || item.wardId;
    
    const matchesDistrict = districtFilter ? itemMuni?.district === districtFilter : true;
    const matchesMunicipality = municipalityFilter ? itemMuniId === municipalityFilter : true;
    const matchesWard = wardFilter ? itemWardId === wardFilter : true;
    const matchesStatus = statusFilter ? (statusFilter === 'ACTIVE' ? item.isActive === true : item.isActive === false) : true;
    
    return matchesSearch && matchesDistrict && matchesMunicipality && matchesWard && matchesStatus;
  });

  // Extract unique wards from the loaded areas for the ward filter dropdown
  const availableWardsForFilter = Array.from(new Set(
    data
      .filter(item => !municipalityFilter || (item.municipalityId?._id || item.municipalityId) === municipalityFilter)
      .map(item => item.wardId)
      .filter(Boolean)
  )).reduce((acc, current) => {
    const x = acc.find(item => item._id === current._id);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
          Areas / Localities
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          + Add Area
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input 
          type="text" 
          placeholder="Search areas..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 text-[14px] outline-none w-48"
          style={inputStyles}
        />
        <div className="w-full sm:w-48">
          <SearchableSelect
            name="districtFilter"
            options={MAHARASHTRA_DISTRICTS.map(dist => ({ value: dist, label: dist }))}
            value={districtFilter}
            onChange={(e) => {
              setDistrictFilter(e.target.value);
              setMunicipalityFilter('');
              setWardFilter('');
            }}
            placeholder="All Districts"
          />
        </div>
        <div className="w-full sm:w-48">
          <SearchableSelect
            name="municipalityFilter"
            options={filteredMunicipalities.map(m => ({ value: m._id, label: m.name }))}
            value={municipalityFilter}
            onChange={(e) => {
              setMunicipalityFilter(e.target.value);
              setWardFilter('');
            }}
            placeholder="All Municipalities"
          />
        </div>
        <div className="w-full sm:w-48">
          <SearchableSelect
            name="wardFilter"
            options={availableWardsForFilter.map(w => ({ value: w._id, label: `Ward ${w.wardNumber}` }))}
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            placeholder="All Wards"
          />
        </div>
        <div className="w-40">
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
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Name / Code</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Ward</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Municipality</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Pincode</th>
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
                    <td className="py-4" style={{ color: 'var(--muted)' }}>
                      {item.wardId?.wardNumber ? `Ward ${item.wardId.wardNumber} - ${item.wardId.name}` : 'N/A'}
                    </td>
                    <td className="py-4 text-xs" style={{ color: 'var(--muted)' }}>
                      {item.municipalityId?.name || 'N/A'}
                    </td>
                    <td className="py-4 font-mono text-xs" style={{ color: 'var(--muted)' }}>{item.pincode || '-'}</td>
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
                    No areas found.
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
        title={editingItem ? 'Edit Area' : 'Add Area'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Municipality *</label>
              <SearchableSelect
                name="municipalityId"
                options={municipalities.map(m => ({ value: m._id, label: m.name }))}
                value={formData.municipalityId}
                onChange={(e) => {
                  setFormData({...formData, municipalityId: e.target.value, wardId: ''});
                }}
                placeholder="Select Municipality"
                isClearable={false}
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Ward *</label>
              <SearchableSelect
                name="wardId"
                options={wards.map(w => ({ value: w._id, label: `Ward ${w.wardNumber} - ${w.name}` }))}
                value={formData.wardId}
                onChange={(e) => setFormData({...formData, wardId: e.target.value})}
                placeholder="Select Ward"
                isDisabled={!formData.municipalityId}
                isClearable={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Area Name *</label>
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
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Area Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="px-3 py-2 text-[14px] outline-none uppercase"
                style={inputStyles}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Pincode</label>
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => setFormData({...formData, pincode: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none"
              style={inputStyles}
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
              {editingItem ? 'Save Changes' : 'Create Area'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AreaManager;
