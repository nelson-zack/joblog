import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ApplicationTrends = ({ jobs }) => {
  // Get the last 7 days as labels
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  // Count jobs by date_applied
  const countsByDate = last7Days.map((day) =>
    jobs.filter((job) => job.date_applied === day).length
  );

  const data = {
    labels: last7Days,
    datasets: [
      {
        label: "Applications",
        data: countsByDate,
        backgroundColor: "#3b82f6", // Tailwind blue-500
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "Job Applications - Last 7 Days",
        font: { size: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  };

  return (
    <div className="mb-8 bg-white p-4 rounded shadow">
      <Bar data={data} options={options} />
    </div>
  );
};

export default ApplicationTrends;