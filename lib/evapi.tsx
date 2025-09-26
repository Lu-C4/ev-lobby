interface SkinResponse {
  field_skin: { url: string }[]
}

import type { PlayerStats, RankingPlayer } from "@/types/ev"
interface FieldValue {
  value: string | number
}

interface PlayerData {
  [key: string]: FieldValue[] | undefined
}
import axios from "axios"
import * as cheerio from "cheerio"

// Use shared RankingPlayer type from types/ev

export async function getClanThumbnailByPlayerUid(userId) {
  try {
    const userResponse = await axios.get(`https://ev.io/user/${userId}`, {
      timeout: 30000,
    })
    const userHtml = userResponse.data

    const $ = cheerio.load(userHtml)
    const clanThumbnailElement = $(`#block-views-block-clans-block-4 img.img-responsive`)
    const linkElement = $(`#block-views-block-clans-block-4 a`)

    // Check if the element exists
    let linkText: string
    if (linkElement.length > 0) {
      // Get the text content of the link
      linkText = linkElement.text().trim()
    } else {
      linkText = ""
    }
    let clanThumbnail
    if (clanThumbnailElement.length > 0) {
      clanThumbnail = `https://www.ev.io${clanThumbnailElement.attr("src")}`
    } else {
      clanThumbnail = ""
    }

    return [clanThumbnail, linkText]
  } catch (error) {
    console.error("An error occurred:", error)
    return null
  }
}

export async function fetchUserData(username: string): Promise<PlayerData> {
  const res = await fetch(`https://ev.io/stats-by-un/${encodeURIComponent(username)}`)

  if (!res.ok) {
    console.log("Error player not found")

    throw new Error(`HTTP error! Status: ${res.status}`)
  }

  const jsonData = await res.json()

  if (!jsonData.length) {
    console.log("Failed")
  }

  return jsonData[0] as PlayerData
}

export async function fetchSurvivalScore(data: PlayerData): Promise<string | number | null> {
  try {
    return data.field_survival_high_scores?.[0]?.value ?? null
  } catch (error) {
    console.error("Error fetching survival score:", error)
    return null
  }
}

export async function getSkinurl(url: string): Promise<string | undefined> {
  const res = await fetch(`https://ev.io${url}?_format=json`)

  if (!res.ok) {
    throw new Error(`HTTP error! Status: ${res.status}`)
  }

  const jsondata: SkinResponse = await res.json()
  return jsondata.field_skin?.[0]?.url
}

export async function fetchPlayerStats(data: PlayerData): Promise<PlayerStats> {
  // const data = await fetchUserData(username);
  console.log(data)

  return {
    kills: Number(data["field_kills"]?.[0]?.value ?? 0),
    deaths: Number(data["field_deaths"]?.[0]?.value ?? 0),
    kdr: String(data["field_k_d"]?.[0]?.value ?? "0.00"),
    total_game: Number(data["field_total_games"]?.[0]?.value ?? 0),
    e_balance: Number(data["field_ev_coins"]?.[0]?.value ?? 0),
    weekly_e: Number(data["field_ev_coins_this_week"]?.[0]?.value ?? 0),
    rank: data["field_rank"]?.[0]?.value ?? "N/A",
    weekly_cp: Number(data["field_cp_earned_weekly"]?.[0]?.value ?? 0),
    cp: Number(data["field_lifetime_cp_earned"]?.[0]?.value ?? 0),
    account_created: String(data["created"]?.[0]?.value ?? ""),
    skin_url: await getSkinurl(data["field_eq_skin"]?.[0]?.["url"]),
  }
}

export async function fetchRankings(): Promise<RankingPlayer[]> {
  try {
    const res = await fetch("/api/rankings")

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`)
    }

    const data = await res.json()
    return data as RankingPlayer[]
  } catch (error) {
    console.error("Error fetching rankings:", error)
    return []
  }
}
