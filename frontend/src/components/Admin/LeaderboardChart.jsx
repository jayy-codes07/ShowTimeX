import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

const getChartColors = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    bars: [
      style.getPropertyValue("--chart-color-1").trim(),
      style.getPropertyValue("--chart-color-2").trim(),
      style.getPropertyValue("--chart-color-3").trim(),
      style.getPropertyValue("--chart-color-4").trim(),
      style.getPropertyValue("--chart-color-5").trim(),
    ],
    axis: style.getPropertyValue("--chart-axis").trim(),
    tooltipBackground: style.getPropertyValue("--chart-tooltip-bg").trim(),
    tooltipBorder: style.getPropertyValue("--chart-tooltip-border").trim(),
    tooltipText: style.getPropertyValue("--chart-tooltip-text").trim(),
    shadow: style.getPropertyValue("--chart-shadow").trim(),
  };
};

const LeaderboardChart = ({ data }) => {
  const { theme } = useTheme();
  const colors = useMemo(() => getChartColors(), [theme]);

  const renderTooltipContent = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    return (
      <div
        style={{
          backgroundColor: colors.tooltipBackground,
          border: `1px solid ${colors.tooltipBorder}`,
          borderRadius: "12px",
          color: colors.tooltipText,
          boxShadow: colors.shadow,
          padding: "8px 12px",
          fontWeight: 600,
        }}
      >
        Value: {payload[0].value}
      </div>
    );
  };

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
          content={renderTooltipContent}
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
