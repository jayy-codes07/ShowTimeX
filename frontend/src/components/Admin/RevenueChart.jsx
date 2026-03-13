import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const chartColors = {
  dark: {
    gradientId: "dashboardRevenueGradientDark",
    gradientStart: "#e50914",
    gradientEnd: "#f97316",
    grid: "rgba(255, 255, 255, 0.08)",
    axis: "#9CA3AF",
    tooltipBackground: "#111827",
    tooltipBorder: "#374151",
    tooltipText: "#F9FAFB",
    tooltipAccent: "#FCA5A5",
    cursor: "rgba(255, 255, 255, 0.06)",
    shadow: "0 16px 34px rgba(0, 0, 0, 0.3)",
  },
  light: {
    gradientId: "dashboardRevenueGradientLight",
    gradientStart: "#bc6c25",
    gradientEnd: "#dda15e",
    grid: "rgba(118, 102, 75, 0.18)",
    axis: "#5b4c35",
    tooltipBackground: "#fff8e1",
    tooltipBorder: "rgba(221, 161, 94, 0.55)",
    tooltipText: "#283618",
    tooltipAccent: "#bc6c25",
    cursor: "rgba(188, 108, 37, 0.1)",
    shadow: "0 16px 34px rgba(40, 54, 24, 0.12)",
  },
};

const currencySymbol = "\u20B9";

const RevenueChart = ({ data, theme = "dark" }) => {
  const colors = chartColors[theme] || chartColors.dark;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={36}>
        <defs>
          <linearGradient id={colors.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.gradientStart} stopOpacity={1} />
            <stop offset="100%" stopColor={colors.gradientEnd} stopOpacity={0.62} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />

        <XAxis
          dataKey="date"
          stroke={colors.axis}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 13, fill: colors.axis }}
          dy={10}
        />

        <YAxis
          stroke={colors.axis}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 13, fill: colors.axis }}
          tickFormatter={(value) =>
            value >= 1000
              ? `${currencySymbol}${Math.round(value / 1000)}k`
              : `${currencySymbol}${Math.round(value)}`
          }
        />

        <Tooltip
          cursor={{ fill: colors.cursor }}
          contentStyle={{
            backgroundColor: colors.tooltipBackground,
            border: `1px solid ${colors.tooltipBorder}`,
            borderRadius: "12px",
            color: colors.tooltipText,
            boxShadow: colors.shadow,
          }}
          labelStyle={{ color: colors.tooltipText, fontWeight: 600 }}
          itemStyle={{ color: colors.tooltipAccent, fontWeight: 700 }}
          formatter={(value) => [`${currencySymbol}${Math.round(value).toLocaleString()}`, "Revenue"]}
        />

        <Bar dataKey="revenue" fill={`url(#${colors.gradientId})`} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
