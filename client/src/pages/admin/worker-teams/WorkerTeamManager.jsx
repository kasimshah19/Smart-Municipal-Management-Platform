import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosConfig.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/uiSlice.js';
import Modal from '../../../components/Modal.jsx';

function WorkerTeamManager() {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  
  // Lookup data for dropdowns
  const [municipalities, setMunicipalities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [wards, setWards] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    municipalityId: '',
    departmentId: '',
    name: '',
    code: '',
    description: '',
    teamLeaderId: '',
    memberIds: [],
    assignedWardIds: [],
    isActive: true
  });

  useEffect(() => {
    fetchData();
    fetchLookups();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/worker-teams');
      setData(res.data.data?.results || res.data.data || res.data || []);
    } catch (err) {
      dispatch(showToast('Failed to fetch worker teams'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [muniRes, deptRes, empRes, wardRes] = await Promise.all([
        api.get('/municipalities'),
        api.get('/departments'),
        api.get('/employees'),
        api.get('/wards')
      ]);
      setMunicipalities(muniRes.data.data?.results || muniRes.data.data || []);
      setDepartments(deptRes.data.data?.results || deptRes.data.data || []);
      setEmployees(empRes.data.data?.results || empRes.data.data || []);
      setWards(wardRes.data.data?.results || wardRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch lookup data', err);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        municipalityId: item.municipalityId?._id || item.municipalityId || '',
        departmentId: item.departmentId?._id || item.departmentId || '',
        name: item.name || '',
        code: item.code || '',
        description: item.description || '',
        teamLeaderId: item.teamLeaderId?._id || item.teamLeaderId || '',
        memberIds: item.memberIds?.map(m => m._id || m) || [],
        assignedWardIds: item.assignedWardIds?.map(w => w._id || w) || [],
        isActive: item.isActive !== false
      });
    } else {
      setEditingItem(null);
      setFormData({
        municipalityId: municipalities.length > 0 ? municipalities[0]._id : '',
        departmentId: '',
        name: '',
        code: '',
        description: '',
        teamLeaderId: '',
        memberIds: [],
        assignedWardIds: [],
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/worker-teams/${editingItem._id}`, formData);
        dispatch(showToast('Worker team updated successfully'));
      } else {
        await api.post('/worker-teams', formData);
        dispatch(showToast('Worker team created successfully'));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      dispatch(showToast(err.response?.data?.message || 'Failed to save worker team'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this worker team?')) {
      try {
        await api.delete(`/worker-teams/${id}`);
        dispatch(showToast('Worker team deleted successfully'));
        fetchData();
      } catch (err) {
        dispatch(showToast(err.response?.data?.message || 'Failed to delete worker team'));
      }
    }
  };

  const inputStyles = {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--line)',
    borderRadius: '8px',
    color: 'var(--ink)',
  };

  // Filters based on selected municipality
  const filteredDepartments = formData.municipalityId 
    ? departments.filter(d => (d.municipalityId?._id || d.municipalityId) === formData.municipalityId)
    : departments;

  const filteredEmployees = formData.municipalityId 
    ? employees.filter(e => (e.municipalityId?._id || e.municipalityId) === formData.municipalityId)
    : employees;

  const filteredWards = formData.municipalityId 
    ? wards.filter(w => (w.municipalityId?._id || w.municipalityId) === formData.municipalityId)
    : wards;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
          Worker Teams
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          + Add Team
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
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Department</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Leader</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Members</th>
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
                    <td className="py-4 text-xs" style={{ color: 'var(--muted)' }}>
                      {item.departmentId?.name || 'N/A'}
                    </td>
                    <td className="py-4 text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                      {item.teamLeaderId?.employeeCode || 'Unassigned'}
                    </td>
                    <td className="py-4 text-xs" style={{ color: 'var(--muted)' }}>
                      {item.memberIds?.length || 0} members
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
                    No worker teams found.
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
        title={editingItem ? 'Edit Worker Team' : 'Add Worker Team'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Municipality *</label>
              <select
                required
                value={formData.municipalityId}
                onChange={(e) => setFormData({
                  ...formData, 
                  municipalityId: e.target.value,
                  departmentId: '',
                  teamLeaderId: '',
                  memberIds: [],
                  assignedWardIds: []
                })}
                className="px-3 py-2 text-[14px] outline-none"
                style={inputStyles}
              >
                <option value="" disabled>Select Municipality</option>
                {municipalities.map(m => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Department *</label>
              <select
                required
                value={formData.departmentId}
                onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                className="px-3 py-2 text-[14px] outline-none"
                style={inputStyles}
                disabled={!formData.municipalityId}
              >
                <option value="" disabled>Select Department</option>
                {filteredDepartments.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Team Name *</label>
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
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Team Leader</label>
            <select
              value={formData.teamLeaderId}
              onChange={(e) => setFormData({...formData, teamLeaderId: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none"
              style={inputStyles}
              disabled={!formData.municipalityId}
            >
              <option value="">Select Leader</option>
              {filteredEmployees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.employeeCode} - {emp.phone}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Team Members (Multi-select)</label>
            <select
              multiple
              value={formData.memberIds}
              onChange={(e) => {
                const options = [...e.target.selectedOptions];
                const values = options.map(option => option.value);
                setFormData({...formData, memberIds: values});
              }}
              className="px-3 py-2 text-[14px] outline-none"
              style={{ ...inputStyles, height: '80px' }}
              disabled={!formData.municipalityId}
            >
              {filteredEmployees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.employeeCode} - {emp.phone}</option>
              ))}
            </select>
            <p className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>Hold Ctrl/Cmd to select multiple</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Assigned Wards (Multi-select)</label>
            <select
              multiple
              value={formData.assignedWardIds}
              onChange={(e) => {
                const options = [...e.target.selectedOptions];
                const values = options.map(option => option.value);
                setFormData({...formData, assignedWardIds: values});
              }}
              className="px-3 py-2 text-[14px] outline-none"
              style={{ ...inputStyles, height: '80px' }}
              disabled={!formData.municipalityId}
            >
              {filteredWards.map(w => (
                <option key={w._id} value={w._id}>Ward {w.wardNumber} - {w.name}</option>
              ))}
            </select>
            <p className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>Hold Ctrl/Cmd to select multiple</p>
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
              {editingItem ? 'Save Changes' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default WorkerTeamManager;
