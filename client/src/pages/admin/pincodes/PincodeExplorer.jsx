import { useState, useEffect } from 'react';
import { pincodeService } from '../../../services/pincodeService';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../store/uiSlice';
import SearchableSelect from '../../../components/common/SearchableSelect.jsx';

export default function PincodeExplorer() {
  const dispatch = useDispatch();
  
  const [pincodes, setPincodes] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [postalDistrictName, setPostalDistrictName] = useState('');
  const [officeType, setOfficeType] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('');

  // Fetch unique districts on mount
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await pincodeService.getPostalDistricts();
        if (res.success) setDistricts(res.data);
      } catch (error) {
        console.error('Failed to fetch districts', error);
      }
    };
    fetchDistricts();
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (debouncedSearch !== search) {
        setDebouncedSearch(search);
        setPage(1); // Reset to page 1 on new search
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [search, debouncedSearch]);

  // Fetch Data
  useEffect(() => {
    fetchPincodes();
  }, [page, debouncedSearch, postalDistrictName, officeType, deliveryStatus]);

  const fetchPincodes = async () => {
    setLoading(true);
    try {
      const res = await pincodeService.getAdminPincodes({
        page,
        limit: 50,
        search: debouncedSearch,
        postalDistrictName,
        officeType,
        deliveryStatus
      });
      if (res.success) {
        setPincodes(res.data);
        setTotalPages(res.pages);
        setTotalRecords(res.total);
      }
    } catch (error) {
      dispatch(showToast(error.message || 'Failed to fetch pincodes', 'error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pincode Explorer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse and search the India Post postal geography dataset. ({totalRecords} records found)
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center" aria-label="Filters">
        <div className="w-full sm:flex-1 sm:min-w-[200px]">
          <input
            type="text"
            placeholder="Search by Pincode or Office Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
            aria-label="Search pincodes"
          />
        </div>
        <div className="w-64">
          <SearchableSelect
            name="postalDistrictName"
            options={districts.map(d => ({ value: d, label: d }))}
            value={postalDistrictName}
            onChange={(e) => { setPostalDistrictName(e.target.value); setPage(1); }}
            placeholder="All Districts"
          />
        </div>
        <div className="w-full sm:w-48">
          <SearchableSelect
            name="officeType"
            options={[
              { value: 'HO', label: 'HO (Head)' },
              { value: 'SO', label: 'SO (Sub)' },
              { value: 'BO', label: 'BO (Branch)' }
            ]}
            value={officeType}
            onChange={(e) => { setOfficeType(e.target.value); setPage(1); }}
            placeholder="All Types"
          />
        </div>
        <div className="w-full sm:w-48">
          <SearchableSelect
            name="deliveryStatus"
            options={[
              { value: 'Delivery', label: 'Delivery' },
              { value: 'Non-Delivery', label: 'Non-Delivery' }
            ]}
            value={deliveryStatus}
            onChange={(e) => { setDeliveryStatus(e.target.value); setPage(1); }}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Pincode</th>
                <th className="px-6 py-4">Office Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Delivery</th>
                <th className="px-6 py-4">Postal District</th>
                <th className="px-6 py-4">Postal Taluka</th>
              </tr>
            </thead>
            <tbody aria-live="polite">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    Loading pincodes...
                  </td>
                </tr>
              ) : pincodes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    No pincodes found.
                  </td>
                </tr>
              ) : (
                pincodes.map((office) => (
                  <tr key={office._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{office.pincode}</td>
                    <td className="px-6 py-3">{office.officeName}</td>
                    <td className="px-6 py-3">{office.officeType}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        office.deliveryStatus === 'Delivery' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {office.deliveryStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3">{office.postalDistrictName || '-'}</td>
                    <td className="px-6 py-3">{office.postalTalukaName || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-400 mt-4 text-center">
        * Postal information is sourced from the integrated India Post dataset. Postal geography may differ from administrative geography.
      </p>
    </div>
  );
}
