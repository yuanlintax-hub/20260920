import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { PiggyMascot } from "./PiggyMascot";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { RedemptionRecord } from "../types";
import { StaffCountModal } from "./StaffCountModal";

interface SuccessScreenProps {
  record: RedemptionRecord;
  onOpenAdmin?: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ onOpenAdmin }) => {
  const [showStaffCount, setShowStaffCount] = useState<boolean>(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {}
  }, []);

  return (
    <div
      id="redemption-success-view"
      className="flex flex-col items-center justify-between h-full w-full p-4 sm:p-6 text-center select-none bg-white overflow-hidden"
    >
      {/* Spacer / Top Balance */}
      <div className="w-full h-2 shrink-0" />

      {/* Center Main Content: Piggy Mascot (Enlarged 1x) + 已兌換 */}
      <main className="w-full flex-1 flex flex-col items-center justify-center space-y-4 py-2">
        {/* 豚寶 Mascot (Enlarged by 1x to size 150) */}
        <div className="shrink-0 animate-in zoom-in-95 duration-300">
          <PiggyMascot size={150} pose="gold" />
        </div>

        {/* 已兌換 Display */}
        <div
          id="redemption-status-display"
          className="w-full max-w-[280px] bg-emerald-50 text-emerald-800 font-black text-3xl sm:text-4xl py-3 px-6 rounded-2xl border-3 border-emerald-500 shadow-md flex items-center justify-center gap-3 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-600 shrink-0" />
          <span>已兌換</span>
        </div>

        {/* Tax reminder */}
        <div className="w-full max-w-[340px] p-3.5 sm:p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-left space-y-1 shrink-0 shadow-xs">
          <p className="font-black flex items-center gap-1.5 text-[#B45309] text-base sm:text-lg">
            💡 租稅宣導小叮嚀：
          </p>
          <p className="leading-snug text-[#78350F] text-base sm:text-lg font-black">
            發票存載具，自動對獎省時間。設定領獎帳戶，發票獎金不錯過。
          </p>
        </div>
      </main>

      {/* Footer with STAFF ONLY link (Black text) */}
      <footer className="w-full flex items-center justify-end text-xs pt-1 shrink-0">
        <button
          type="button"
          onClick={() => setShowStaffCount(true)}
          title="STAFF ONLY"
          aria-label="STAFF ONLY"
          className="text-black font-black px-2 py-0.5 rounded text-xs tracking-wider transition-colors flex items-center gap-1 cursor-pointer hover:opacity-80"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-black" />
          <span>STAFF ONLY</span>
        </button>
      </footer>

      {/* Staff Count Modal */}
      <StaffCountModal
        isOpen={showStaffCount}
        onClose={() => setShowStaffCount(false)}
        onOpenFullAdmin={onOpenAdmin}
      />
    </div>
  );
};
