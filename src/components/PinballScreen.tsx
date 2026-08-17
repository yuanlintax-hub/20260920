import React from "react";
import { PinballCanvas } from "./PinballCanvas";

interface PinballScreenProps {
  ballNumber: number; // 1 to 4
  totalBalls?: number;
  isGoldBall: boolean;
  totalScoreSoFar: number;
  onBallFinish: (roundScore: number) => void;
}

export const PinballScreen: React.FC<PinballScreenProps> = ({
  ballNumber,
  totalBalls = 4,
  isGoldBall,
  totalScoreSoFar,
  onBallFinish,
}) => {
  return (
    <div className="flex flex-col items-center justify-between h-full w-full p-2 sm:p-3 select-none bg-[#1A1A1A] overflow-hidden">
      {/* Top Banner Header with Score & Ball info */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 bg-black/60 rounded-xl border border-amber-500/30 text-xs font-black mb-1 text-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-300/70 tracking-wider">SCORE</span>
          <span className="text-base text-amber-400 font-mono tracking-wider font-black">
            {totalScoreSoFar.toString().padStart(4, "0")}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 tracking-wider">BALL</span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${isGoldBall ? "bg-amber-400 text-amber-950" : "bg-purple-600 text-white"}`}>
            {ballNumber}/{totalBalls} {isGoldBall ? "★ GOLD x2" : "PURPLE"}
          </span>
        </div>
      </div>

      {/* Pinball Arcade Canvas */}
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
        <PinballCanvas
          isGoldBall={isGoldBall}
          onBallFinish={onBallFinish}
          ballNumber={ballNumber}
          totalBalls={totalBalls}
        />
      </div>
    </div>
  );
};
