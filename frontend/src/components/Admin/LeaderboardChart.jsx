import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from "recharts";

const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f59e0b'];

const LeaderboardChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart 
        layout="vertical" 
        data={data} 
        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
        barSize={24}
      >
        {/* Hide the bottom numbers for a cleaner look */}
        <XAxis type="number" hide />
        
        {/* The Movie Titles on the left */}
        <YAxis 
          dataKey="name" 
          type="category" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#D1D5DB', fontSize: 13 }}
          width={100}
        />
        
        <Tooltip
          cursor={{ fill: 'transparent' }}
          contentStyle={{
            backgroundColor: "#1F2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            color: "#fff"
          }}
        />
        
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default LeaderboardChart;