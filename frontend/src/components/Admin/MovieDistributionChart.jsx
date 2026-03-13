import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const chartColors = {
  dark: {
    slices: ["#e50914", "#ef4444", "#f97316", "#f59e0b", "#fb7185"],
    tooltipBackground: "#111827",
    tooltipBorder: "#374151",
    tooltipText: "#F9FAFB",
    legend: "#D1D5DB",
    shadow: "0 16px 34px rgba(0, 0, 0, 0.3)",
  },
  light: {
    slices: ["#bc6c25", "#dda15e", "#606c38", "#7f5539", "#a98467"],
    tooltipBackground: "#fff8e1",
    tooltipBorder: "rgba(221, 161, 94, 0.55)",
    tooltipText: "#283618",
    legend: "#5b4c35",
    shadow: "0 16px 34px rgba(40, 54, 24, 0.12)",
  },
};

const MovieDistributionChart = ({ data, theme = "dark" }) => {
  const colors = chartColors[theme] || chartColors.dark;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors.slices[index % colors.slices.length]} />
          ))}
        </Pie>

        <Tooltip
          contentStyle={{
            backgroundColor: colors.tooltipBackground,
            border: `1px solid ${colors.tooltipBorder}`,
            borderRadius: "0.75rem",
            color: colors.tooltipText,
            boxShadow: colors.shadow,
          }}
          labelStyle={{ color: colors.tooltipText, fontWeight: 600 }}
          itemStyle={{ color: colors.tooltipText, fontWeight: 600 }}
        />

        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => (
            <span style={{ color: colors.legend, fontSize: "12px" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default MovieDistributionChart;
