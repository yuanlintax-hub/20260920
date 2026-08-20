import React, { useState } from "react";
import { PiggyMascot } from "./PiggyMascot";
import { soundManager } from "../utils/audio";
import { Volume2, VolumeX, ShieldCheck, Play, Sparkles, Award } from "lucide-react";
import { StaffCountModal } from "./StaffCountModal";

interface HomeScreenProps {
  onStart: () => void;
  onOpenAdmin: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStart,
  onOpenAdmin,
  isMuted,
  onToggleMute,
}) => {
  const [showStaffCount, setShowStaffCount] = useState<boolean>(false);

  const handleStart = () => {
    soundManager.playClick();
    onStart();
  };

  const handleMuteClick = () => {
    onToggleMute();
    soundManager.playClick();
  };

  return (
    <div className="flex flex-col items-center justify-between h-full w-full p-3.5 sm:p-5 text-center select-none bg-white overflow-hidden">
      {/* Top Bar with Audio Control */}
      <header className="w-full flex items-center justify-start shrink-0">
        <button
          id="sound-toggle-btn"
          onClick={handleMuteClick}
          aria-label={isMuted ? "開啟音效" : "靜音"}
          className="p-1.5 sm:p-2 rounded-xl bg-amber-50 text-[#78350F] border border-amber-200 hover:bg-amber-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </header>

      {/* Hero Banner Section */}
      <main className="w-full flex-1 flex flex-col items-center justify-center my-auto py-1">
        {/* Editorial Subheader */}
        <div className="text-[#DC2626] text-[11px] font-black tracking-widest uppercase">
          Changhua Pork Festival
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-4xl font-black text-[#78350F] leading-tight mb-0.5 tracking-tight">
          豬事大吉！
        </h1>
        <h2 className="text-lg sm:text-xl font-black text-[#DC2626] leading-tight mb-2">
          彰化豚肉節 租稅彈珠挑戰賽
        </h2>

        {/* Mascot Center Stage */}
        <div className="relative mb-2 shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#FBCFE8] rounded-full border-3 border-white shadow-inner flex items-center justify-center relative">
            <PiggyMascot size={80} pose="happy" className="hover:scale-105 transition-transform" />
            <div className="absolute -bottom-1.5 bg-[#DC2626] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-md border border-white">
              豚寶 Chef
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-xs sm:text-sm font-black text-[#78350F] mb-2">
          答租稅題、拿彈珠，挑戰最高分！
        </p>

        {/* Short Rules Card with STAFF ONLY in the corner */}
        <div className="w-full bg-[#FFFBEB] rounded-xl p-2.5 sm:p-3 border-2 border-amber-200 text-left mb-3 space-y-1.5 shrink-0 relative">
          <div className="flex items-center justify-between border-b border-amber-200/70 pb-1">
            <h3 className="text-[11px] font-black text-[#78350F] flex items-center gap-1.5 uppercase tracking-wide">
              <Award className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>玩法說明：</span>
            </h3>

            {/* STAFF ONLY button positioned neatly in the corner */}
            <button
              type="button"
              onClick={() => {
                soundManager.playClick();
                setShowStaffCount(true);
              }}
              title="工作人員專區"
              aria-label="STAFF ONLY"
              className="text-black font-black px-1.5 py-0.5 rounded text-[10px] tracking-wider transition-colors flex items-center gap-1 cursor-pointer bg-amber-100 hover:bg-amber-200 border border-amber-300"
            >
              <ShieldCheck className="w-3 h-3 text-black" />
              <span>STAFF ONLY</span>
            </button>
          </div>

          <ul className="space-y-1 text-xs text-slate-700 font-medium">
            <li className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white font-black flex items-center justify-center shrink-0 text-[9px]">
                1
              </span>
              <span>隨機回答 <strong>4 題</strong> 租稅問題</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white font-black flex items-center justify-center shrink-0 text-[9px]">
                2
              </span>
              <span>每題完成獲得 <strong>1 顆</strong> 紫色彈珠（共 4 顆）</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#B45309] text-white font-black flex items-center justify-center shrink-0 text-[9px]">
                3
              </span>
              <span className="flex items-center gap-1">
                <span>答對升級</span>
                <strong className="text-[#78350F] bg-amber-200 px-1 py-0.2 rounded border border-amber-300 inline-flex items-center gap-0.5 text-[10px]">
                  <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                  紫金彈珠
                </strong>
                <span>，得分 2 倍！</span>
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white font-black flex items-center justify-center shrink-0 text-[9px]">
                4
              </span>
              <span>按住拉桿或彈珠蓄力，放開手指即發射！</span>
            </li>
          </ul>
        </div>

        {/* Start Button with 3D Editorial Push */}
        <button
          id="start-challenge-btn"
          onClick={handleStart}
          className="w-full py-3 px-6 btn-editorial-red rounded-2xl text-lg font-black flex items-center justify-center gap-2 cursor-pointer focus:outline-none shrink-0"
        >
          <Play className="w-4 h-4 fill-white text-white" />
          <span>開始挑戰</span>
        </button>
      </main>

      {/* Footer message */}
      <footer className="w-full flex items-center justify-center text-[11px] text-slate-400 font-medium pt-1.5 border-t border-slate-200/50 shrink-0">
        <span>彰化縣地方稅務局 關心您</span>
      </footer>

      {/* Staff Count & Full Admin Modal */}
      <StaffCountModal
        isOpen={showStaffCount}
        onClose={() => setShowStaffCount(false)}
        onOpenFullAdmin={onOpenAdmin}
      />
    </div>
  );
};
