import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { PiggyMascot } from "./PiggyMascot";
import { soundManager } from "../utils/audio";
import { Trophy, Gift, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { RedemptionRecord } from "../types";
import { StaffCountModal } from "./StaffCountModal";

interface ResultScreenProps {
  correctCount: number;
  totalQuestions?: number;
  totalScore: number;
  onRedeemSuccess: (record: RedemptionRecord) => void;
  onOpenAdmin?: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  correctCount,
  totalQuestions = 4,
  totalScore,
  onRedeemSuccess,
  onOpenAdmin,
}) => {
  const [code, setCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [footerTapCount, setFooterTapCount] = useState<number>(0);
  const [showStaffCount, setShowStaffCount] = useState<boolean>(false);

  // Compute title based on score
  const getPlayerTitle = (score: number): { title: string; desc: string; color: string } => {
    if (score >= 2000) {
      return {
        title: "彰化豚寶彈珠王",
        desc: "兼具租稅智慧與神級彈珠技巧的超級大師！",
        color: "text-[#78350F] bg-[#FEF3C7] border-amber-300",
      };
    } else if (score >= 1200) {
      return {
        title: "租稅彈珠高手",
        desc: "身手矯健！租稅知識熟練、彈珠得分亮眼！",
        color: "text-[#DC2626] bg-[#FDF2F2] border-rose-300",
      };
    } else if (score >= 600) {
      return {
        title: "彰化美食探險家",
        desc: "品嚐彰化美味豚肉、滿載稅務新知！",
        color: "text-[#B45309] bg-amber-50 border-amber-200",
      };
    } else {
      return {
        title: "豚寶見習生",
        desc: "感謝熱情參與！歡迎持續關注彰化豚肉節與租稅好康！",
        color: "text-slate-700 bg-slate-100 border-slate-300",
      };
    }
  };

  const awarded = getPlayerTitle(totalScore);

  // Trigger celebration on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCode(val);
    setErrorMessage(null);
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 4 || isSubmitting) return;

    soundManager.playClick();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          soundManager.playRedeemSuccess();
          onRedeemSuccess({
            serialNumber: data.serialNumber,
            date: data.date,
            time: data.time,
            timestamp: data.timestamp,
          });
          return;
        } else {
          soundManager.playIncorrect();
          setErrorMessage(data.error || "兌換碼不正確，請洽現場工作人員。");
          return;
        }
      }
      // If 404/server not found (e.g. GitHub Pages static hosting), fallback to client-side validation
      throw new Error("Server not available, fallback to client");
    } catch {
      // Client-side fallback for static environments like GitHub Pages
      if (code === "5566") {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hour = String(now.getHours()).padStart(2, "0");
        const minute = String(now.getMinutes()).padStart(2, "0");
        const second = String(now.getSeconds()).padStart(2, "0");

        const dateStr = `${year}/${month}/${day}`;
        const timeStr = `${hour}:${minute}:${second}`;

        let currentCount = 0;
        try {
          const stored = localStorage.getItem("tax_piggy_records");
          const parsed = stored ? JSON.parse(stored) : [];
          currentCount = parsed.length;
          const newRecord = {
            serialNumber: currentCount + 1,
            date: dateStr,
            time: timeStr,
            timestamp: Date.now(),
          };
          parsed.push(newRecord);
          localStorage.setItem("tax_piggy_records", JSON.stringify(parsed));
          currentCount = parsed.length;
        } catch {
          currentCount += 1;
        }

        soundManager.playRedeemSuccess();
        onRedeemSuccess({
          serialNumber: currentCount,
          date: dateStr,
          time: timeStr,
          timestamp: Date.now(),
        });
      } else {
        soundManager.playIncorrect();
        setErrorMessage("工作人員專用密碼不正確。");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFooterTap = () => {
    const next = footerTapCount + 1;
    setFooterTapCount(next);
    if (next >= 3 && onOpenAdmin) {
      setFooterTapCount(0);
      onOpenAdmin();
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full w-full p-4 sm:p-5 text-center select-none bg-[#FDF2F2] overflow-hidden">
      {/* Top Header */}
      <header className="w-full shrink-0">
        <h1 className="text-xl sm:text-2xl font-black text-[#78350F] tracking-tight">
          {awarded.title}
        </h1>
      </header>

      {/* Main Score Centerpiece */}
      <main className="w-full flex-1 flex flex-col items-center justify-center py-1 space-y-2">
        {/* '挑戰完成' (Enlarged 3x) & Big Score Display */}
        <div className="flex flex-col items-center">
          <div className="text-3xl sm:text-4xl font-black text-[#DC2626] tracking-wider mb-0.5 drop-shadow-xs animate-in zoom-in-95 duration-200">
            挑戰完成
          </div>
          <div className="text-4xl sm:text-5xl font-black text-[#78350F] font-mono leading-none tracking-tight">
            {totalScore}
          </div>
          <div className="text-xs text-[#78350F]/80 font-black tracking-wider mt-0.5">
            總積分 ‧ 答對 {correctCount}/{totalQuestions} 題
          </div>
        </div>

        {/* Mascot */}
        <div className="relative my-0.5 shrink-0">
          <PiggyMascot size={75} pose="cheering" />
          <div className="absolute -bottom-1 -right-2 bg-[#DC2626] text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow border border-white">
            {correctCount === totalQuestions ? "滿分通關" : "恭喜通關"}
          </div>
        </div>

        {/* Award Summary Card */}
        <div className={`w-full p-2.5 rounded-xl border-2 text-left ${awarded.color} shrink-0`}>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs font-bold leading-snug">
              {awarded.desc}
            </p>
          </div>
        </div>

        {/* Souvenir Redemption Section */}
        <div className="w-full bg-white p-3 sm:p-3.5 rounded-2xl shadow-lg border-2 border-[#FBCFE8] shrink-0">
          <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#78350F] mb-1.5 uppercase">
            <Gift className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>宣導品兌換（請洽工作人員）</span>
          </div>

          <form onSubmit={handleRedeem} className="space-y-2">
            <div>
              <label htmlFor="redeem-code-input" className="sr-only">
                4位數兌換碼
              </label>
              <input
                id="redeem-code-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={code}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="輸入4位數字"
                autoComplete="off"
                className="w-full text-center py-1.5 px-3 border-2 border-slate-200 rounded-xl text-xl tracking-[0.4em] font-mono font-black focus:outline-none focus:border-[#DC2626] bg-slate-50 focus:bg-white transition-colors"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                id="redeem-error-msg"
                role="alert"
                className="p-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Confirm Redemption Button */}
            <button
              id="confirm-redeem-btn"
              type="submit"
              disabled={code.length !== 4 || isSubmitting}
              className="w-full py-2.5 btn-editorial-red rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>核銷中...</span>
                </>
              ) : (
                <span>確認兌換</span>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer message with STAFF ONLY link */}
      <footer className="w-full flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1.5 border-t border-slate-200/50 shrink-0">
        <span
          onClick={handleFooterTap}
          className="cursor-default select-none text-slate-400 hover:text-slate-500"
        >
          彰化縣地方稅務局 ‧ 租稅宣導活動
        </span>

        {/* STAFF ONLY link (Black text) */}
        <button
          type="button"
          onClick={() => setShowStaffCount(true)}
          title="STAFF ONLY"
          aria-label="STAFF ONLY"
          className="text-black font-black px-2 py-0.5 rounded text-xs tracking-wider transition-colors flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-black" />
          <span>STAFF ONLY</span>
        </button>
      </footer>

      {/* Discreet Staff Count Modal */}
      <StaffCountModal
        isOpen={showStaffCount}
        onClose={() => setShowStaffCount(false)}
        onOpenFullAdmin={onOpenAdmin}
      />
    </div>
  );
};
