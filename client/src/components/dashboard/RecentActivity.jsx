import React from 'react';

const RecentActivity = ({ activity, loading }) => {
  if (loading) {
    return (
      <div className="bg-white/50 p-6 rounded-xl border h-full" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>Recent Activity</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <div className="bg-white/50 p-6 rounded-xl border h-full flex flex-col items-center justify-center text-center" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-bold mb-4 self-start" style={{ color: 'var(--ink)' }}>Recent Activity</h2>
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-3xl mb-2">📋</span>
          <p className="text-sm text-gray-500">No recent activity to display.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/50 p-6 rounded-xl border h-full overflow-hidden flex flex-col" style={{ borderColor: 'var(--border)' }}>
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>Recent Activity</h2>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
        {activity.map((item, index) => (
          <div key={index} className="flex gap-3 items-start">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${item.iconBg || 'bg-blue-100 text-blue-600'}`}>
              {item.icon || '📝'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500">{item.description}</p>
              <p className="text-xs text-gray-400 mt-1">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
