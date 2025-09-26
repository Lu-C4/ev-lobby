"use client"

import { useState, useEffect } from "react"
import type { RankingPlayer } from "@/types/ev"
import { fetchRankings } from "@/lib/evapi"

const glassyCyanStyle = {
  background: "rgba(15, 23, 42, 0.85)",
  border: "1px solid rgba(6, 182, 212, 0.5)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: `
    0 0 35px rgba(6, 182, 212, 0.8),
    inset 0 0 15px rgba(6, 182, 212, 0.5)
  `,
  color: "rgba(132, 211, 255, 0.85)",
  transition: "all 0.3s ease",
  borderRadius: "6px",
}

function NavbarLeft() {
  const [stats, setStats] = useState({ totalPlayers: 0, onlineNow: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const rankings: RankingPlayer[] = await fetchRankings()
        const onlineCount = rankings.filter((player) =>
          typeof player.online === "string" && player.online.toLowerCase() === "online"
        ).length
        setStats({
          totalPlayers: rankings.length,
          onlineNow: onlineCount,
        })
      } catch (error) {
        console.error("Failed to load stats:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div
      className="flex items-center w-1/5 gap-3 text-cyan-300 px-4 py-2"
      style={{
        ...glassyCyanStyle,
        clipPath: "polygon(0 0, calc(100% - 40px) 0, 100% 100%, 0% 100%)",
      }}
    >
      <div className="flex flex-col items-start text-cyan-200">
        <span className="font-bold text-sm leading-none">{loading ? "..." : stats.totalPlayers.toLocaleString()}</span>
        <span className="text-xs text-cyan-400 mt-0.5">Total Players</span>
      </div>
      <div className="w-px h-6 bg-cyan-500/30 mx-1" />
      <div className="flex flex-col items-start text-cyan-200">
        <span className="font-bold text-sm leading-none text-green-400">
          {loading ? "..." : stats.onlineNow.toLocaleString()}
        </span>
        <span className="text-xs text-cyan-400 mt-0.5">Online Now</span>
      </div>
    </div>
  )
}

function NavbarRight() {
  const [stats, setStats] = useState({ maxKills: 0, avgKD: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const rankings: RankingPlayer[] = await fetchRankings()
        const maxKills = Math.max(...rankings.map((p) => p.kpg))
        const totalKD = rankings.reduce((sum, p) => sum + p.kills / Math.max(p.deaths, 1), 0)
        const avgKD = totalKD / rankings.length

        setStats({
          maxKills: maxKills,
          avgKD: avgKD,
        })
      } catch (error) {
        console.error("Failed to load stats:", error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  return (
    <div
      className="flex items-center w-1/5 gap-3 text-cyan-300 px-4 py-2"
      style={{
        ...glassyCyanStyle,
        clipPath: "polygon(0 0, calc(100% - 40px) 0, 100% 100%, 0% 100%)",
        transform: "scaleX(-1)",
      }}
    >
      <div className="flex flex-col items-end text-cyan-200" style={{ transform: "scaleX(-1)" }}>
        <span className="font-bold text-sm leading-none text-orange-400">
          {loading ? "..." : stats.maxKills.toFixed(1)}
        </span>
        <span className="text-xs text-cyan-400 mt-0.5">Max KPG</span>
      </div>
      <div className="w-px h-6 bg-cyan-500/30 mx-1" />
      <div className="flex flex-col items-end text-cyan-200" style={{ transform: "scaleX(-1)" }}>
        <span className="font-bold text-sm leading-none text-purple-400">
          {loading ? "..." : stats.avgKD.toFixed(2)}
        </span>
        <span className="text-xs text-cyan-400 mt-0.5">Avg K/D</span>
      </div>
    </div>
  )
}

function NavbarCenter() {
  return (
    <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-1/2">
      <div className="relative">
        <div
          className="relative flex items-center justify-center"
          style={{
            ...glassyCyanStyle,
            clipPath: "polygon(0% 0%, 100% 0%, 92% 100%, 8% 100%)",
            padding: "12px 40px 16px 40px",
            minWidth: "300px",
            maxWidth: "550px",
            width: "min(550px, 90vw)",
            height: "60px",
          }}
        >
          <img
            src="https://ev.io/dist/1-7-0/public/img/logos/loading_v1_1.png"
            alt="Logo"
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function SimpleNavbar() {
  return (
    <header className="w-full relative">
      <div className="flex items-center justify-between relative">
        <NavbarLeft />
        <NavbarCenter />
        <NavbarRight />
      </div>
    </header>
  )
}
