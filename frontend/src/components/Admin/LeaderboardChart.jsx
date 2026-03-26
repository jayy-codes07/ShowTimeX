import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LabelList,
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
  const chartHeight = Math.max(160, (data?.length || 0) * 40 + 16);
  const maxLabelLength = 18;

  const truncateLabel = (label = "") =>
    label.length > maxLabelLength ? `${label.slice(0, maxLabelLength - 1)}...` : label;

  const formatValue = (value) =>
    value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value;

  const renderTooltipContent = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const item = payload[0]?.payload;

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
        <div style={{ marginBottom: "4px" }}>{item?.name || "Movie"}</div>
        Value: {formatValue(payload[0].value)}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 36, left: 0, bottom: 4 }}
        barSize={20}
        barCategoryGap={12}
      >
        <XAxis type="number" hide />

        <YAxis
          dataKey="name"
          type="category"
          axisLine={false}
          tickLine={false}
          tick={{ fill: colors.axis, fontSize: 12 }}
          tickFormatter={truncateLabel}
          width={140}
        />

        <Tooltip
          cursor={{ fill: "transparent" }}
          content={renderTooltipContent}
        />

        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          <LabelList
            dataKey="value"
            position="right"
            fill={colors.axis}
            fontSize={12}
            formatter={formatValue}
          />
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors.bars[index % colors.bars.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default LeaderboardChart;
