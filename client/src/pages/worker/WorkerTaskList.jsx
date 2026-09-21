import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import MainLayout from '../../layouts/MainLayout';


const WorkerTaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/worker/tasks');
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') {
      return ['ASSIGNED', 'IN_PROGRESS'].includes(task.status);
    }
    return task.status === statusFilter;
  });

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="ALL">All Tasks</option>
            <option value="ACTIVE">Active (Assigned/In Progress)</option>
            <option value="COMPLETION_SUBMITTED">Pending Review</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
            <p className="text-gray-500">No tasks found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTasks.map(task => (
              <div key={task._id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-gray-500">#{task._id.slice(-6).toUpperCase()}</span>
                    {getStatusBadge(task.status)}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{task.category?.name || 'Task'}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{task.address?.street}, Ward {task.ward?.wardNumber}</span>
                    <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <Link
                  to={`/worker/tasks/${task._id}`}
                  className="bg-primary-50 text-primary-700 hover:bg-primary-100 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default WorkerTaskList;
