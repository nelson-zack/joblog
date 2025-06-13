import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ApplicationTrends = ({ jobs }) => {
  if (!jobs.length) return null;

  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const countsByDate = last7Days.map((day) =>
    jobs.filter((job) => job.date_applied === day).length
  );

  const data = {
    labels: last7Days,
    datasets: [
      {
        label: "Applications",
        data: countsByDate,
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Job Applications - Last 7 Days",
        font: { size: 16, weight: 'bold' },
        color: isDarkMode ? "#e5e7eb" : "#1f2937",
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? "#e5e7eb" : "#1f2937",
          font: { size: 12 }
        },
        grid: {
          color: isDarkMode ? "#6b7280" : "#d1d5db",
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: isDarkMode ? "#e5e7eb" : "#1f2937",
          font: { size: 12 }
        },
        grid: {
          color: isDarkMode ? "#6b7280" : "#d1d5db",
        },
      },
    },
  };

  return (
    <div className="mb-8 bg-white dark:bg-gray-900 p-4 rounded shadow" style={{ height: '300px' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default ApplicationTrends;