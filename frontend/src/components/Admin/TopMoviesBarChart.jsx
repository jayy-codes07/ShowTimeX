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
    gradientId: "dashboardTopMoviesGradient",
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

const splitLabel = (label = "", maxChars = 20) => {
  const words = String(label).trim().split(/\s+/);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    if (!current) {
      current = word;
      return;
    }
    if ((current + " " + word).length <= maxChars) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [String(label)];
};

const TopMoviesBarChart = ({ data }) => {
  const { theme } = useTheme();
  const colors = useMemo(() => getChartColors(), [theme]);

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) {
      return null;
    }
    const item = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: colors.tooltipBackground,
          border: `1px solid ${colors.tooltipBorder}`,
          borderRadius: "12px",
          color: colors.tooltipText,
          boxShadow: colors.shadow,
          padding: "10px 14px",
          fontWeight: 600,
        }}
      >
        <div style={{ marginBottom: "6px" }}>{item?.date || "Movie"}</div>
        <div style={{ color: colors.tooltipAccent }}>
          Tickets: {Math.round(item?.revenue || 0)}
        </div>
      </div>
    );
  };

  const lineHeight = 12;
  const maxLineCount = Math.max(
    1,
    ...(data || []).map((item) => splitLabel(item?.date || "Movie", 20).length)
  );
  const xAxisHeight = 8 + maxLineCount * lineHeight + 8;

  const CustomTick = ({ x, y, payload }) => {
    const lines = splitLabel(payload?.value || "", 20);
    const blockHeight = lines.length * lineHeight;
    const offset = Math.max(0, (xAxisHeight - blockHeight) / 2);
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={offset + lineHeight}
          textAnchor="middle"
          fill={colors.axis}
          fontSize={14}
          fontWeight={500}
        >
          {lines.map((line, index) => (
            <tspan key={`${line}-${index}`} x={0} dy={index === 0 ? 0 : lineHeight}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 8 }} barSize={40}>
        <defs>
          <linearGradient id={colors.gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.gradientStart} stopOpacity={1} />
            <stop offset="100%" stopColor={colors.gradientEnd} stopOpacity={0.85} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="4 4" stroke={colors.grid} vertical={false} opacity={1} />

        <XAxis
          dataKey="date"
          stroke={colors.axis}
          axisLine={false}
          tickLine={false}
          angle={0}
          textAnchor="middle"
          interval={0}
          tickMargin={20}
          
          height={xAxisHeight}
          tick={<CustomTick />}
        />

        <YAxis
          stroke={colors.axis}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: colors.axis }}
          tickFormatter={(value) => Math.round(value)}
          width={40}
        />

        <Tooltip content={renderTooltip} cursor={false} />

        <Bar dataKey="revenue" fill={`url(#${colors.gradientId})`} radius={[10, 10, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopMoviesBarChart;
