import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

const getChartColors = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    gradientId: "dashboardRevenueGradient",
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

const RevenueChart = ({ data }) => {
  const { theme } = useTheme();
  const colors = useMemo(() => getChartColors(), [theme]);

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) {
      return null;
    }
    const data = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: colors.tooltipBackground,
          border: `1px solid ${colors.tooltipBorder}`,
          borderRadius: "12px",
          color: colors.tooltipText,
          boxShadow: colors.shadow,
          padding: "12px 16px",
        }}
      >
        <p style={{ margin: "0 0 6px 0", fontWeight: 600 }}>{data.date}</p>
        <p style={{ margin: "0", color: colors.tooltipAccent, fontWeight: 700 }}>
          {currencySymbol}{Math.round(data.revenue).toLocaleString()}
        </p>
        {data.count && (
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.8 }}>
            Bookings: {data.count}
          </p>
        )}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 60 }} barSize={48}>
        <defs>
          <linearGradient id={colors.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.gradientStart} stopOpacity={1} />
            <stop offset="100%" stopColor={colors.gradientEnd} stopOpacity={0.8} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="4 4" stroke={colors.grid} vertical={false} opacity={0.5} />

        <XAxis
          dataKey="date"
          stroke={colors.axis}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: colors.axis, fontWeight: 600 }}
          angle={-45}
          textAnchor="start"
          interval={0}
          tickMargin={20}
          dy={10}
        />

        <YAxis
          stroke={colors.axis}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: colors.axis }}
          tickFormatter={(value) =>
            value >= 1000
              ? `${currencySymbol}${Math.round(value / 1000)}k`
              : `${currencySymbol}${Math.round(value)}`
          }
          width={60}
        />

        <Tooltip content={renderTooltip} cursor={{ fill: colors.cursor, opacity: 0.2 }} />

        <Bar dataKey="revenue" fill={`url(#${colors.gradientId})`} radius={[10, 10, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;
