import React, { useState } from 'react';
import MainLayout from '../../layouts/MainLayout.jsx';

import MunicipalityManager from './municipality/MunicipalityManager.jsx';
import DivisionManager from './geography/DivisionManager.jsx';
import DistrictManager from './geography/DistrictManager.jsx';
import TalukaManager from './geography/TalukaManager.jsx';
import WardManager from './wards/WardManager.jsx';
import AreaManager from './areas/AreaManager.jsx';
import DepartmentManager from './departments/DepartmentManager.jsx';
import DesignationManager from './designations/DesignationManager.jsx';
import EmployeeManager from './employees/EmployeeManager.jsx';
import WorkerTeamManager from './worker-teams/WorkerTeamManager.jsx';
import GramPanchayatManager from './gram-panchayats/GramPanchayatManager.jsx';
import ZillaParishadManager from './zilla-parishads/ZillaParishadManager.jsx';
import PanchayatSamitiManager from './panchayat-samitis/PanchayatSamitiManager.jsx';

const ENTITIES = [
  { key: 'divisions', label: 'Revenue Divisions', component: DivisionManager },
  { key: 'districts', label: 'Districts', component: DistrictManager },
  { key: 'talukas', label: 'Talukas', component: TalukaManager },
  { key: 'municipalities', label: 'Urban Local Bodies', component: MunicipalityManager },
  { key: 'zilla-parishads', label: 'Zilla Parishads', component: ZillaParishadManager },
  { key: 'panchayat-samitis', label: 'Panchayat Samitis', component: PanchayatSamitiManager },
  { key: 'gram-panchayats', label: 'Gram Panchayats', component: GramPanchayatManager },
  { key: 'wards', label: 'Wards', component: WardManager },
  { key: 'areas', label: 'Areas', component: AreaManager },
  { key: 'departments', label: 'Departments', component: DepartmentManager },
  { key: 'designations', label: 'Designations', component: DesignationManager },
  { key: 'employees', label: 'Employees', component: EmployeeManager },
  { key: 'worker-teams', label: 'Worker Teams', component: WorkerTeamManager },
];

function StructureManagement() {
  const [activeTab, setActiveTab] = useState(ENTITIES[0]);

  const ActiveComponent = activeTab.component;

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
          Local Body Structure Management
        </h1>
        <p style={{ color: 'var(--ink)', opacity: 0.7 }}>
          Manage the core configuration and hierarchy of the local body.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-4 mb-4 border-b hide-scrollbar" style={{ borderColor: 'var(--line)' }}>
        {ENTITIES.map(entity => (
          <button
            key={entity.key}
            onClick={() => setActiveTab(entity)}
            className="px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors rounded-lg snap-start"
            style={{
              backgroundColor: activeTab.key === entity.key ? 'var(--primary)' : 'transparent',
              color: activeTab.key === entity.key ? 'white' : 'var(--ink)',
              opacity: activeTab.key === entity.key ? 1 : 0.7
            }}
          >
            {entity.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div
        className="p-5"
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '14px',
          border: '1px solid var(--line)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        }}
      >
        <ActiveComponent />
      </div>
    </MainLayout>
  );
}

export default StructureManagement;
