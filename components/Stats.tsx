import { useEffect, useState } from "react";
import Frame from "./fe/statframe";
import SkinViewer from "./skin-viewer";
import { fetchPlayerStats } from "@/lib/evapi";
import { PlayerStats } from "@/types/ev";

export default function Stats({ userData }) {
  const [data, setData] = useState<PlayerStats | null>(null);

  useEffect(() => {
    async function getData() {
      const stats = await fetchPlayerStats(userData);
      setData(stats);
    }
    getData();
  }, [userData]);

  if (!data) {
    return <></>;
  }

  const {
    kills,
    deaths,
    kdr,
    total_game,
    cp,
    weekly_cp,
    rank,
    e_balance,
    account_created,
    skin_url,
  } = data;

  // Kills per game
  const kpg = total_game ? (kills / total_game).toFixed(2) : "0";

  // Account age in days
  let accountAge = 0;
  if (account_created) {
    const createdDate = new Date(account_created);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    accountAge = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="mt-5 flex justify-center items-center gap-10 h-fit">
      {/* Left frames */}
      <div className="flex flex-col gap-9">
        <Frame name="Kills" value={kills} />
        <Frame name="Deaths" value={deaths} />
        <Frame name="KD" value={kdr} />
        <Frame name="Games played" value={total_game} />
        <Frame name="K/G" value={kpg} />
      </div>

      {/* SkinViewer in center */}
      <div className=" flex-shrink-0 w-[520px] h-[493px]">
        <SkinViewer
          skin_type="evskin"
          skin_url={skin_url}
          className="w-full h-full flex items-center justify-center"
        />
      </div>

      {/* Right frames */}
      <div className="flex flex-col gap-9">
        <Frame name="CP" value={cp} />
        <Frame name="CP (Week)" value={weekly_cp} />
        <Frame name="Rank" value={rank} />
        <Frame name="Account age" value={accountAge} />
        <Frame name="e Bal." value={e_balance} />
      </div>
    </div>
  );
}
