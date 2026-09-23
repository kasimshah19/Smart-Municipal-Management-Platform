import { useState, useEffect, useRef } from 'react';
import { pincodeService } from '../../services/pincodeService';

/**
 * Reusable component for 6-digit Pincode lookup.
 * Emits the selected postal office object to the parent via `onOfficeSelected`.
 */
export default function PincodeLookup({ onOfficeSelected, initialPincode = '' }) {
  const [pincode, setPincode] = useState(initialPincode);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedOfficeId, setSelectedOfficeId] = useState('');

  const debounceTimeout = useRef(null);

  // Validate and fetch on input change
  const handlePincodeChange = (e) => {
    // Only allow numeric input
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(val);
    
    // Reset states
    setOffices([]);
    setError('');
    setSuccess('');
    setSelectedOfficeId('');
    onOfficeSelected(null);

    if (val.length === 6) {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(() => {
        fetchPincodeData(val);
      }, 500);
    }
  };

  const fetchPincodeData = async (code) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const data = await pincodeService.getPincodeDetails(code);
      if (data && data.success && data.data && data.data.length > 0) {
        setOffices(data.data);
        setSuccess('Postal offices found');
      } else {
        setError('No postal office found for this pincode.');
      }
    } catch (err) {
      if (err.status === 429 || (err.message && err.message.includes('429'))) {
        setError('Too many requests. Please try again shortly.');
      } else {
        setError(err.message || 'Unable to lookup pincode. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOfficeSelection = (e) => {
    const officeId = e.target.value;
    setSelectedOfficeId(officeId);
    
    if (officeId) {
      const selected = offices.find(o => o._id === officeId);
      onOfficeSelected(selected);
    } else {
      onOfficeSelected(null);
    }
  };

  const inputStyles = {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--line)',
    borderRadius: '10px',
    color: 'var(--ink)',
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
          Pincode
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter 6-digit pincode"
            value={pincode}
            onChange={handlePincodeChange}
            maxLength={6}
            className={`w-full px-3 py-2 text-[14px] outline-none transition-colors focus:border-[var(--primary)] ${error ? 'border-red-500' : ''}`}
            style={inputStyles}
            aria-invalid={!!error}
            aria-describedby="pincode-message"
          />
          {loading && (
            <div className="absolute right-3 top-2.5" aria-live="polite">
              <span className="text-[12px] text-gray-500 animate-pulse">Searching...</span>
            </div>
          )}
        </div>
      </div>

      {/* State Messaging */}
      <div id="pincode-message" aria-live="assertive">
        {error && <p className="text-[12px] text-red-500">{error}</p>}
        {success && !error && <p className="text-[12px] text-green-600 flex items-center gap-1"><span className="text-lg leading-none">✓</span> {success}</p>}
      </div>

      {/* Multiple Office Selection */}
      {offices.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-2 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
          <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
            Select Postal Office
          </label>
          <select
            value={selectedOfficeId}
            onChange={handleOfficeSelection}
            className="w-full px-3 py-2 text-[14px] outline-none transition-colors focus:border-[var(--primary)]"
            style={inputStyles}
          >
            <option value="">-- Select a Postal Office --</option>
            {offices.map((office) => (
              <option key={office._id} value={office._id}>
                {office.officeName} ({office.officeType} - {office.deliveryStatus})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
