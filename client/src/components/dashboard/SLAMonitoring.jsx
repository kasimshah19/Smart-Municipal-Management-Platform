import React from 'react';

const SLAMonitoring = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white/50 p-6 rounded-xl border h-full" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>SLA Monitoring</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white/50 p-6 rounded-xl border h-full" style={{ borderColor: 'var(--border)' }}>
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>SLA Monitoring</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500 font-medium">Compliance</p>
          <p className={`text-3xl font-bold mt-1 ${data.compliancePercent >= 90 ? 'text-green-600' : data.compliancePercent >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
            {data.compliancePercent}%
          </p>
        </div>
        
        <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500 font-medium">Overdue</p>
          <p className={`text-3xl font-bold mt-1 ${data.overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {data.overdue}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total Eligible Tasks:</span>
          <span className="font-semibold text-gray-900">{data.totalEligible}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Resolved Within SLA:</span>
          <span className="font-semibold text-gray-900">{data.resolvedWithinSla}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Avg Resolution Time:</span>
          <span className="font-semibold text-gray-900">{data.avgResolutionTimeHours} hrs</span>
        </div>
      </div>
    </div>
  );
};

export default SLAMonitoring;
