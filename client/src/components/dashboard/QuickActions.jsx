import React from 'react';
import { Link } from 'react-router-dom';

const QuickActions = ({ actions }) => {
  return (
    <div className="bg-white/50 p-6 rounded-xl border h-full" style={{ borderColor: 'var(--border)' }}>
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const isImplemented = action.path && action.path !== '#';
          
          if (isImplemented) {
            return (
              <Link
                key={index}
                to={action.path}
                className="flex items-center justify-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-sm font-medium text-center hover:bg-gray-50"
                style={{ color: 'var(--primary)' }}
              >
                {action.label}
              </Link>
            );
          }
          
          return (
            <button
              key={index}
              onClick={() => alert('This feature will be implemented in the next phase.')}
              className="flex items-center justify-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow text-sm font-medium text-center hover:bg-gray-50 opacity-80"
              style={{ color: 'var(--primary)' }}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
