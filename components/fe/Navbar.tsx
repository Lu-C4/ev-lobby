"use client";

import { useEffect, useState } from "react";

const glassyCyanStyle = {
  background: "rgba(15, 23, 42, 0.85)", // translucent dark slate bg
  border: "1px solid rgba(6, 182, 212, 0.5)", // cyan border
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow: `
    0 0 35px rgba(6, 182, 212, 0.8),
    inset 0 0 15px rgba(6, 182, 212, 0.5)
  `,
  color: "rgba(132, 211, 255, 0.85)",
  transition: "all 0.3s ease",
  borderRadius: "6px",
};

function NavbarLeft({ username, userData }) {
  const [image, setImage] = useState(null);
  const [userId, setUserId] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (!userData) return;

    setImage(null);
    setImageLoading(true);

    async function fetchImage() {
      try {
        const url = userData["field_eq_skin"][0]["url"];
        const image = await (
          await fetch(`https://ev.io${url}?_format=json`)
        ).json();
        const image_url = image["field_profile_thumb"][0]["url"];
        setImage(image_url);
      } catch (error) {
        console.error("Failed to load profile image:", error);
        setImage("Akuma.png"); // fallback
      } finally {
        setImageLoading(false);
      }
    }
    fetchImage();
    setUserId(userData["uid"][0]["value"]);
  }, [userData]);

  return (
    <div
      className="flex items-center w-1/5 gap-3 text-cyan-300 px-4 py-2"
      style={{
        ...glassyCyanStyle,
        clipPath: "polygon(0 0, calc(100% - 40px) 0, 100% 100%, 0% 100%)",
      }}
    >
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center"
        style={{ ...glassyCyanStyle, transform: "scaleX(-1)" }}
      >
        {imageLoading ? (
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <img src={image ? image : "Akuma.png"} alt="Profile" />
        )}
      </div>

      <div className="flex flex-col items-start text-cyan-200">
        <span className="font-bold text-sm leading-none">{username}</span>
        <span className="font-bold text-sm leading-none text-cyan-400 mt-0.5">
          {userId}
        </span>
      </div>
    </div>
  );
}

function NavbarRight({ userData }) {
  const [image_url, setImageUrl] = useState(null);
  const [clanName, setClanName] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (!userData || !userData["uid"] || userData["uid"].length === 0) {
      return;
    }

    setImageUrl(null);
    setClanName(null);
    setImageLoading(true);

    const uid = userData["uid"][0]["value"];
    let isMounted = true;

    async function fetchClanData() {
      try {
        const response = await fetch(`/api/clanthumb?uid=${uid}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const clanData = await response.json();
        const imageUrl = clanData["url"];
        const clanName = clanData["name"];

        if (isMounted) {
          setImageUrl(imageUrl);
          setClanName(clanName);
        }
      } catch (error) {
        console.error("Failed to fetch image:", error);
        if (isMounted) {
          setImageUrl(null);
        }
      } finally {
        if (isMounted) {
          setImageLoading(false);
        }
      }
    }

    fetchClanData();

    return () => {
      isMounted = false;
    };
  }, [userData]);

  return (
    <div
      className="flex items-center w-1/5 gap-3 text-cyan-300 px-4 py-2"
      style={{
        ...glassyCyanStyle,
        clipPath: "polygon(0 0, calc(100% - 40px) 0, 100% 100%, 0% 100%)",
        transform: "scaleX(-1)",
      }}
    >
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center"
        style={{ transform: "scaleX(-1)" }}
      >
        {imageLoading ? (
          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <img src={image_url || "/placeholder.svg"} alt="Clan Avatar" />
        )}
      </div>
      <div
        className="flex flex-col items-end text-cyan-200"
        style={{ transform: "scaleX(-1)" }}
      >
        <span className="font-bold text-sm leading-none">{clanName}</span>
        <span className="text-xs text-cyan-400 mt-0.5">Lieutenant</span>
      </div>
    </div>
  );
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
            padding: "12px 70px 16px 70px",
            width: "550px",
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
  );
}

export default function EvioNavbar({ username, userData }) {
  return (
    <header className="w-full relative">
      <div className="flex items-center justify-between relative ">
        <NavbarLeft username={username} userData={userData} />
        <NavbarCenter />
        <NavbarRight userData={userData} />
      </div>
    </header>
  );
}
