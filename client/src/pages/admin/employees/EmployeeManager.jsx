import React, { useState, useEffect } from 'react';
import api from '../../../utils/axiosConfig.js';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/uiSlice.js';
import Modal from '../../../components/Modal.jsx';
import SearchableSelect from '../../../components/common/SearchableSelect.jsx';

const EMPLOYEE_TYPES = ['OFFICER', 'WORKER', 'STAFF'];

function EmployeeManager() {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  
  // Lookup data for dropdowns
  const [municipalities, setMunicipalities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [wards, setWards] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    userId: '', // Admin must input User ID manually for now
    municipalityId: '',
    departmentId: '',
    designationId: '',
    employeeCode: '',
    employeeType: 'STAFF',
    phone: '',
    workEmail: '',
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
      const res = await api.get('/employees');
      setData(res.data.data?.results || res.data.data || res.data || []);
    } catch (err) {
      dispatch(showToast('Failed to fetch employees'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [muniRes, deptRes, desigRes, wardRes] = await Promise.all([
        api.get('/municipalities'),
        api.get('/departments'),
        api.get('/designations'),
        api.get('/wards')
      ]);
      setMunicipalities(muniRes.data.data?.results || muniRes.data.data || []);
      setDepartments(deptRes.data.data?.results || deptRes.data.data || []);
      setDesignations(desigRes.data.data?.results || desigRes.data.data || []);
      setWards(wardRes.data.data?.results || wardRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch lookup data', err);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        userId: item.userId?._id || item.userId || '',
        municipalityId: item.municipalityId?._id || item.municipalityId || '',
        departmentId: item.departmentId?._id || item.departmentId || '',
        designationId: item.designationId?._id || item.designationId || '',
        employeeCode: item.employeeCode || '',
        employeeType: item.employeeType || 'STAFF',
        phone: item.phone || '',
        workEmail: item.workEmail || '',
        assignedWardIds: item.assignedWardIds?.map(w => w._id || w) || [],
        isActive: item.isActive !== false
      });
    } else {
      setEditingItem(null);
      setFormData({
        userId: '',
        municipalityId: municipalities.length > 0 ? municipalities[0]._id : '',
        departmentId: '',
        designationId: '',
        employeeCode: '',
        employeeType: 'STAFF',
        phone: '',
        workEmail: '',
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
        await api.put(`/employees/${editingItem._id}`, formData);
        dispatch(showToast('Employee updated successfully'));
      } else {
        await api.post('/employees', formData);
        dispatch(showToast('Employee created successfully'));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      dispatch(showToast(err.response?.data?.message || 'Failed to save employee'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/employees/${id}`);
        dispatch(showToast('Employee deleted successfully'));
        fetchData();
      } catch (err) {
        dispatch(showToast(err.response?.data?.message || 'Failed to delete employee'));
      }
    }
  };

  const inputStyles = {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--line)',
    borderRadius: '8px',
    color: 'var(--ink)',
  };

  // Filter departments and designations based on selected municipality
  const filteredDepartments = formData.municipalityId 
    ? departments.filter(d => (d.municipalityId?._id || d.municipalityId) === formData.municipalityId)
    : departments;
    
  const filteredDesignations = formData.municipalityId 
    ? designations.filter(d => (d.municipalityId?._id || d.municipalityId) === formData.municipalityId)
    : designations;

  const filteredWards = formData.municipalityId 
    ? wards.filter(w => (w.municipalityId?._id || w.municipalityId) === formData.municipalityId)
    : wards;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
          Employees
        </h2>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          + Add Employee
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
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Code</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Type</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Department</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Designation</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Contact</th>
                <th className="pb-3 font-semibold" style={{ color: 'var(--muted)' }}>Status</th>
                <th className="pb-3 font-semibold text-right" style={{ color: 'var(--muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map(item => (
                  <tr key={item._id} className="group" style={{ borderBottom: '1px solid var(--line)' }}>
                    <td className="py-4 font-mono font-bold" style={{ color: 'var(--primary)' }}>
                      {item.employeeCode}
                    </td>
                    <td className="py-4 text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                      {item.employeeType}
                    </td>
                    <td className="py-4 text-xs" style={{ color: 'var(--muted)' }}>
                      {item.departmentId?.name || 'N/A'}
                    </td>
                    <td className="py-4 text-xs" style={{ color: 'var(--muted)' }}>
                      {item.designationId?.name || 'N/A'}
                    </td>
                    <td className="py-4 text-xs" style={{ color: 'var(--muted)' }}>
                      <div>{item.phone || '-'}</div>
                      <div>{item.workEmail || '-'}</div>
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
                  <td colSpan="7" className="py-8 text-center" style={{ color: 'var(--muted)' }}>
                    No employees found.
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
        title={editingItem ? 'Edit Employee' : 'Add Employee'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>User ID (MongoDB ObjectID) *</label>
            <input
              type="text"
              required
              value={formData.userId}
              onChange={(e) => setFormData({...formData, userId: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none font-mono text-xs"
              style={inputStyles}
              placeholder="e.g. 64b8a1c93f..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Municipality *</label>
              <SearchableSelect
                name="municipalityId"
                options={municipalities.map(m => ({ value: m._id, label: m.name }))}
                value={formData.municipalityId}
                onChange={(e) => setFormData({
                  ...formData, 
                  municipalityId: e.target.value,
                  departmentId: '',
                  designationId: '',
                  assignedWardIds: []
                })}
                placeholder="Select Municipality"
                isClearable={false}
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Employee Type *</label>
              <SearchableSelect
                name="employeeType"
                options={EMPLOYEE_TYPES.map(t => ({ value: t, label: t }))}
                value={formData.employeeType}
                onChange={(e) => setFormData({...formData, employeeType: e.target.value})}
                placeholder="Select Employee Type"
                isClearable={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Department *</label>
              <SearchableSelect
                name="departmentId"
                options={filteredDepartments.map(d => ({ value: d._id, label: d.name }))}
                value={formData.departmentId}
                onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                placeholder="Select Department"
                isDisabled={!formData.municipalityId}
                isClearable={false}
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Designation *</label>
              <SearchableSelect
                name="designationId"
                options={filteredDesignations.map(d => ({ value: d._id, label: d.name }))}
                value={formData.designationId}
                onChange={(e) => setFormData({...formData, designationId: e.target.value})}
                placeholder="Select Designation"
                isDisabled={!formData.municipalityId}
                isClearable={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Employee Code *</label>
              <input
                type="text"
                required
                value={formData.employeeCode}
                onChange={(e) => setFormData({...formData, employeeCode: e.target.value})}
                className="px-3 py-2 text-[14px] outline-none uppercase"
                style={inputStyles}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="px-3 py-2 text-[14px] outline-none"
                style={inputStyles}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Work Email</label>
            <input
              type="email"
              value={formData.workEmail}
              onChange={(e) => setFormData({...formData, workEmail: e.target.value})}
              className="px-3 py-2 text-[14px] outline-none"
              style={inputStyles}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Assigned Wards (Multi-select)</label>
            <SearchableSelect
              name="assignedWardIds"
              options={filteredWards.map(w => ({ value: w._id, label: `Ward ${w.wardNumber} - ${w.name}` }))}
              value={formData.assignedWardIds}
              onChange={(e) => {
                setFormData({...formData, assignedWardIds: e.target.value});
              }}
              placeholder="Select Assigned Wards"
              isDisabled={!formData.municipalityId}
              isMulti={true}
            />
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
              {editingItem ? 'Save Changes' : 'Create Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default EmployeeManager;
