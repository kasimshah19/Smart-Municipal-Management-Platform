import { useSelector } from 'react-redux';
import NewComplaintForm from './NewComplaintForm.jsx';
import ComplaintCard from './ComplaintCard.jsx';

function CitizenDashboard() {
  const complaints = useSelector((state) => state.complaints.items);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[380px_1fr]">
      {/* Left Column: Form */}
      <div>
        <div className="sticky top-20">
          <NewComplaintForm />
        </div>
      </div>

      {/* Right Column: List */}
      <div>
        <h2 className="mb-4 text-[18px] font-bold" style={{ color: 'var(--ink)' }}>
          Your Complaints
        </h2>
        
        {complaints.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center py-12 text-center"
            style={{ 
              backgroundColor: 'var(--surface)', 
              borderRadius: '14px', 
              border: '1px dashed var(--line)' 
            }}
          >
            <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
              You haven't submitted any complaints yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {complaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CitizenDashboard;
