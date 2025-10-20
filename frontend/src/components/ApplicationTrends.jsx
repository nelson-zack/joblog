import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper to get YYYY-MM-DD for a Date in local timezone
function ymdLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get current date, optionally overridden by debugNow URL param
function getNow() {
  const params = new URLSearchParams(window.location.search);
  const debugNow = params.get('debugNow');
  if (debugNow) {
    const parsed = new Date(debugNow);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return new Date();
}

const ApplicationTrends = ({ jobs }) => {
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : false
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Generate last 7 days in local timezone (midnight)
  const last7Days = [...Array(7)].map((_, i) => {
    const date = getNow();
    date.setHours(0, 0, 0, 0); // Set to local midnight
    date.setDate(date.getDate() - (6 - i));
    return ymdLocal(date);
  });

  const countsByDate = last7Days.map(
    (day) => jobs.filter((job) => String(job.date_applied) === day).length
  );

  if (!jobs.length) return null;

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  const aspectRatio = isMobile ? 1.1 : 2.1;

  const data = {
    labels: last7Days,
    datasets: [
      {
        label: 'Applications',
        data: countsByDate,
        backgroundColor: isDarkMode ? '#06b6d4' : '#8E9775',
        hoverBackgroundColor: isDarkMode ? '#22d3ee' : '#7c8667'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Job Applications - Last 7 Days',
        font: {
          size: isMobile ? 14 : 16,
          weight: 'bold',
          family: isDarkMode ? 'monospace' : undefined
        },
        color: isDarkMode ? '#e5e7eb' : '#3b3b3b'
      }
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? '#e5e7eb' : '#3b3b3b',
          font: { size: isMobile ? 9 : 10, family: isDarkMode ? 'monospace' : undefined }
        },
        grid: {
          color: isDarkMode ? '#e5e7eb' : '#E5E5E0'
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: isDarkMode ? '#e5e7eb' : '#3b3b3b',
          font: { size: isMobile ? 9 : 10, family: isDarkMode ? 'monospace' : undefined }
        },
        grid: {
          color: isDarkMode ? '#e5e7eb' : '#E5E5E0'
        }
      }
    }
  };

  return (
    <div
      className={
        'mb-8 bg-[#F9F9F6] dark:bg-[#101010] p-4 rounded shadow' +
        (isDarkMode ? ' font-mono' : '')
      }
      style={{
        maxWidth: '48rem',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}
    >
      <Bar
        data={data}
        options={options}
        style={{
          margin: '0 auto',
          maxWidth: '100%',
          width: '100%'
        }}
      />
    </div>
  );
};

export default ApplicationTrends;
