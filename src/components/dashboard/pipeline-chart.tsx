"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/status";
import type { PropertyStatus } from "@prisma/client";

export function PipelineChart({ counts }: { counts: Record<string, number> }) {
  const data = STATUS_ORDER.filter((s) => (counts[s] ?? 0) > 0).map((s) => ({
    status: STATUS_LABEL[s as PropertyStatus],
    count: counts[s] ?? 0,
  }));

  if (data.length === 0) return null;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid horizontal={false} stroke="#e6ddc7" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#6b6d5b" }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="status"
            width={150}
            tick={{ fontSize: 11, fill: "#454737" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "#f2ecdd" }}
            contentStyle={{
              background: "#fffdf8",
              border: "1px solid #e6ddc7",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" fill="#2a5136" radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
