import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

const chartColors = {
  dark: {
    bars: ["#e50914", "#ef4444", "#f97316", "#f59e0b", "#fb7185"],
    axis: "#D1D5DB",
    tooltipBackground: "#111827",
    tooltipBorder: "#374151",
    tooltipText: "#F9FAFB",
    shadow: "0 16px 34px rgba(0, 0, 0, 0.3)",
  },
  light: {
    bars: ["#bc6c25", "#dda15e", "#606c38", "#7f5539", "#a98467"],
    axis: "#5b4c35",
    tooltipBackground: "#fff8e1",
    tooltipBorder: "rgba(221, 161, 94, 0.55)",
    tooltipText: "#283618",
    shadow: "0 16px 34px rgba(40, 54, 24, 0.12)",
  },
};

const LeaderboardChart = ({ data, theme = "dark" }) => {
  const colors = chartColors[theme] || chartColors.dark;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
        barSize={24}
      >
        <XAxis type="number" hide />

        <YAxis
          dataKey="name"
          type="category"
          axisLine={false}
          tickLine={false}
          tick={{ fill: colors.axis, fontSize: 13 }}
          width={100}
        />

        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{
            backgroundColor: colors.tooltipBackground,
            border: `1px solid ${colors.tooltipBorder}`,
            borderRadius: "12px",
            color: colors.tooltipText,
            boxShadow: colors.shadow,
          }}
          labelStyle={{ color: colors.tooltipText, fontWeight: 600 }}
          itemStyle={{ color: colors.tooltipText, fontWeight: 600 }}
        />

        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors.bars[index % colors.bars.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default LeaderboardChart;
