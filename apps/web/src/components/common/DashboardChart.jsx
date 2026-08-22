import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

const LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DATA = [
  42, 45, 70, 65, 140, 130, 145, 145, 160, 135, 140, 130, 135, 140, 250,
];

/** Line chart of the dashboard overview (`chart-init.js`). */
export default function DashboardChart({ id = "lineChart" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const context = canvasRef.current.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(21, 99, 223,0.2)");
    gradient.addColorStop(1, "rgba(21, 99, 223,0)");

    const chart = new Chart(context, {
      type: "line",
      data: {
        labels: LABELS,
        datasets: [
          {
            data: DATA,
            backgroundColor: gradient,
            borderColor: "#1563DF",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });

    return () => chart.destroy();
  }, []);

  return <canvas id={id} ref={canvasRef} />;
}
