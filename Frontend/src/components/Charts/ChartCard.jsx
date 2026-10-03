import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Global Chart defaults
ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.color = '#6B7280';
ChartJS.defaults.plugins.tooltip.backgroundColor = '#1F2937';
ChartJS.defaults.plugins.tooltip.padding = 10;
ChartJS.defaults.plugins.tooltip.cornerRadius = 8;

export const LineChart = ({ data, options = {}, height = 260 }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 12, usePointStyle: true },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#F1F5F9' } },
    },
    ...options,
  };

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Line data={data} options={defaultOptions} />
    </div>
  );
};

export const BarChart = ({ data, options = {}, height = 260 }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#F1F5F9' } },
    },
    ...options,
  };

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Bar data={data} options={defaultOptions} />
    </div>
  );
};

export const DoughnutChart = ({ data, options = {}, height = 260 }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, usePointStyle: true, padding: 15 },
      },
    },
    ...options,
  };

  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <Doughnut data={data} options={defaultOptions} />
    </div>
  );
};

const ChartCard = ({
  title,
  subtitle,
  type = 'line', // line, bar, doughnut
  data,
  options,
  height = 260,
  badgeText,
  badgeVariant = 'primary',
  className = '',
}) => {
  return (
    <div className={`cf-card p-4 h-100 ${className}`}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h5 className="fs-6 fw-bold mb-0 text-dark">{title}</h5>
          {subtitle && <p className="text-muted small mb-0 mt-0.5">{subtitle}</p>}
        </div>
        {badgeText && (
          <span className={`cf-badge cf-badge-${badgeVariant}`}>{badgeText}</span>
        )}
      </div>

      <div>
        {type === 'line' && <LineChart data={data} options={options} height={height} />}
        {type === 'bar' && <BarChart data={data} options={options} height={height} />}
        {type === 'doughnut' && <DoughnutChart data={data} options={options} height={height} />}
      </div>
    </div>
  );
};

export default ChartCard;
