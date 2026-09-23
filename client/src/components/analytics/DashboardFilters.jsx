import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setGlobalFilters, clearGlobalFilters } from '../../store/analyticsSlice';
import api from '../../utils/axiosConfig';
import { MAHARASHTRA_DISTRICTS } from '../../constants/maharashtraDistricts';
import Select from 'react-select';
import SearchableSelect from '../common/SearchableSelect.jsx';

const LOCAL_BODY_TYPES = [
  { value: 'MUNICIPAL_CORPORATION', label: 'Maha Nagar Palika (Municipal Corporation)' },
  { value: 'MUNICIPAL_COUNCIL', label: 'Nagar Palika (Municipal Council)' },
  { value: 'NAGAR_PANCHAYAT', label: 'Nagar Panchayat' },
  { value: 'ZILLA_PARISHAD', label: 'Zilla Parishad' },
  { value: 'PANCHAYAT_SAMITI', label: 'Panchayat Samiti' },
  { value: 'GRAM_PANCHAYAT', label: 'Gram Panchayat' }
];

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '0.5rem',
    borderColor: '#e5e7eb',
    boxShadow: 'none',
    '&:hover': { borderColor: '#d1d5db' },
    fontSize: '0.875rem',
    minHeight: '38px',
    backgroundColor: state.isDisabled ? '#f9fafb' : 'white',
  }),
  valueContainer: (base) => ({
    ...base,
    padding: '0 8px'
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#f3f4f6' : 'white',
    color: state.isSelected ? 'white' : '#374151',
    cursor: 'pointer',
  }),
  menu: (base) => ({
    ...base,
    zIndex: 50
  })
};

const DashboardFilters = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const globalFilters = useSelector((state) => state.analytics.globalFilters);

  const [localBodyType, setLocalBodyType] = useState('MUNICIPAL_CORPORATION');
  const [localBodies, setLocalBodies] = useState([]);
  const [wards, setWards] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoadingBodies, setIsLoadingBodies] = useState(false);
  
  const [localFilters, setLocalFilters] = useState({
    district: '',
    localBodyId: '',
    wardId: '',
    departmentId: '',
    dateRange: '30d',
    startDate: '',
    endDate: ''
  });

  // Fetch Wards and Departments on mount
  useEffect(() => {
    fetchWardsAndDepts();
  }, []);

  // Fetch Local Bodies when Type or District changes
  useEffect(() => {
    fetchLocalBodies();
  }, [localBodyType, localFilters.district]);

  const fetchWardsAndDepts = async () => {
    try {
      const [wardRes, deptRes] = await Promise.all([
        api.get('/wards?limit=1000'),
        api.get('/departments?limit=1000')
      ]);
      setWards(wardRes.data.data?.results || wardRes.data.data || []);
      setDepartments(deptRes.data.data?.results || deptRes.data.data || []);
    } catch (error) {
      console.error('Failed to load wards/departments', error);
    }
  };

  const fetchLocalBodies = async () => {
    setIsLoadingBodies(true);
    try {
      let endpoint = '';
      let params = { limit: 1000 };
      
      if (['MUNICIPAL_CORPORATION', 'MUNICIPAL_COUNCIL', 'NAGAR_PANCHAYAT'].includes(localBodyType)) {
        endpoint = '/municipalities';
        params.type = localBodyType;
      } else if (localBodyType === 'ZILLA_PARISHAD') {
        endpoint = '/zilla-parishads';
      } else if (localBodyType === 'PANCHAYAT_SAMITI') {
        endpoint = '/panchayat-samitis';
      } else if (localBodyType === 'GRAM_PANCHAYAT') {
        // Gram Panchayats are too numerous, require district filter
        if (!localFilters.district) {
          setLocalBodies([]);
          setIsLoadingBodies(false);
          return;
        }
        endpoint = '/gram-panchayats';
      }

      if (localFilters.district) {
        // Find district ID if the API expects an ID? The APIs usually accept populated strings or we can just fetch all and filter in frontend.
      }
      
      const res = await api.get(endpoint, { params });
      setLocalBodies(res.data.data?.results || res.data.data || []);
    } catch (error) {
      console.error('Failed to load local bodies', error);
      setLocalBodies([]);
    } finally {
      setIsLoadingBodies(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    
    // Cascading resets
    if (key === 'district') {
      newFilters.localBodyId = '';
      newFilters.wardId = '';
      newFilters.departmentId = '';
    } else if (key === 'localBodyId') {
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
      wardId: localFilters.wardId,
      departmentId: localFilters.departmentId,
      startDate: localFilters.startDate,
      endDate: localFilters.endDate,
    };

    // Map localBodyId to the correct key based on localBodyType
    if (localFilters.localBodyId) {
      if (['MUNICIPAL_CORPORATION', 'MUNICIPAL_COUNCIL', 'NAGAR_PANCHAYAT'].includes(localBodyType)) filtersToApply.municipalityId = localFilters.localBodyId;
      else if (localBodyType === 'ZILLA_PARISHAD') filtersToApply.zillaParishadId = localFilters.localBodyId;
      else if (localBodyType === 'PANCHAYAT_SAMITI') filtersToApply.panchayatSamitiId = localFilters.localBodyId;
      else if (localBodyType === 'GRAM_PANCHAYAT') filtersToApply.gramPanchayatId = localFilters.localBodyId;
    }

    // Clean empty values
    Object.keys(filtersToApply).forEach(k => {
      if (!filtersToApply[k]) delete filtersToApply[k];
    });
    
    dispatch(setGlobalFilters(filtersToApply));
  };

  const resetFilters = () => {
    setLocalBodyType('MUNICIPAL_CORPORATION');
    setLocalFilters({
      district: '',
      localBodyId: '',
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
  const filteredBodies = localFilters.district 
    ? localBodies.filter(m => 
        (m.district === localFilters.district) || 
        (m.districtId && m.districtId.name === localFilters.district)
      ) 
    : localBodies;

  const filteredWards = localFilters.localBodyId 
    ? wards.filter(w => w.municipalityId?._id === localFilters.localBodyId || w.municipalityId === localFilters.localBodyId) 
    : wards;

  const filteredDepartments = localFilters.localBodyId 
    ? departments.filter(d => d.municipalityId?._id === localFilters.localBodyId || d.municipalityId === localFilters.localBodyId) 
    : departments;

  // Options mapping for Select
  const districtOptions = MAHARASHTRA_DISTRICTS.map(d => ({ value: d, label: d }));
  const entityOptions = filteredBodies.map(m => ({ value: m._id, label: m.name }));
  const wardOptions = filteredWards.map(w => ({ value: w._id, label: w.name }));
  const deptOptions = filteredDepartments.map(d => ({ value: d._id, label: d.name }));

  // Role based visibility
  const canSelectDistrict = user?.role === 'SUPER_ADMIN';
  const canSelectMunicipality = user?.role === 'SUPER_ADMIN';
  const canSelectWard = ['SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'DEPARTMENT_OFFICER'].includes(user?.role);
  const canSelectDepartment = ['SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER'].includes(user?.role);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
      {canSelectDistrict && (
        <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase">District</label>
          <Select
            options={districtOptions}
            value={districtOptions.find(o => o.value === localFilters.district) || null}
            onChange={(sel) => handleFilterChange('district', sel ? sel.value : '')}
            isClearable
            placeholder="All Districts"
            styles={customSelectStyles}
          />
        </div>
      )}

      {canSelectMunicipality && (
        <>
          <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase">Local Body Type</label>
            <SearchableSelect 
              name="localBodyType"
              options={LOCAL_BODY_TYPES}
              value={localBodyType} 
              onChange={(e) => {
                setLocalBodyType(e.target.value);
                setLocalFilters({ ...localFilters, localBodyId: '', wardId: '', departmentId: '' });
              }} 
              isClearable={false}
            />
          </div>

          <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase">Entity</label>
            <Select
              options={entityOptions}
              value={entityOptions.find(o => o.value === localFilters.localBodyId) || null}
              onChange={(sel) => handleFilterChange('localBodyId', sel ? sel.value : '')}
              isClearable
              isDisabled={isLoadingBodies || (localBodyType === 'GRAM_PANCHAYAT' && !localFilters.district)}
              placeholder={isLoadingBodies ? 'Loading...' : (localBodyType === 'GRAM_PANCHAYAT' && !localFilters.district) ? 'Select District first' : 'All Entities'}
              styles={customSelectStyles}
            />
          </div>
        </>
      )}

      {canSelectWard && ['MUNICIPAL_CORPORATION', 'MUNICIPAL_COUNCIL', 'NAGAR_PANCHAYAT'].includes(localBodyType) && (
        <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase">Ward</label>
          <Select
            options={wardOptions}
            value={wardOptions.find(o => o.value === localFilters.wardId) || null}
            onChange={(sel) => handleFilterChange('wardId', sel ? sel.value : '')}
            isClearable
            placeholder="All Wards"
            styles={customSelectStyles}
          />
        </div>
      )}

      {canSelectDepartment && ['MUNICIPAL_CORPORATION', 'MUNICIPAL_COUNCIL', 'NAGAR_PANCHAYAT'].includes(localBodyType) && (
        <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
          <label className="text-xs font-semibold text-gray-500 uppercase">Department</label>
          <Select
            options={deptOptions}
            value={deptOptions.find(o => o.value === localFilters.departmentId) || null}
            onChange={(sel) => handleFilterChange('departmentId', sel ? sel.value : '')}
            isClearable
            placeholder="All Departments"
            styles={customSelectStyles}
          />
        </div>
      )}

      <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[150px]">
        <label className="text-xs font-semibold text-gray-500 uppercase">Date Range</label>
        <SearchableSelect 
          name="dateRange"
          options={[
            { value: 'today', label: 'Today' },
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: 'custom', label: 'Custom' }
          ]}
          value={localFilters.dateRange} 
          onChange={(e) => handleFilterChange('dateRange', e.target.value)} 
          isClearable={false}
        />
      </div>

      {localFilters.dateRange === 'custom' && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">Start Date</label>
            <input type="date" value={localFilters.startDate ? localFilters.startDate.split('T')[0] : ''} onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : '')} className={`${inputStyles} h-[38px]`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase">End Date</label>
            <input type="date" value={localFilters.endDate ? localFilters.endDate.split('T')[0] : ''} onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : '')} className={`${inputStyles} h-[38px]`} />
          </div>
        </>
      )}

      <div className="flex gap-2 ml-auto">
        <button onClick={resetFilters} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors h-[38px]">
          Reset
        </button>
        <button onClick={applyFilters} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors h-[38px]">
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default DashboardFilters;
