import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import userService from '../../../services/userService';
import api from '../../../services/api';

const UserManager = () => {
  const { user } = useSelector(state => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Cascading Form State
  const [role, setRole] = useState('');
  const [district, setDistrict] = useState('');
  const [municipalityId, setMunicipalityId] = useState('');
  const [wardId, setWardId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  // Dropdown options
  const [municipalities, setMunicipalities] = useState([]);
  const [wards, setWards] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Mock districts (or fetch from an endpoint)
  const DISTRICTS = ['Dhule', 'Pune', 'Mumbai', 'Nashik', 'Nagpur']; // Abbreviated for simplicity

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers();
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchMunicipalities = async (selectedDistrict) => {
    try {
      const res = await api.get('/municipalities', { params: { district: selectedDistrict } });
      setMunicipalities(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWards = async (muniId) => {
    try {
      const res = await api.get('/wards', { params: { municipalityId: muniId } });
      setWards(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async (muniId) => {
    try {
      const res = await api.get('/departments', { params: { municipalityId: muniId } });
      setDepartments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (u) => {
    setSelectedUser(u);
    setRole(u.role);
    setMunicipalityId(u.municipalityId || '');
    setWardId(u.wardId || '');
    setDepartmentId(u.departmentId || '');
    // In a full implementation, we'd look up the district from the municipality
    // For now, let's just trigger municipality loading if possible
    fetchMunicipalities();
    if (u.municipalityId) {
      fetchWards(u.municipalityId);
      fetchDepartments(u.municipalityId);
    }
    setIsModalOpen(true);
  };

  const handleDistrictChange = (e) => {
    setDistrict(e.target.value);
    setMunicipalityId('');
    setWardId('');
    setDepartmentId('');
    if (e.target.value) {
      fetchMunicipalities(e.target.value);
    }
  };

  const handleMunicipalityChange = (e) => {
    const muniId = e.target.value;
    setMunicipalityId(muniId);
    setWardId('');
    setDepartmentId('');
    if (muniId) {
      fetchWards(muniId);
      fetchDepartments(muniId);
    }
  };

  const handleRoleScopeUpdate = async (e) => {
    e.preventDefault();
    try {
      const data = { role, municipalityId, wardId, departmentId };
      await userService.updateUserRoleAndScope(selectedUser._id, data);
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Update failed', err);
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Manager</h1>
      
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-left">Email</th>
                <th className="py-2 px-4 text-left">Role</th>
                <th className="py-2 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-b">
                  <td className="py-2 px-4">{u.firstName} {u.lastName}</td>
                  <td className="py-2 px-4">{u.email}</td>
                  <td className="py-2 px-4">{u.role}</td>
                  <td className="py-2 px-4">
                    <button 
                      onClick={() => handleEditClick(u)}
                      className="text-blue-500 hover:underline"
                    >
                      Edit Scope
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Role & Scope</h2>
            
            <form onSubmit={handleRoleScopeUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Role</label>
                <select 
                  className="w-full border p-2 rounded"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="CITIZEN">CITIZEN</option>
                  <option value="WORKER">WORKER</option>
                  <option value="INSPECTOR">INSPECTOR</option>
                  <option value="DEPARTMENT_OFFICER">DEPARTMENT_OFFICER</option>
                  <option value="WARD_OFFICER">WARD_OFFICER</option>
                  <option value="MUNICIPAL_ADMIN">MUNICIPAL_ADMIN</option>
                  {user.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
                </select>
              </div>

              {role !== 'SUPER_ADMIN' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">District</label>
                    <select 
                      className="w-full border p-2 rounded"
                      value={district}
                      onChange={handleDistrictChange}
                    >
                      <option value="">Select District (Filter)</option>
                      {DISTRICTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Municipality</label>
                    <select 
                      className="w-full border p-2 rounded"
                      value={municipalityId}
                      onChange={handleMunicipalityChange}
                    >
                      <option value="">Select Municipality</option>
                      {municipalities.map(m => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {role === 'WARD_OFFICER' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Ward</label>
                  <select 
                    className="w-full border p-2 rounded"
                    value={wardId}
                    onChange={(e) => setWardId(e.target.value)}
                  >
                    <option value="">Select Ward</option>
                    {wards.map(w => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'DEPARTMENT_OFFICER' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <select 
                    className="w-full border p-2 rounded"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <button 
                  type="button" 
                  className="px-4 py-2 border rounded"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
