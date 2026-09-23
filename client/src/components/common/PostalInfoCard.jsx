export default function PostalInfoCard({ office }) {
  if (!office) return null;

  return (
    <div className="mt-2 p-4 rounded-xl border" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--surface)' }}>
      <h4 className="text-[13px] font-bold uppercase tracking-wider mb-3 text-gray-500">Postal Information</h4>
      
      <div className="grid grid-cols-2 gap-y-3 gap-x-4">
        <div>
          <p className="text-[11px] text-gray-500 mb-0.5">Post Office</p>
          <p className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>{office.officeName}</p>
        </div>
        
        <div>
          <p className="text-[11px] text-gray-500 mb-0.5">Pincode</p>
          <p className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>{office.pincode}</p>
        </div>

        <div>
          <p className="text-[11px] text-gray-500 mb-0.5">Type & Delivery</p>
          <p className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
            {office.officeType} • {office.deliveryStatus}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-gray-500 mb-0.5">Postal District</p>
          <p className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
            {office.postalDistrictName || '-'}
          </p>
        </div>
        
        <div>
          <p className="text-[11px] text-gray-500 mb-0.5">Postal Taluka</p>
          <p className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
            {office.postalTalukaName || '-'}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-gray-500 mb-0.5">Postal Division</p>
          <p className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
            {office.postalDivisionName || '-'}
          </p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-dashed" style={{ borderColor: 'var(--line)' }}>
        <p className="text-[10px] text-gray-400 italic">
          * Postal information is sourced from the integrated India Post dataset. Postal districts may differ from canonical administrative districts.
        </p>
      </div>
    </div>
  );
}
