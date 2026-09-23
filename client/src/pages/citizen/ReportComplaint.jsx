import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { createComplaint, uploadComplaintEvidence, clearCreateState } from '../../store/complaintsSlice.js';
import { showToast } from '../../store/uiSlice.js';
import MainLayout from '../../layouts/MainLayout.jsx';
import complaintService from '../../services/complaintService.js';
import SearchableSelect from '../../components/common/SearchableSelect.jsx';

// ════════════════════════════════════════════════════════════
// Hardcoded fallback categories (used if API categories empty)
// ════════════════════════════════════════════════════════════
const DEFAULT_CATEGORIES = [
  { code: 'GARBAGE', name: 'Garbage', icon: '🗑️', color: '#22C55E' },
  { code: 'POTHOLE', name: 'Pothole', icon: '🕳️', color: '#EF4444' },
  { code: 'WATER', name: 'Water', icon: '💧', color: '#3B82F6' },
  { code: 'STREET_LIGHT', name: 'Street Light', icon: '💡', color: '#F59E0B' },
  { code: 'DRAINAGE', name: 'Drainage', icon: '🚰', color: '#06B6D4' },
  { code: 'WATERLOGGING', name: 'Waterlogging', icon: '🌊', color: '#0EA5E9' },
  { code: 'ILLEGAL_DUMPING', name: 'Illegal Dumping', icon: '⛔', color: '#DC2626' },
  { code: 'STRAY_ANIMALS', name: 'Stray Animals', icon: '🐕', color: '#A855F7' },
  { code: 'TREE', name: 'Tree', icon: '🌳', color: '#16A34A' },
  { code: 'PARKING', name: 'Parking', icon: '🅿️', color: '#6366F1' },
  { code: 'PUBLIC_TOILET', name: 'Public Toilet', icon: '🚻', color: '#14B8A6' },
  { code: 'MOSQUITO', name: 'Mosquito', icon: '🦟', color: '#78716C' },
  { code: 'ENCROACHMENT', name: 'Encroachment', icon: '🚧', color: '#F97316' },
  { code: 'WASTE_BURNING', name: 'Waste Burning', icon: '🔥', color: '#EF4444' },
  { code: 'PUBLIC_INFRA', name: 'Public Infrastructure', icon: '🏗️', color: '#8B5CF6' },
  { code: 'OTHER', name: 'Other', icon: '📋', color: '#64748B' },
];

const STEPS = ['Category', 'Description', 'Photos', 'Location', 'Review'];

// ════════════════════════════════════════════════════════════
// Stepper Component
// ════════════════════════════════════════════════════════════
function Stepper({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {steps.map((label, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold transition-all duration-300"
                style={{
                  backgroundColor: isCompleted
                    ? 'var(--accent)'
                    : isCurrent
                    ? 'var(--primary)'
                    : 'var(--line)',
                  color: isCompleted || isCurrent ? '#fff' : 'var(--muted)',
                  boxShadow: isCurrent ? '0 0 0 4px var(--primary-light)' : 'none',
                }}
              >
                {isCompleted ? '✓' : i + 1}
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: isCurrent ? 'var(--ink)' : 'var(--muted)' }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="mx-2 h-[2px] w-8 rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: isCompleted ? 'var(--accent)' : 'var(--line)',
                  marginBottom: '18px',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Step 1: Category Selection
// ════════════════════════════════════════════════════════════
function StepCategory({ categories, selectedCategory, onSelect }) {
  return (
    <div className="animate-fade-in-up">
      <h2 className="text-[20px] font-bold mb-2" style={{ color: 'var(--ink)' }}>
        What's the problem?
      </h2>
      <p className="text-[14px] mb-6" style={{ color: 'var(--muted)' }}>
        Select the category that best describes your civic issue
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory?._id === cat._id || selectedCategory?.code === cat.code;
          return (
            <button
              key={cat._id || cat.code}
              type="button"
              onClick={() => onSelect(cat)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--line)'}`,
                boxShadow: isSelected
                  ? '0 4px 16px rgba(37, 99, 235, 0.15)'
                  : '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <span className="text-[28px]">{cat.icon || '📋'}</span>
              <span
                className="text-[13px] font-medium text-center leading-tight"
                style={{ color: isSelected ? 'var(--primary)' : 'var(--ink)' }}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Step 2: Description
// ════════════════════════════════════════════════════════════
function StepDescription({ title, description, onTitleChange, onDescriptionChange }) {
  const inputStyles = {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--line)',
    borderRadius: '10px',
    color: 'var(--ink)',
  };

  return (
    <div className="animate-fade-in-up flex flex-col gap-5">
      <div>
        <h2 className="text-[20px] font-bold mb-2" style={{ color: 'var(--ink)' }}>
          Describe the issue
        </h2>
        <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
          Provide a clear title and detailed description
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
          Title *
        </label>
        <input
          type="text"
          placeholder="e.g. Pothole on Main Street near school"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="px-4 py-3 text-[14px] outline-none transition-colors focus:border-[var(--primary)]"
          style={inputStyles}
          maxLength={120}
        />
        <span className="text-[11px] text-right" style={{ color: 'var(--muted)' }}>
          {title.length}/120
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
          Description *
        </label>
        <textarea
          placeholder="Describe the problem in detail — what, where, how severe..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={5}
          className="resize-none px-4 py-3 text-[14px] outline-none transition-colors focus:border-[var(--primary)]"
          style={inputStyles}
          maxLength={1000}
        />
        <span className="text-[11px] text-right" style={{ color: 'var(--muted)' }}>
          {description.length}/1000
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Step 3: Photo Upload
// ════════════════════════════════════════════════════════════
function StepPhotos({ photos, onPhotosChange }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (fileList) => {
      const newFiles = Array.from(fileList).filter(
        (f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024
      );
      const combined = [...photos, ...newFiles].slice(0, 5);
      onPhotosChange(combined);
    },
    [photos, onPhotosChange]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removePhoto = (index) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="animate-fade-in-up flex flex-col gap-5">
      <div>
        <h2 className="text-[20px] font-bold mb-2" style={{ color: 'var(--ink)' }}>
          Add photos
        </h2>
        <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
          Upload up to 5 photos of the issue (optional, max 5MB each)
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`drop-zone flex flex-col items-center justify-center gap-3 p-8 cursor-pointer ${
          dragOver ? 'drag-over' : ''
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <span className="text-[36px]">📷</span>
        <span className="text-[14px] font-medium" style={{ color: 'var(--muted)' }}>
          Drag & drop photos here or <span style={{ color: 'var(--primary)' }}>browse</span>
        </span>
        <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
          JPEG, PNG, WEBP — max 5MB each
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Preview grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {photos.map((file, index) => (
            <div
              key={index}
              className="relative group rounded-xl overflow-hidden"
              style={{ aspectRatio: '1', border: '1px solid var(--line)' }}
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full text-white text-[12px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Step 4: Location
// ════════════════════════════════════════════════════════════
function StepLocation({ formData, onFormDataChange }) {
  const { user } = useSelector((state) => state.auth);
  const [municipalities, setMunicipalities] = useState([]);
  const [wards, setWards] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);

  // Fetch municipalities on mount
  useEffect(() => {
    complaintService.getMunicipalities().then((res) => {
      const data = res.data || res.results || [];
      setMunicipalities(Array.isArray(data) ? data : []);
      // Auto-select if user has a municipality
      if (user?.municipalityId && !formData.municipalityId) {
        onFormDataChange({ ...formData, municipalityId: user.municipalityId });
      }
    }).catch(() => {});
  }, []);

  // Fetch wards when municipality changes
  useEffect(() => {
    if (!formData.municipalityId) { setWards([]); return; }
    setLoadingWards(true);
    complaintService.getWards(formData.municipalityId).then((res) => {
      const data = res.data || res.results || [];
      setWards(Array.isArray(data) ? data : []);
    }).catch(() => {}).finally(() => setLoadingWards(false));
  }, [formData.municipalityId]);

  // Fetch areas when ward changes
  useEffect(() => {
    if (!formData.wardId) { setAreas([]); return; }
    setLoadingAreas(true);
    complaintService.getAreas(formData.wardId).then((res) => {
      const data = res.data || res.results || [];
      setAreas(Array.isArray(data) ? data : []);
    }).catch(() => {}).finally(() => setLoadingAreas(false));
  }, [formData.wardId]);

  const inputStyles = {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--line)',
    borderRadius: '10px',
    color: 'var(--ink)',
  };

  const handleChange = (key, value) => {
    const updated = { ...formData, [key]: value };
    // Reset child selections
    if (key === 'municipalityId') { updated.wardId = ''; updated.areaId = ''; }
    if (key === 'wardId') { updated.areaId = ''; }
    onFormDataChange(updated);
  };

  return (
    <div className="animate-fade-in-up flex flex-col gap-5">
      <div>
        <h2 className="text-[20px] font-bold mb-2" style={{ color: 'var(--ink)' }}>
          Where is the problem?
        </h2>
        <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
          Select your ward, area, and provide the address
        </p>
      </div>

      {/* Municipality */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Municipality *</label>
        <SearchableSelect
          name="municipalityId"
          options={municipalities.map(m => ({ value: m._id, label: m.name }))}
          value={formData.municipalityId}
          onChange={(e) => handleChange('municipalityId', e.target.value)}
          placeholder="Select Municipality"
          isClearable={false}
        />
      </div>

      {/* Ward */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Ward *</label>
        <SearchableSelect
          name="wardId"
          options={wards.map(w => ({ value: w._id, label: w.name }))}
          value={formData.wardId}
          onChange={(e) => handleChange('wardId', e.target.value)}
          placeholder={loadingWards ? 'Loading...' : 'Select Ward'}
          isDisabled={!formData.municipalityId || loadingWards}
          isClearable={false}
        />
      </div>

      {/* Area */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>Area *</label>
        <SearchableSelect
          name="areaId"
          options={areas.map(a => ({ value: a._id, label: a.name }))}
          value={formData.areaId}
          onChange={(e) => handleChange('areaId', e.target.value)}
          placeholder={loadingAreas ? 'Loading...' : 'Select Area'}
          isDisabled={!formData.wardId || loadingAreas}
          isClearable={false}
        />
      </div>

      {/* Address */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
          Address / Landmark
        </label>
        <input
          type="text"
          placeholder="e.g. Near Central Park Gate 3, Main Road"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          className="px-4 py-3 text-[14px] outline-none transition-colors focus:border-[var(--primary)]"
          style={inputStyles}
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Step 5: Review & Submit
// ════════════════════════════════════════════════════════════
function StepReview({ category, title, description, photos, locationData }) {
  return (
    <div className="animate-fade-in-up flex flex-col gap-5">
      <div>
        <h2 className="text-[20px] font-bold mb-2" style={{ color: 'var(--ink)' }}>
          Review your complaint
        </h2>
        <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
          Make sure everything looks correct before submitting
        </p>
      </div>

      <div
        className="flex flex-col gap-4 p-5 rounded-xl"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--line)',
        }}
      >
        {/* Category */}
        <div className="flex items-center gap-3">
          <span className="text-[24px]">{category?.icon || '📋'}</span>
          <div>
            <p className="text-[12px]" style={{ color: 'var(--muted)' }}>Category</p>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>
              {category?.name}
            </p>
          </div>
        </div>

        <hr style={{ borderColor: 'var(--line)' }} />

        {/* Title & Description */}
        <div>
          <p className="text-[12px] mb-1" style={{ color: 'var(--muted)' }}>Title</p>
          <p className="text-[15px] font-medium" style={{ color: 'var(--ink)' }}>{title}</p>
        </div>
        <div>
          <p className="text-[12px] mb-1" style={{ color: 'var(--muted)' }}>Description</p>
          <p className="text-[14px]" style={{ color: 'var(--ink)' }}>{description}</p>
        </div>

        <hr style={{ borderColor: 'var(--line)' }} />

        {/* Photos */}
        <div>
          <p className="text-[12px] mb-2" style={{ color: 'var(--muted)' }}>
            Photos ({photos.length})
          </p>
          {photos.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((file, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(file)}
                  alt={`Photo ${i + 1}`}
                  className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                  style={{ border: '1px solid var(--line)' }}
                />
              ))}
            </div>
          ) : (
            <p className="text-[13px] italic" style={{ color: 'var(--muted)' }}>No photos added</p>
          )}
        </div>

        <hr style={{ borderColor: 'var(--line)' }} />

        {/* Location */}
        <div>
          <p className="text-[12px] mb-1" style={{ color: 'var(--muted)' }}>Location</p>
          <p className="text-[14px]" style={{ color: 'var(--ink)' }}>
            {locationData.address || 'No address provided'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Success Screen
// ════════════════════════════════════════════════════════════
function SuccessScreen({ complaintId, onGoHome }) {
  return (
    <div className="animate-scale-in flex flex-col items-center justify-center py-12 text-center gap-4">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full text-[36px]"
        style={{ backgroundColor: 'var(--success-light)' }}
      >
        ✅
      </div>
      <h2 className="text-[22px] font-bold" style={{ color: 'var(--ink)' }}>
        Complaint Submitted!
      </h2>
      <p className="text-[14px] max-w-md" style={{ color: 'var(--muted)' }}>
        Your complaint has been registered successfully. You can track its progress from your dashboard.
      </p>
      {complaintId && (
        <div
          className="px-4 py-2 rounded-lg text-[14px] font-mono font-bold"
          style={{
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
          }}
        >
          ID: {complaintId}
        </div>
      )}
      <button
        onClick={onGoHome}
        className="mt-4 px-8 py-3 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        Go to Dashboard
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Main Wizard Page
// ════════════════════════════════════════════════════════════
function ReportComplaint() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isCreating, lastCreated, createError, isUploading } = useSelector(
    (state) => state.complaints
  );

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [locationData, setLocationData] = useState({
    municipalityId: user?.municipalityId || '',
    wardId: '',
    areaId: '',
    address: '',
  });

  // Categories from API or fallback
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    if (user?.municipalityId) {
      complaintService.getCategories(user.municipalityId).then((res) => {
        const apiCats = res.data || [];
        if (apiCats.length > 0) setCategories(apiCats);
      }).catch(() => {});
    }
    return () => { dispatch(clearCreateState()); };
  }, []);

  // Handle successful creation
  useEffect(() => {
    if (lastCreated) {
      // Upload photos if any
      if (photos.length > 0 && lastCreated._id) {
        dispatch(uploadComplaintEvidence({ complaintId: lastCreated._id, files: photos }));
      }
      setSubmitted(true);
    }
  }, [lastCreated]);

  // Validation per step
  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedCategory;
      case 1: return title.trim().length >= 5 && description.trim().length >= 10;
      case 2: return true; // photos are optional
      case 3: return locationData.municipalityId && locationData.wardId && locationData.areaId;
      case 4: return true; // review step
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    const payload = {
      categoryId: selectedCategory._id || selectedCategory.code,
      title,
      description,
      municipalityId: locationData.municipalityId,
      wardId: locationData.wardId,
      areaId: locationData.areaId,
      location: {
        type: 'Point',
        coordinates: [0, 0], // Default — could be enhanced with geolocation
        address: locationData.address,
      },
    };

    dispatch(createComplaint(payload));
  };

  if (submitted) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <SuccessScreen
            complaintId={lastCreated?.complaintId}
            onGoHome={() => navigate('/dashboard')}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-[14px] font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--primary)' }}
          >
            ← Back
          </button>
          <h1 className="text-[18px] font-bold" style={{ color: 'var(--ink)' }}>
            Report a Problem
          </h1>
          <div className="w-[60px]" />
        </div>

        {/* Stepper */}
        <Stepper currentStep={step} steps={STEPS} />

        {/* Step Content */}
        <div
          className="p-6 rounded-2xl mb-6"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--line)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
          }}
        >
          {step === 0 && (
            <StepCategory
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
            />
          )}
          {step === 1 && (
            <StepDescription
              title={title}
              description={description}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
            />
          )}
          {step === 2 && (
            <StepPhotos photos={photos} onPhotosChange={setPhotos} />
          )}
          {step === 3 && (
            <StepLocation formData={locationData} onFormDataChange={setLocationData} />
          )}
          {step === 4 && (
            <StepReview
              category={selectedCategory}
              title={title}
              description={description}
              photos={photos}
              locationData={locationData}
            />
          )}
        </div>

        {/* Error */}
        {createError && (
          <div
            className="mb-4 p-3 rounded-xl text-[13px]"
            style={{
              backgroundColor: 'var(--danger-light)',
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
            }}
          >
            {createError}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="px-6 py-2.5 rounded-xl text-[14px] font-medium transition-opacity disabled:opacity-30"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
            }}
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-8 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-90"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isCreating || isUploading}
              className="px-8 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {isCreating || isUploading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </span>
              ) : (
                'Submit Complaint'
              )}
            </button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default ReportComplaint;
