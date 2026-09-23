import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosConfig.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/uiSlice.js';
import Modal from '../../../components/Modal.jsx';
import SearchableSelect from '../../../components/common/SearchableSelect.jsx';

function PanchayatSamitiManager() {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);
  const [zillaParishads, setZillaParishads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [lgdCodeTerm, setLgdCodeTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [talukaFilter, setTalukaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedLgdCode, setAppliedLgdCode] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    marathiName: '',
    lgdCode: '',
    districtId: '',
    talukaId: '',
    zillaParishadId: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchDistricts();
    fetchTalukas();
    fetchZillaParishads();
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, districtFilter, talukaFilter, statusFilter, appliedSearch, appliedLgdCode]);

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

  const fetchZillaParishads = async () => {
    try {
      // Get all ZPs for dropdown (fetch with high limit)
      const res = await api.get('/zilla-parishads?limit=100');
      setZillaParishads(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch Zilla Parishads', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      let queryParams = `?page=${page}&limit=${limit}`;
      if (appliedSearch) queryParams += `&search=${encodeURIComponent(appliedSearch)}`;
      if (appliedLgdCode) queryParams += `&lgdCode=${encodeURIComponent(appliedLgdCode)}`;
      if (districtFilter) queryParams += `&districtId=${districtFilter}`;
      if (talukaFilter) queryParams += `&talukaId=${talukaFilter}`;
      if (statusFilter) queryParams += `&status=${statusFilter}`;

      const res = await api.get(`/panchayat-samitis${queryParams}`);
      setData(res.data.data || []);
      
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.pages);
        setTotalRecords(res.data.pagination.total);
      }
    } catch (err) {
      dispatch(showToast('Failed to fetch Panchayat Samitis'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = () => {
    setPage(1);
    setAppliedSearch(searchTerm);
    setAppliedLgdCode(lgdCodeTerm);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setLgdCodeTerm('');
    setAppliedSearch('');
    setAppliedLgdCode('');
    setDistrictFilter('');
    setTalukaFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        marathiName: item.marathiName || '',
        lgdCode: item.lgdCode || '',
        districtId: item.districtId?._id || item.districtId || '',
        talukaId: item.talukaId?._id || item.talukaId || '',
        zillaParishadId: item.zillaParishadId?._id || item.zillaParishadId || '',
        status: item.status || 'ACTIVE'
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        marathiName: '',
        lgdCode: '',
        districtId: '',
        talukaId: '',
        zillaParishadId: '',
        status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedDistrict = districts.find(d => d._id === formData.districtId);
      const selectedTaluka = talukas.find(t => t._id === formData.talukaId);
      
      const submitData = {
        ...formData,
        districtName: selectedDistrict ? selectedDistrict.name : null,
        talukaName: selectedTaluka ? selectedTaluka.name : null
      };

      if (editingItem) {
        await api.put(`/panchayat-samitis/${editingItem._id}`, submitData);
        dispatch(showToast('Panchayat Samiti updated successfully'));
      } else {
        await api.post('/panchayat-samitis', submitData);
        dispatch(showToast('Panchayat Samiti created successfully'));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      dispatch(showToast(err.response?.data?.message || 'Failed to save Panchayat Samiti'));
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>
            Panchayat Samitis (Block Level)
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Manage {totalRecords > 0 ? totalRecords.toLocaleString() : '...'} Panchayat Samitis.
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          + Add Panchayat Samiti
        </button>
      </div>

      <div className="p-4 mb-6 rounded-xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
            className="px-3 py-2 text-[14px] outline-none"
            style={inputStyles}
          />
          <input
            type="text"
            placeholder="LGD Code..."
            value={lgdCodeTerm}
            onChange={(e) => setLgdCodeTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
            className="px-3 py-2 text-[14px] outline-none"
            style={inputStyles}
          />
          <div className="w-48">
            <SearchableSelect
              name="districtFilter"
              options={districts.map(dist => ({ value: dist._id, label: dist.name }))}
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setTalukaFilter('');
                setPage(1);
              }}
              placeholder="All Districts"
            />
          </div>
          <div className="w-48">
            <SearchableSelect
              name="talukaFilter"
              options={talukas
                .filter(t => !districtFilter || t.districtId?._id === districtFilter || t.districtId === districtFilter)
                .map(t => ({ value: t._id, label: t.name }))}
              value={talukaFilter}
              onChange={(e) => {
                setTalukaFilter(e.target.value);
                setPage(1);
              }}
              placeholder="All Talukas"
              isDisabled={!districtFilter}
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
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              placeholder="All Status"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSearchClick}
            className="px-4 py-1.5 text-sm font-medium rounded-lg text-white"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Search
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-1.5 text-sm font-medium rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--line)' }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div 
        className="rounded-xl overflow-hidden" 
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
      >
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--line)' }}>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--muted)' }}>LGD Code</th>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--muted)' }}>Name</th>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--muted)' }}>District</th>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--muted)' }}>Taluka / Block</th>
                <th className="px-4 py-3 font-semibold" style={{ color: 'var(--muted)' }}>Status</th>
                <th className="px-4 py-3 font-semibold text-right" style={{ color: 'var(--muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center" style={{ color: 'var(--muted)' }}>
                    Loading Panchayat Samitis...
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map(item => (
                  <tr key={item._id} className="group hover:bg-black/5" style={{ borderBottom: '1px solid var(--line)' }}>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--primary)' }}>{item.lgdCode}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--ink)' }}>
                      <div>{item.name}</div>
                      {item.marathiName && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{item.marathiName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>
                      {item.districtName || (item.districtId ? (districts.find(d => d._id === item.districtId)?.name || item.districtId) : '—')}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>
                      {item.talukaName || (item.talukaId ? (talukas.find(t => t._id === item.talukaId)?.name || item.talukaId) : '—')}
                    </td>
                    <td className="px-4 py-3">
                      <span 
                        className="px-2 py-1 text-[11px] font-medium rounded-md"
                        style={{
                          backgroundColor: item.status === 'ACTIVE' ? 'var(--status-verified-bg)' : 'var(--status-rejected-bg)',
                          color: item.status === 'ACTIVE' ? 'var(--status-verified-text)' : 'var(--status-rejected-text)',
                        }}
                      >
                        {item.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="text-xs font-medium transition-colors hover:opacity-80"
                        style={{ color: 'var(--primary)' }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center" style={{ color: 'var(--muted)' }}>
                    No Panchayat Samitis found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!loading && data.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--line)', backgroundColor: 'var(--bg)' }}>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalRecords)} of {totalRecords} entries
            </div>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
              >
                Previous
              </button>
              <div className="flex items-center px-2 text-sm font-medium">
                Page {page} of {totalPages}
              </div>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Panchayat Samiti' : 'Add Panchayat Samiti'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>LGD Code *</label>
              <input
                type="text"
                required
                value={formData.lgdCode}
                onChange={(e) => setFormData({...formData, lgdCode: e.target.value})}
                className="px-3 py-2 text-[14px] outline-none"
                style={inputStyles}
                disabled={!!editingItem}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Name (English) *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="px-3 py-2 text-[14px] outline-none"
                style={inputStyles}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Name (Local Language)</label>
              <input
                type="text"
                value={formData.marathiName}
                onChange={(e) => setFormData({...formData, marathiName: e.target.value})}
                className="px-3 py-2 text-[14px] outline-none"
                style={inputStyles}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Zilla Parishad</label>
              <SearchableSelect
                name="zillaParishadId"
                options={zillaParishads.map(zp => ({ value: zp._id, label: zp.name }))}
                value={formData.zillaParishadId}
                onChange={(e) => setFormData({...formData, zillaParishadId: e.target.value})}
                placeholder="Select Zilla Parishad"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>District *</label>
              <SearchableSelect
                name="districtId"
                options={districts.map(dist => ({ value: dist._id, label: dist.name }))}
                value={formData.districtId}
                onChange={(e) => setFormData({...formData, districtId: e.target.value, talukaId: ''})}
                placeholder="Select District"
                isClearable={false}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Taluka</label>
              <SearchableSelect
                name="talukaId"
                options={talukas
                  .filter(t => t.districtId?._id === formData.districtId || t.districtId === formData.districtId)
                  .map(t => ({ value: t._id, label: t.name }))}
                value={formData.talukaId}
                onChange={(e) => setFormData({...formData, talukaId: e.target.value})}
                placeholder="Select Taluka"
                isDisabled={!formData.districtId}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.status === 'ACTIVE'}
              onChange={(e) => setFormData({...formData, status: e.target.checked ? 'ACTIVE' : 'INACTIVE'})}
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
              {editingItem ? 'Save Changes' : 'Create Panchayat Samiti'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PanchayatSamitiManager;
