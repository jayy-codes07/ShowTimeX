import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const getChartColors = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    slices: [
      style.getPropertyValue("--chart-color-1").trim(),
      style.getPropertyValue("--chart-color-2").trim(),
      style.getPropertyValue("--chart-color-3").trim(),
      style.getPropertyValue("--chart-color-4").trim(),
      style.getPropertyValue("--chart-color-5").trim(),
    ],
    tooltipBackground: style.getPropertyValue("--chart-tooltip-bg").trim(),
    tooltipBorder: style.getPropertyValue("--chart-tooltip-border").trim(),
    tooltipText: style.getPropertyValue("--chart-tooltip-text").trim(),
    legend: style.getPropertyValue("--chart-axis").trim(),
    shadow: style.getPropertyValue("--chart-shadow").trim(),
  };
};

const MovieDistributionChart = ({ data }) => {
  const colors = getChartColors();

  // Calculate total value
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const centerValue = `₹${(total / 1000).toFixed(0)}K`;

  return (
    <div>
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              label={false}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors.slices[index % colors.slices.length]} />
              ))}
            </Pie>

          </PieChart>
        </ResponsiveContainer>

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "45%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ color: colors.legend, fontSize: "22px", fontWeight: 700, lineHeight: 1.05 }}>
            {centerValue}
          </div>
          <div style={{ color: colors.legend, fontSize: "10px", opacity: 0.7, fontWeight: 500, marginTop: "4px" }}>
            Total Revenue
          </div>
        </div>
      </div>
      
      {/* Custom Legend Below Chart */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "24px", 
        marginTop: "20px",
        padding: "12px 8px 0"
      }}>
        {data.map((entry, index) => {
          const percentage = ((entry.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0);
          return (
            <div
              key={`legend-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                color: colors.legend,
              }}
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: colors.slices[index % colors.slices.length],
                  flexShrink: 0,
                }}
              />
              <span>{entry.name}</span>
              <span style={{ fontWeight: "600" }}>{percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MovieDistributionChart;
