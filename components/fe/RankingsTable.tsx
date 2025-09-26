"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchRankings } from "@/lib/evapi";
import type { RankingPlayer } from "@/types/ev";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type SortField = keyof RankingPlayer;
type SortDirection = "asc" | "desc";

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

export default function RankingsTable({ setUsername }) {
  const [rankings, setRankings] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadRankings() {
      setLoading(true);
      const data = await fetchRankings();
      setRankings(data);
      setLoading(false);
    }
    loadRankings();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedRankings = [...rankings].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    const aNum = Number(aValue);
    const bNum = Number(bValue);

    return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
  });

  const visibleRankings = sortedRankings.slice(0, visibleCount);

  const loadMore = useCallback(() => {
    if (loadingMore || visibleCount >= rankings.length) return;

    setLoadingMore(true);
    // Simulate a small delay for better UX
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 50, rankings.length));
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, visibleCount, rankings.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loadingMore &&
          visibleCount < rankings.length
        ) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [loadMore, loadingMore, visibleCount, rankings.length]);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-cyan-300 text-lg">Loading rankings...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="rounded-lg overflow-hidden" style={glassyCyanStyle}>
        <div className="p-4 border-b border-cyan-500/30">
          <h2 className="text-2xl font-bold text-cyan-300 text-center">
            Player Rankings
          </h2>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-cyan-500/30 hover:bg-cyan-500/10">
              <TableHead className="text-cyan-300 font-semibold">
                Rank
              </TableHead>
              <TableHead className="text-cyan-300 font-semibold">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("username")}
                  className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 p-0 h-auto font-semibold"
                >
                  Username {getSortIcon("username")}
                </Button>
              </TableHead>
              <TableHead className="text-cyan-300 font-semibold">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("score")}
                  className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 p-0 h-auto font-semibold"
                >
                  Score {getSortIcon("score")}
                </Button>
              </TableHead>
              <TableHead className="text-cyan-300 font-semibold">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("kills")}
                  className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 p-0 h-auto font-semibold"
                >
                  Kills {getSortIcon("kills")}
                </Button>
              </TableHead>
              <TableHead className="text-cyan-300 font-semibold">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("deaths")}
                  className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 p-0 h-auto font-semibold"
                >
                  Deaths {getSortIcon("deaths")}
                </Button>
              </TableHead>
              <TableHead className="text-cyan-300 font-semibold">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("kpg")}
                  className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 p-0 h-auto font-semibold"
                >
                  KPG {getSortIcon("kpg")}
                </Button>
              </TableHead>
              <TableHead className="text-cyan-300 font-semibold">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("matches")}
                  className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 p-0 h-auto font-semibold"
                >
                  Matches {getSortIcon("matches")}
                </Button>
              </TableHead>
              <TableHead className="text-cyan-300 font-semibold">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("spm")}
                  className="text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 p-0 h-auto font-semibold"
                >
                  SPM {getSortIcon("spm")}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRankings.map((player, index) => (
              <TableRow
                onClick={() => {
                  setUsername(player.username);
                }}
                key={player.username}
                className="border-cyan-500/20 hover:bg-cyan-500/10 transition-colors cursor-pointer"
              >
                <TableCell className="text-cyan-400 font-medium">
                  #{index + 1}
                </TableCell>
                <TableCell className="text-cyan-200 font-medium">
                  {player.username}
                </TableCell>
                <TableCell className="text-cyan-100">
                  {player.score.toLocaleString()}
                </TableCell>
                <TableCell className="text-cyan-100">
                  {player.kills.toLocaleString()}
                </TableCell>
                <TableCell className="text-cyan-100">
                  {player.deaths.toLocaleString()}
                </TableCell>
                <TableCell className="text-cyan-100">
                  {player.kpg.toFixed(2)}
                </TableCell>
                <TableCell className="text-cyan-100">
                  {player.matches}
                </TableCell>
                <TableCell className="text-cyan-100">
                  {player.spm.toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Loading indicator and intersection observer */}
        <div ref={observerRef} className="p-4 text-center">
          {loadingMore && (
            <div className="text-cyan-300 text-sm">Loading more players...</div>
          )}
          {visibleCount >= rankings.length && rankings.length > 0 && (
            <div className="text-cyan-400 text-sm">
              Showing all {rankings.length} players
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
