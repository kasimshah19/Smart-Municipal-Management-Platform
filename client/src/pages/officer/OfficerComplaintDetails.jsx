import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import MainLayout from '../../layouts/MainLayout';
import { useSelector } from 'react-redux';
const OfficerComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [complaint, setComplaint] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Assignment state
  const [assignment, setAssignment] = useState({
    type: 'EMPLOYEE',
    assignedToEmployeeId: '',
    assignedToTeamId: '',
    reason: ''
  });

  // Review state
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compRes, empRes, teamRes] = await Promise.all([
        api.get(`/complaints/${id}`),
        api.get('/employees?role=WORKER'),
        api.get('/worker-teams')
      ]);
      
      if (compRes.data.success) setComplaint(compRes.data.data);
      if (empRes.data.success) setEmployees(empRes.data.data);
      if (teamRes.data.success) setTeams(teamRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload = { reason: assignment.reason };
      if (assignment.type === 'EMPLOYEE') {
        payload.assignedToEmployeeId = assignment.assignedToEmployeeId;
      } else {
        payload.assignedToTeamId = assignment.assignedToTeamId;
      }
      
      const response = await api.post(`/complaints/${id}/assign`, payload);
      if (response.data.success) {
        setComplaint(response.data.data);
        alert('Assigned successfully');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReview = async (isApproved) => {
    if (!reviewNote) {
      setError('Please provide a review note/reason');
      return;
    }
    try {
      setActionLoading(true);
      const endpoint = isApproved ? 'approve-completion' : 'reject-completion';
      const payload = isApproved ? { note: reviewNote } : { reason: reviewNote };
      
      const response = await api.post(`/complaints/${id}/${endpoint}`, payload);
      if (response.data.success) {
        setComplaint(response.data.data);
        alert(`Completion ${isApproved ? 'Approved' : 'Rejected'} successfully`);
        setReviewNote('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center p-12">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!complaint) return null;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="mb-4 text-blue-600 hover:underline">
          &larr; Back
        </button>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>}

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{complaint.title}</h1>
              <p className="text-gray-500">ID: {complaint._id}</p>
            </div>
            <span className="px-3 py-1 bg-gray-100 rounded-full font-medium text-sm">
              {complaint.status}
            </span>
          </div>
          
          <div className="mt-4 text-gray-700">
            <p>{complaint.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Assignment UI */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Task Assignment</h2>
            {complaint.status === 'SUBMITTED' || complaint.status === 'VERIFIED' || complaint.status === 'ASSIGNED' ? (
              <form onSubmit={handleAssign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Assign To</label>
                  <select
                    className="w-full border rounded p-2"
                    value={assignment.type}
                    onChange={(e) => setAssignment({...assignment, type: e.target.value})}
                  >
                    <option value="EMPLOYEE">Individual Worker</option>
                    <option value="TEAM">Worker Team</option>
                  </select>
                </div>

                {assignment.type === 'EMPLOYEE' ? (
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Worker</label>
                    <select
                      required
                      className="w-full border rounded p-2"
                      value={assignment.assignedToEmployeeId}
                      onChange={(e) => setAssignment({...assignment, assignedToEmployeeId: e.target.value})}
                    >
                      <option value="">-- Choose Worker --</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>{emp.user?.firstName} {emp.user?.lastName} (ID: {emp.employeeId})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Team</label>
                    <select
                      required
                      className="w-full border rounded p-2"
                      value={assignment.assignedToTeamId}
                      onChange={(e) => setAssignment({...assignment, assignedToTeamId: e.target.value})}
                    >
                      <option value="">-- Choose Team --</option>
                      {teams.map(team => (
                        <option key={team._id} value={team._id}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Assignment Note</label>
                  <textarea
                    required
                    className="w-full border rounded p-2"
                    value={assignment.reason}
                    onChange={(e) => setAssignment({...assignment, reason: e.target.value})}
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  {actionLoading ? 'Assigning...' : (complaint.status === 'ASSIGNED' ? 'Reassign' : 'Assign Task')}
                </button>
              </form>
            ) : (
              <p className="text-gray-500">Assignment cannot be changed at this stage.</p>
            )}
          </div>

          {/* Completion Review UI */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold mb-4">Completion Review</h2>
            {complaint.status === 'COMPLETION_SUBMITTED' ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded text-yellow-800">
                  Worker has submitted this task for review. Please check evidence and approve or reject.
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Review Note / Rejection Reason *</label>
                  <textarea
                    required
                    className="w-full border rounded p-2"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Enter your remarks here..."
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => handleReview(true)}
                    disabled={actionLoading || !reviewNote}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(false)}
                    disabled={actionLoading || !reviewNote}
                    className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Not pending review at the moment.</p>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OfficerComplaintDetails;
