"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import UsernameInput from "@/components/fe/SearchBar";
import SurvialStats from "@/components/fe/Survival";
import Navbar from "@/components/fe/Navbar";
import SimpleNavbar from "@/components/fe/SimpleNavbar";
import { EquippedSkins } from "@/components/EqSkins";
import SmallTabNavbar from "@/components/fe/TabNavbar";
import BgAurora from "./bg";
import Stats from "@/components/Stats";
import Armory from "@/components/Armory";
import Loader from "@/components/Loader";
import RankingsTable from "@/components/fe/RankingsTable";
import { fetchUserData } from "@/lib/evapi";

export default function Home() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState("Stats");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const usernameParam = searchParams.get("username");
    if (usernameParam) {
      setUsername(usernameParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!username.trim()) {
      setUserData(null);
      setLoading(false);
      return;
    }

    async function GetUserData() {
      setLoading(true);
      try {
        const userdata = await fetchUserData(username);
        setUserData(userdata);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserData(null);
      }
      setLoading(false);
    }
    GetUserData();
  }, [username]);

  const goBackToRankings = () => {
    setUsername("");
    setUserData(null);
    setActiveTab("Stats");
    window.history.pushState({}, "", window.location.pathname);
  };

  function content() {
    console.log("Loading content");

    if (!username.trim()) {
      return (
        <div className="flex justify-center items-start min-h-screen pt-6">
          <div className="flex-1 max-w-6xl">
            <RankingsTable setUsername={setUsername} />
          </div>
        </div>
      );
    }

    if (loading) {
      return <Loader />;
    }
    if (!userData) {
      return (
        <div className="text-cyan-300 text-center p-8">
          Error fetching user data. Please check the username and try again.
        </div>
      );
    }
    switch (activeTab) {
      case "Stats":
        return <Stats userData={userData} />;
      case "Survival durations":
        return <SurvialStats userData={userData} caption="" />;
      case "Armory":
        return <Armory userData={userData} />;
      case "Equipped Skins":
        return <EquippedSkins userData={userData} />;
      default:
        return null;
    }
  }

  return (
    <div>
      <BgAurora />
      <div style={{ width: "100%", height: "600px", position: "absolute" }} />
      <div className="max-h-fit">
        {username.trim() ? (
          <Navbar username={username} userData={userData} />
        ) : (
          <SimpleNavbar />
        )}

        <div className="mt-4 ml-4 relative">
          <div className="absolute top-1 left-0 z-50 bg-transparent flex items-center justify-start gap-2 flex-col ">
            <UsernameInput
              value={username}
              onChange={setUsername}
              className="w-64" // fixed width
            />
            {username.trim() && (
              <button
                onClick={goBackToRankings}
                className="px-4 py-2 rounded-lg text-cyan-300 border border-cyan-300/30 bg-slate-900/50 backdrop-blur-sm hover:bg-cyan-300/10 transition-all duration-200 text-sm font-medium"
                title="Back to Rankings"
              >
                ← Rankings
              </button>
            )}
          </div>

          {username.trim() && (
            <SmallTabNavbar setActiveTab={setActiveTab} activeTab={activeTab} />
          )}
        </div>

        {content()}
      </div>
    </div>
  );
}
