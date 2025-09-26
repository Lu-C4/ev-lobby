"use client"

import { useState,useEffect } from "react"
import type { Skin } from "@/types/skin"
import { Input } from "@/components/ui/input"

interface SkinListProps {
  skins: Skin[]
  selectedSkin: Skin | null
  onSelectSkin: (skin: Skin) => void
}

type WeaponCategory = "Auto Rifle" | "Hand Cannon" | "Sword" | "Sweeper" | "Burst Rifle" | "Other" | "Laser Rifle"

export default function SkinList({ skins, selectedSkin, onSelectSkin }: SkinListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<WeaponCategory | null>(null)
  const [activeTab, setActiveTab] = useState<"char" | "weapon">("char")

  const filteredSkins = skins
    .filter((skin) => {
      if (activeTab === "char") return skin.type === "evskin"
      if (activeTab === "weapon") return skin.type === "evobj"
      return true
    })
    .filter((skin) => skin.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((skin) => activeTab === "weapon" && selectedCategory ? skin.kind === selectedCategory : true)

  return (
    <div className="flex flex-col h-full">
      {/* Top controls: search + tab */}
      <div className="bg-black px-2 pt-2 pb-1">
        <Input
          type="text"
          placeholder="Search skins..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />

        {/* Tab buttons */}
        <div className="flex gap-2 justify-center mt-2">
          <button
            onClick={() => setActiveTab("char")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === "char"
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Char Skins
          </button>
          <button
            onClick={() => setActiveTab("weapon")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === "weapon"
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Weapon Skins
          </button>
        </div>
      </div>

      {/* Main scrollable area */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Category buttons only in weapon tab */}
        {activeTab === "weapon" && (
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              "Auto Rifle",
              "Hand Cannon",
              "Sword",
              "Sweeper",
              "Burst Rifle",
              "Laser Rifle",
              "Other"
            ].map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category as WeaponCategory)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white shadow-md scale-105"
                    : "bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Skin list */}
        {filteredSkins.length === 0 ? (
          <p className="text-center text-gray-500">No skins found</p>
        ) : (
          <ul className="space-y-1">
            {filteredSkins.map((skin) => (
              <li
                key={skin.id}
                className={`p-2 rounded cursor-pointer hover:bg-gray-200 transition-colors ${
                  selectedSkin?.id === skin.id ? "bg-gray-300 font-medium" : ""
                }`}
                onClick={() => onSelectSkin(skin)}
              >
                {skin.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
