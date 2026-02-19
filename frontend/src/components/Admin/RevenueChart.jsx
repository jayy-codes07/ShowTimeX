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

const RevenueChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={36}>
        <defs>
          {/* Subtle elegant gradient */}
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="#9CA3AF" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 13, fill: '#9CA3AF' }}
          dy={10}
        />
        <YAxis 
          stroke="#9CA3AF" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 13, fill: '#9CA3AF' }}
          tickFormatter={(value) => value >= 1000 ? `₹${value / 1000}k` : `₹${value}`}
        />
        <Tooltip
          cursor={{ fill: '#374151', opacity: 0.3 }}
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#fff",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          }}
          itemStyle={{ color: "#818CF8", fontWeight: "bold" }}
        />
        <Bar 
          dataKey="revenue" 
          fill="url(#barGradient)" 
          radius={[6, 6, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;