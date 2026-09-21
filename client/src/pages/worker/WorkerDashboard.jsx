import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import MainLayout from '../../layouts/MainLayout';
import { useSelector } from 'react-redux';
const WorkerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    TOTAL_ACTIVE: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    COMPLETION_SUBMITTED: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/worker/tasks/stats');
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Failed to load stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Worker Operations</h1>
        <p className="text-gray-600 mb-8">Welcome back, {user?.firstName}. Here is an overview of your active tasks.</p>

        {loading ? (
          <div className="flex justify-center p-8">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-gray-500 text-sm font-medium">Total Active Tasks</span>
              <span className="text-4xl font-bold text-primary-600 mt-2">{stats.TOTAL_ACTIVE}</span>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-gray-500 text-sm font-medium">Assigned</span>
              <span className="text-4xl font-bold text-yellow-600 mt-2">{stats.ASSIGNED}</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-gray-500 text-sm font-medium">In Progress</span>
              <span className="text-4xl font-bold text-blue-600 mt-2">{stats.IN_PROGRESS}</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-gray-500 text-sm font-medium">Pending Review</span>
              <span className="text-4xl font-bold text-purple-600 mt-2">{stats.COMPLETION_SUBMITTED}</span>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Link
            to="/worker/tasks"
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-4 px-6 rounded-xl text-center shadow-sm transition-colors text-lg"
          >
            View My Tasks
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default WorkerDashboard;
