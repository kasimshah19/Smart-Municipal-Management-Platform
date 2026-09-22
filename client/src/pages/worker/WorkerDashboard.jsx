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
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, tasksRes] = await Promise.all([
          api.get('/worker/tasks/stats'),
          api.get('/worker/tasks')
        ]);
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (tasksRes.data.success) {
          // Keep only active tasks for the dashboard
          const active = tasksRes.data.data.filter(t => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status));
          setTasks(active);
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      ASSIGNED: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETION_SUBMITTED: 'bg-purple-100 text-purple-800',
      RESOLVED: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

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
          <>
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

            <div className="mb-6 flex justify-between items-end">
              <h2 className="text-xl font-bold text-gray-900">Today's Active Tasks</h2>
              <div className="flex gap-4">
                <Link to="/worker/tasks?filter=nearby" className="text-gray-500 hover:text-gray-700 font-medium">Nearby Tasks</Link>
                <Link to="/worker/tasks" className="text-primary-600 hover:text-primary-700 font-medium">View All Tasks &rarr;</Link>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
                <p className="text-gray-500">No active tasks for today. Good job!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tasks.map(task => (
                  <div key={task._id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-semibold text-gray-500">#{task._id.slice(-6).toUpperCase()}</span>
                        {getStatusBadge(task.status)}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{task.category?.name || 'Task'}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{task.address?.street}, Ward {task.ward?.wardNumber}</span>
                      </div>
                    </div>
                    
                    <Link
                      to={`/worker/tasks/${task._id}`}
                      className="bg-primary-50 text-primary-700 hover:bg-primary-100 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
                    >
                      Start / Update Work
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default WorkerDashboard;
