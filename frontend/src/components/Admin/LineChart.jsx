import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

const getChartColors = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    gradientId: "dashboardLineGradient",
    gradientStart: style.getPropertyValue("--chart-gradient-start").trim(),
    gradientEnd: style.getPropertyValue("--chart-gradient-end").trim(),
    grid: style.getPropertyValue("--chart-grid").trim(),
    axis: style.getPropertyValue("--chart-axis").trim(),
    tooltipBackground: style.getPropertyValue("--chart-tooltip-bg").trim(),
    tooltipBorder: style.getPropertyValue("--chart-tooltip-border").trim(),
    tooltipText: style.getPropertyValue("--chart-tooltip-text").trim(),
    tooltipAccent: style.getPropertyValue("--chart-tooltip-accent").trim(),
    cursor: style.getPropertyValue("--chart-cursor").trim(),
    shadow: style.getPropertyValue("--chart-shadow").trim(),
  };
};

const currencySymbol = "\u20B9";

const LineChart = ({ data, isCurrency = true }) => {
  const { theme } = useTheme();
  const colors = useMemo(() => getChartColors(), [theme]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={colors.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.gradientStart} stopOpacity={0.8} />
            <stop offset="100%" stopColor={colors.gradientEnd} stopOpacity={0.1} />
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
            isCurrency
              ? value >= 1000
                ? `${currencySymbol}${Math.round(value / 1000)}k`
                : `${currencySymbol}${Math.round(value)}`
              : Math.round(value)
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
          formatter={(value) => [
            isCurrency ? `${currencySymbol}${Math.round(value).toLocaleString()}` : Math.round(value),
            "Value",
          ]}
        />

        <Area
          type="monotone"
          dataKey="revenue"
          fill={`url(#${colors.gradientId})`}
          stroke={colors.gradientStart}
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default LineChart;
