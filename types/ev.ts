export interface PlayerStats {
  kills: number
  deaths: number
  kdr: string // keep as string since it's often a decimal in API
  total_game: number
  e_balance: number
  weekly_e: number
  rank: string | number
  weekly_cp: number
  cp: number
  account_created?: string
  skin_url: string
}

export interface RankingPlayer {
  deaths: number
  kills: number
  kpg: number
  matches: number
  online: string
  score: number
  spm: number
  username: string
}
