import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import MainLayout from '../../layouts/MainLayout';
import { useAuth } from '../../hooks/useAuth';
import ImageUpload from '../../components/common/ImageUpload';

const WorkerTaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [completionNote, setCompletionNote] = useState('');
  const [evidenceImages, setEvidenceImages] = useState([]);

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/complaints/${id}`);
      if (response.data.success) {
        setTask(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWork = async () => {
    try {
      setActionLoading(true);
      const response = await api.post(`/complaints/${id}/start`);
      if (response.data.success) {
        setTask(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start work');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitCompletion = async (e) => {
    e.preventDefault();
    if (!completionNote) {
      setError('Please provide a completion note');
      return;
    }
    try {
      setActionLoading(true);
      // First upload evidence if there are images
      let evidenceUrls = [];
      if (evidenceImages.length > 0) {
        const formData = new FormData();
        evidenceImages.forEach((img) => formData.append('images', img));
        formData.append('type', 'RESOLUTION');
        formData.append('description', completionNote);

        const uploadRes = await api.post(`/complaints/${id}/evidence`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (!uploadRes.data.success) throw new Error('Failed to upload evidence');
      }

      const response = await api.post(`/complaints/${id}/submit-completion`, { note: completionNote });
      if (response.data.success) {
        setTask(response.data.data);
        setCompletionNote('');
        setEvidenceImages([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit completion');
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

  if (!task) return null;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate('/worker/tasks')} className="text-gray-500 hover:text-gray-900 mb-6 flex items-center gap-2">
          &larr; Back to Tasks
        </button>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
                <p className="text-gray-500 mt-1">Complaint #{task._id}</p>
              </div>
              <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {task.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Description</h3>
            <p className="text-gray-800 bg-gray-50 p-4 rounded-lg">{task.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Location</h3>
                <p className="text-gray-800">{task.address?.street}</p>
                <p className="text-gray-600 text-sm">Ward {task.ward?.wardNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</h3>
                <p className="text-gray-800">{task.category?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Worker Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Task Actions</h2>
          
          {task.status === 'ASSIGNED' && (
            <div>
              <p className="text-gray-600 mb-4">You have been assigned to this task. Mark it as In Progress when you begin work.</p>
              <button
                onClick={handleStartWork}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Starting...' : 'Start Work (In Progress)'}
              </button>
            </div>
          )}

          {task.status === 'IN_PROGRESS' && (
            <div>
              <p className="text-gray-600 mb-6">Once you have completed the work, submit the completion details and evidence for review.</p>
              <form onSubmit={handleSubmitCompletion} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Completion Note *</label>
                  <textarea
                    required
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow min-h-[120px]"
                    placeholder="Describe the work done..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Evidence Images</label>
                  <ImageUpload 
                    images={evidenceImages} 
                    setImages={setEvidenceImages}
                    maxImages={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !completionNote}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Work for Review'}
                </button>
              </form>
            </div>
          )}

          {task.status === 'COMPLETION_SUBMITTED' && (
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h3 className="text-yellow-800 font-bold mb-2">Under Review</h3>
              <p className="text-yellow-700">You have submitted this work for review. Your supervisor will verify and approve it shortly.</p>
            </div>
          )}

          {task.status === 'RESOLVED' && (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-green-800 font-bold mb-2">Resolved</h3>
              <p className="text-green-700">This task has been fully resolved and verified.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default WorkerTaskDetails;
