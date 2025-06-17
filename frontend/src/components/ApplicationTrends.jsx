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

  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains("dark"));

  const data = {
    labels: last7Days,
    datasets: [
      {
        label: "Applications",
        data: countsByDate,
        backgroundColor: isDarkMode ? "#06b6d4" : "#8E9775",
        hoverBackgroundColor: isDarkMode ? "#22d3ee" : "#7c8667",
      },
    ],
  };

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
        font: { size: 16, weight: 'bold', family: isDarkMode ? "monospace" : undefined },
        color: isDarkMode ? "#e5e7eb" : "#3b3b3b",
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? "#e5e7eb" : "#3b3b3b",
          font: { size: 10, family: isDarkMode ? "monospace" : undefined }
        },
        grid: {
          color: isDarkMode ? "#e5e7eb" : "#E5E5E0",
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: isDarkMode ? "#e5e7eb" : "#3b3b3b",
          font: { size: 10, family: isDarkMode ? "monospace" : undefined }
        },
        grid: {
          color: isDarkMode ? "#e5e7eb" : "#E5E5E0",
        },
      },
    },
  };

  return (
    <div
      className={
        "mb-8 bg-[#F9F9F6] dark:bg-[#101010] p-4 rounded shadow" +
        (isDarkMode ? " font-mono" : "")
      }
      style={{ height: '300px' }}
    >
      <Bar data={data} options={options} />
    </div>
  );
};

export default ApplicationTrends;