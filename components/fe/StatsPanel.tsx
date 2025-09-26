"use client";

import { useState, useEffect } from "react";
import { fetchRankings } from "@/lib/evapi";
import type { RankingPlayer } from "@/types/ev";

const glassyCyanStyle = {
  background: "rgba(15, 23, 42, 0.85)",
  border: "1px solid rgba(6, 182, 212, 0.5)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: `
    0 0 35px rgba(6, 182, 212, 0.8),
    inset 0 0 15px rgba(6, 182, 212, 0.5)
  `,
  borderRadius: "6px",
};

interface StatItemProps {
  label: string;
  value: string | number;
  icon?: string;
}

function StatItem({ label, value, icon }: StatItemProps) {
  return (
    <div className="p-3 rounded-lg bg-slate-800/50 border border-cyan-500/20">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-cyan-400">{icon}</span>}
        <span className="text-cyan-300 text-sm font-medium">{label}</span>
      </div>
      <div className="text-cyan-100 text-lg font-bold">{value}</div>
    </div>
  );
}

export default function StatsPanel() {
  const [rankings, setRankings] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRankings() {
      setLoading(true);
      const data = await fetchRankings();
      setRankings(data);
      setLoading(false);
    }
    loadRankings();
  }, []);

  if (loading) {
    return (
      <div
        className="w-64 h-96 rounded-lg flex items-center justify-center"
        style={glassyCyanStyle}
      >
        <div className="text-cyan-300">Loading stats...</div>
      </div>
    );
  }

  // Calculate statistics from rankings data
  const totalPlayers = rankings.length;
  const onlinePlayers = rankings.filter((player) =>
    typeof player.online === "string" && player.online.toLowerCase() === "online"
  ).length;
  const mostKillsPerMatch = Math.max(...rankings.map((p) => p.kpg));
  const highestScore = Math.max(...rankings.map((p) => p.score));
  const avgKD =
    rankings.length > 0
      ? (
          rankings.reduce(
            (sum, p) => sum + p.kills / Math.max(p.deaths, 1),
            0
          ) / rankings.length
        ).toFixed(2)
      : "0.00";

  return (
    <div className="w-64 p-4 rounded-lg" style={glassyCyanStyle}>
      <h3 className="text-xl font-bold text-cyan-300 mb-4 text-center">
        Server Stats
      </h3>

      <div className="space-y-3">
        <StatItem
          label="Total Players"
          value={totalPlayers.toLocaleString()}
          icon="👥"
        />

        <StatItem
          label="Online Now"
          value={onlinePlayers.toLocaleString()}
          icon="🟢"
        />

        <StatItem
          label="Most Kills/Match"
          value={mostKillsPerMatch.toFixed(2)}
          icon="⚔️"
        />

        <StatItem
          label="Highest Score"
          value={highestScore.toLocaleString()}
          icon="🏆"
        />

        <StatItem label="Avg K/D Ratio" value={avgKD} icon="📊" />
      </div>
    </div>
  );
}
