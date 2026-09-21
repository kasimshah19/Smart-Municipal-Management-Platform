import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addComplaint } from '../../store/complaintsSlice.js';
import { showToast } from '../../store/uiSlice.js';

const CATEGORIES = [
  'Pothole / Road Damage',
  'Streetlight Outage',
  'Garbage Collection',
  'Water Supply',
  'Drainage / Waterlogging',
];

function NewComplaintForm() {
  const dispatch = useDispatch();
  const [type, setType] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!location.trim()) {
      dispatch(showToast('Please enter a location'));
      return;
    }

    const newComplaint = {
      id: `CMP${Math.floor(Math.random() * 10000)}`,
      type,
      location,
      description,
      status: 'submitted',
      date: new Date().toISOString(),
    };

    dispatch(addComplaint(newComplaint));
    dispatch(showToast('Complaint submitted successfully'));
    
    setLocation('');
    setDescription('');
    setType(CATEGORIES[0]);
  };

  const inputStyles = {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--line)',
    borderRadius: '10px',
    color: 'var(--ink)',
  };

  return (
    <div
      className="p-5"
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '14px',
        border: '1px solid var(--line)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
      }}
    >
      <h2 className="mb-4 text-[18px] font-bold" style={{ color: 'var(--ink)' }}>
        Report a civic issue
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
            Category
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 text-[14px] outline-none transition-colors focus:border-primary"
            style={inputStyles}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
            Location
          </label>
          <input
            type="text"
            placeholder="e.g. 5th Avenue, near Central Park"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="px-3 py-2 text-[14px] outline-none transition-colors focus:border-[var(--primary)]"
            style={inputStyles}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
            Description (optional)
          </label>
          <textarea
            placeholder="Additional details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none px-3 py-2 text-[14px] outline-none transition-colors focus:border-[var(--primary)]"
            style={inputStyles}
          />
        </div>

        <button
          type="submit"
          className="mt-2 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 active:opacity-100"
          style={{
            backgroundColor: 'var(--primary)',
            borderRadius: '10px',
          }}
        >
          Submit Complaint
        </button>
      </form>
    </div>
  );
}

export default NewComplaintForm;
