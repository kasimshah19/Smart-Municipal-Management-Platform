import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CF2', '#F28C8C'];

export function StatusPieChart({ data }) {
  if (!data || Object.keys(data).length === 0) return <div>No data available</div>;

  // Convert object { SUBMITTED: 10, RESOLVED: 5 } to array [{ name: 'SUBMITTED', value: 10 }]
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendsBarChart({ data }) {
  if (!data || data.length === 0) return <div>No trend data available</div>;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="submitted" stackId="a" fill="#0088FE" name="Submitted" />
          <Bar dataKey="resolved" stackId="a" fill="#00C49F" name="Resolved" />
          <Bar dataKey="reopened" stackId="a" fill="#FFBB28" name="Reopened" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBarChart({ data }) {
  if (!data || data.length === 0) return <div>No category data available</div>;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="active" fill="#0088FE" name="Active" />
          <Bar dataKey="resolved" fill="#00C49F" name="Resolved" />
          <Bar dataKey="overdue" fill="#FF8042" name="Overdue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DepartmentWorkloadChart({ data }) {
  if (!data || data.length === 0) return <div>No department data available</div>;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip />
          <Legend />
          <Bar dataKey="active" fill="#0088FE" name="Active" />
          <Bar dataKey="resolved" fill="#00C49F" name="Resolved" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WardWorkloadChart({ data }) {
  if (!data || data.length === 0) return <div>No ward data available</div>;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="wardNumber" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="active" fill="#0088FE" name="Active" />
          <Bar dataKey="resolved" fill="#00C49F" name="Resolved" />
          <Bar dataKey="overdue" fill="#FF8042" name="Overdue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WorkerWorkloadChart({ data }) {
  if (!data || data.length === 0) return <div>No worker/team data available</div>;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="inProgress" stackId="a" fill="#0088FE" name="In Progress" />
          <Bar dataKey="completionSubmitted" stackId="a" fill="#FFBB28" name="Pending Verif." />
          <Bar dataKey="resolved" stackId="a" fill="#00C49F" name="Resolved" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MunicipalityWorkloadChart({ data }) {
  if (!data || data.length === 0) return <div>No municipality data available</div>;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="active" fill="#0088FE" name="Active" />
          <Bar dataKey="resolved" fill="#00C49F" name="Resolved" />
          <Bar dataKey="overdue" fill="#FF8042" name="Overdue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistrictWorkloadChart({ data }) {
  if (!data || data.length === 0) return <div>No district data available</div>;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="district" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="active" fill="#0088FE" name="Active" />
          <Bar dataKey="resolved" fill="#00C49F" name="Resolved" />
          <Bar dataKey="overdue" fill="#FF8042" name="Overdue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AreaWorkloadChart({ data }) {
  if (!data || data.length === 0) return <div>No area data available</div>;

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={120} />
          <Tooltip />
          <Legend />
          <Bar dataKey="active" fill="#0088FE" name="Active" />
          <Bar dataKey="resolved" fill="#00C49F" name="Resolved" />
          <Bar dataKey="overdue" fill="#FF8042" name="Overdue" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

