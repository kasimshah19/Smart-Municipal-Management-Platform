import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import MainLayout from '../../layouts/MainLayout';
import { useSelector } from 'react-redux';

const WorkerTaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [task, setTask] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [beforeImages, setBeforeImages] = useState([]);
  const [afterImages, setAfterImages] = useState([]);
  const [completionNote, setCompletionNote] = useState('');

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/complaints/${id}`);
      if (response.data.success) {
        setTask(response.data.data._doc || response.data.data);
        setEvidence(response.data.data.evidence || []);
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
        fetchTaskDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start work');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadBefore = async (e) => {
    e.preventDefault();
    if (beforeImages.length === 0) {
      setError('Please select before images');
      return;
    }
    try {
      setActionLoading(true);
      const formData = new FormData();
      beforeImages.forEach((img) => formData.append('files', img));
      formData.append('type', 'BEFORE_WORK');
      formData.append('description', 'Before starting work');

      const uploadRes = await api.post(`/complaints/${id}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (uploadRes.data.success) {
        setBeforeImages([]);
        fetchTaskDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload before evidence');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitCompletion = async (e) => {
    e.preventDefault();
    if (!completionNote || afterImages.length === 0) {
      setError('Please provide a completion note and after images');
      return;
    }
    try {
      setActionLoading(true);
      const formData = new FormData();
      afterImages.forEach((img) => formData.append('files', img));
      formData.append('type', 'AFTER_WORK');
      formData.append('description', completionNote);

      const uploadRes = await api.post(`/complaints/${id}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!uploadRes.data.success) throw new Error('Failed to upload evidence');

      const response = await api.post(`/complaints/${id}/submit-completion`, { note: completionNote });
      if (response.data.success) {
        setCompletionNote('');
        setAfterImages([]);
        fetchTaskDetails();
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

  const hasBeforeEvidence = evidence.some(e => e.type === 'BEFORE_WORK');

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

          {task.status === 'IN_PROGRESS' && !hasBeforeEvidence && (
            <div>
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                <h3 className="text-blue-800 font-semibold mb-2">Step 1: Upload Before Photo</h3>
                <p className="text-blue-600 text-sm">Please upload a photo showing the current state of the issue before you begin repairs.</p>
              </div>
              <form onSubmit={handleUploadBefore} className="space-y-6">
                <div>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={(e) => setBeforeImages(Array.from(e.target.files))}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading || beforeImages.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Uploading...' : 'Upload Before Evidence'}
                </button>
              </form>
            </div>
          )}

          {task.status === 'IN_PROGRESS' && hasBeforeEvidence && (
            <div>
              <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-100">
                <h3 className="text-green-800 font-semibold mb-2">Step 2: Complete Work</h3>
                <p className="text-green-600 text-sm">Upload after photos and submit completion details.</p>
              </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">After Evidence Images *</label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={(e) => setAfterImages(Array.from(e.target.files))}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !completionNote || afterImages.length === 0}
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
