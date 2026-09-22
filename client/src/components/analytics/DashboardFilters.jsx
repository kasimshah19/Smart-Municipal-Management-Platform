import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setGlobalFilters, clearGlobalFilters } from '../../store/analyticsSlice';
import api from '../../utils/axiosConfig';
import { MAHARASHTRA_DISTRICTS } from '../../constants/maharashtraDistricts';

const DashboardFilters = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const globalFilters = useSelector((state) => state.analytics.globalFilters);

  const [municipalities, setMunicipalities] = useState([]);
  const [wards, setWards] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [localFilters, setLocalFilters] = useState({
    district: '',
    municipalityId: '',
    wardId: '',
    departmentId: '',
    dateRange: '30d',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    try {
      const [muniRes, wardRes, deptRes] = await Promise.all([
        api.get('/municipalities'),
        api.get('/wards'),
        api.get('/departments')
      ]);
      setMunicipalities(muniRes.data.data?.results || muniRes.data.data || []);
      setWards(wardRes.data.data?.results || wardRes.data.data || []);
      setDepartments(deptRes.data.data?.results || deptRes.data.data || []);
    } catch (error) {
      console.error('Failed to load structure data for filters', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    
    // Cascading resets
    if (key === 'district') {
      newFilters.municipalityId = '';
      newFilters.wardId = '';
      newFilters.departmentId = '';
    } else if (key === 'municipalityId') {
      newFilters.wardId = '';
      newFilters.departmentId = '';
    }

    if (key === 'dateRange') {
      const now = new Date();
      if (value === 'today') {
        newFilters.startDate = new Date(now.setHours(0,0,0,0)).toISOString();
        newFilters.endDate = new Date(now.setHours(23,59,59,999)).toISOString();
      } else if (value === '7d') {
        newFilters.startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
        newFilters.endDate = new Date().toISOString();
      } else if (value === '30d') {
        newFilters.startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
        newFilters.endDate = new Date().toISOString();
      } else {
        newFilters.startDate = '';
        newFilters.endDate = '';
      }
    }

    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    const filtersToApply = {
      municipalityId: localFilters.municipalityId,
      wardId: localFilters.wardId,
      departmentId: localFilters.departmentId,
      startDate: localFilters.startDate,
      endDate: localFilters.endDate,
    };
    // Clean empty values
    Object.keys(filtersToApply).forEach(k => {
      if (!filtersToApply[k]) delete filtersToApply[k];
    });
    
    dispatch(setGlobalFilters(filtersToApply));
  };

  const resetFilters = () => {
    setLocalFilters({
      district: '',
      municipalityId: '',
      wardId: '',
      departmentId: '',
      dateRange: '30d',
      startDate: '',
      endDate: ''
    });
    dispatch(clearGlobalFilters());
  };

  const inputStyles = "px-3 py-2 text-sm border rounded-lg outline-none bg-white border-gray-200 text-gray-700";

  // Filter dropdown data based on cascading selections
  const filteredMunicipalities = localFilters.district 
    ? municipalities.filter(m => m.district === localFilters.district) 
    : municipalities;

  const filteredWards = localFilters.municipalityId 
    ? wards.filter(w => w.municipalityId?._id === localFilters.municipalityId || w.municipalityId === localFilters.municipalityId) 
    : wards;

  const filteredDepartments = localFilters.municipalityId 
    ? departments.filter(d => d.municipalityId?._id === localFilters.municipalityId || d.municipalityId === localFilters.municipalityId) 
    : departments;

  // Role based visibility
  const canSelectDistrict = user?.role === 'SUPER_ADMIN';
  const canSelectMunicipality = user?.role === 'SUPER_ADMIN';
  const canSelectWard = ['SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'DEPARTMENT_OFFICER'].includes(user?.role);
  const canSelectDepartment = ['SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER'].includes(user?.role);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
      {canSelectDistrict && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">District</label>
          <select value={localFilters.district} onChange={(e) => handleFilterChange('district', e.target.value)} className={inputStyles}>
            <option value="">All Districts</option>
            {MAHARASHTRA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}

      {canSelectMunicipality && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Municipality</label>
          <select value={localFilters.municipalityId} onChange={(e) => handleFilterChange('municipalityId', e.target.value)} className={inputStyles}>
            <option value="">All Municipalities</option>
            {filteredMunicipalities.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        </div>
      )}

      {canSelectWard && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Ward</label>
          <select value={localFilters.wardId} onChange={(e) => handleFilterChange('wardId', e.target.value)} className={inputStyles}>
            <option value="">All Wards</option>
            {filteredWards.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
        </div>
      )}

      {canSelectDepartment && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Department</label>
          <select value={localFilters.departmentId} onChange={(e) => handleFilterChange('departmentId', e.target.value)} className={inputStyles}>
            <option value="">All Departments</option>
            {filteredDepartments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase">Date Range</label>
        <select value={localFilters.dateRange} onChange={(e) => handleFilterChange('dateRange', e.target.value)} className={inputStyles}>
          <option value="today">Today</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {localFilters.dateRange === 'custom' && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Start Date</label>
            <input type="date" value={localFilters.startDate ? localFilters.startDate.split('T')[0] : ''} onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : '')} className={inputStyles} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">End Date</label>
            <input type="date" value={localFilters.endDate ? localFilters.endDate.split('T')[0] : ''} onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : '')} className={inputStyles} />
          </div>
        </>
      )}

      <div className="flex gap-2 ml-auto">
        <button onClick={resetFilters} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          Reset
        </button>
        <button onClick={applyFilters} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default DashboardFilters;
