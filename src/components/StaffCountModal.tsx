import React, { useState, useEffect, useCallback } from "react";
import { soundManager } from "../utils/audio";
import { fetchCloudStats, clearAllCloudStats } from "../utils/firebase";
import { X, RefreshCw, Shield, Lock, Clock, CalendarDays, Award, AlertCircle, CheckCircle2, Trash2, Smartphone, Users } from "lucide-react";

interface StaffCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullAdmin?: () => void;
}

interface CountData {
  totalPlays?: number;
  todayPlays?: number;
  totalRedemptions: number;
  todayRedemptions: number;
  lastRedemptionTime: string;
  statsStartTime?: string;
}

export const StaffCountModal: React.FC<StaffCountModalProps> = ({
  isOpen,
  onClose,
  onOpenFullAdmin,
}) => {
  const [password, setPassword] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const [data, setData] = useState<CountData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Reset states when modal is reopened
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setShowClearConfirm(false);
      if (isAuthenticated) {
        fetchCount(password);
      }
    }
  }, [isOpen]);

  const fetchCount = useCallback(async (pwd: string) => {
    setIsLoading(true);
    try {
      // First try backend if available
      const res = await fetch("/api/redemptions/count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: pwd }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
          setIsAuthenticated(true);
          setErrorMsg(null);
          return;
        }
      }
      throw new Error("API not available");
    } catch {
      // Firestore Cloud sync (works across all mobile devices & desktops)
      if (pwd === "5566") {
        try {
          const cloudData = await fetchCloudStats();
          setData(cloudData);
          setIsAuthenticated(true);
          setErrorMsg(null);
        } catch {
          setErrorMsg("無法取得雲端統計資料，請檢查網路。");
        }
      } else {
        setErrorMsg("密碼錯誤，請重新輸入。");
        soundManager.playIncorrect();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClearRecords = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setShowClearConfirm(false);
    try {
      await clearAllCloudStats();
      setData({
        totalPlays: 0,
        todayPlays: 0,
        totalRedemptions: 0,
        todayRedemptions: 0,
        lastRedemptionTime: "尚無紀錄",
        statsStartTime: "剛剛已重置",
      });
      setSuccessMsg("跨裝置紀錄已成功清空重置為 0！");
      soundManager.playCorrect();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      setErrorMsg("清除失敗，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    soundManager.playClick();
    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    await fetchCount(password);
    setIsVerifying(false);
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border-4 border-[#78350F] p-5 space-y-4 relative animate-in zoom-in-95 duration-200 select-none">
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="關閉"
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 border-b border-amber-100 pb-3">
          <div className="p-2 rounded-xl bg-amber-100 text-[#78350F]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="bg-amber-100 text-[#78350F] text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                STAFF ONLY
              </span>
              <h2 className="text-base font-black text-[#78350F]">
                跨裝置即時統計
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5">
              手機/電腦所有裝置 ‧ 遊玩與兌換即時同步
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div
            role="alert"
            className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {!isAuthenticated ? (
          /* Password Authentication View */
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5 pt-1">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center border-2 border-amber-200 text-[#78350F]">
                <Lock className="w-6 h-6" />
              </div>
            </div>

            <div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                autoFocus
                placeholder="請輸入工作人員密碼"
                className="w-full text-center py-2.5 px-3 bg-slate-50 border-2 border-amber-300 focus:border-[#78350F] rounded-xl text-lg font-black tracking-widest font-mono outline-hidden transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying || !password}
              className="w-full py-3 bg-[#78350F] hover:bg-[#5E290C] text-white rounded-xl font-black text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <span>載入雲端統計中...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>進入查閱統計</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* Stats Display View */
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Total Game Plays vs Total Redemptions */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Total plays */}
              <div className="bg-sky-50 rounded-2xl p-3 border-2 border-sky-200 text-center flex flex-col items-center justify-center">
                <span className="text-[11px] font-black text-sky-800 flex items-center gap-1 mb-0.5">
                  <Users className="w-3.5 h-3.5" /> 累計遊玩人次
                </span>
                <div className="text-2xl font-black text-sky-900 font-mono leading-none">
                  {isLoading ? "..." : data?.totalPlays ?? 0}
                </div>
                <span className="text-[10px] text-sky-600 font-bold mt-1">跨裝置遊玩</span>
              </div>

              {/* Total redemptions */}
              <div className="bg-amber-50 rounded-2xl p-3 border-2 border-amber-200 text-center flex flex-col items-center justify-center">
                <span className="text-[11px] font-black text-[#B45309] flex items-center gap-1 mb-0.5">
                  <Award className="w-3.5 h-3.5" /> 累計兌換人次
                </span>
                <div className="text-2xl font-black text-[#DC2626] font-mono leading-none">
                  {isLoading ? "..." : data?.totalRedemptions ?? 0}
                </div>
                <span className="text-[10px] text-slate-500 font-bold mt-1">已領取宣導品</span>
              </div>
            </div>

            {/* Today counts */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 text-center">
                <span className="text-[10px] font-black text-slate-500 block">今日遊玩人次</span>
                <span className="text-lg font-black text-slate-800 font-mono">
                  {isLoading ? "..." : data?.todayPlays ?? 0}
                </span>
              </div>
              <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200 text-center">
                <span className="text-[10px] font-black text-emerald-800 block">今日兌換人次</span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  {isLoading ? "..." : data?.todayRedemptions ?? 0}
                </span>
              </div>
            </div>

            {/* Details list */}
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1.5 text-xs font-bold text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-[#B45309]" />
                  最後兌換時間
                </span>
                <span className="font-mono text-slate-800 font-black text-[11px]">
                  {data?.lastRedemptionTime || "尚無紀錄"}
                </span>
              </div>
              {data?.statsStartTime && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <CalendarDays className="w-3.5 h-3.5 text-[#B45309]" />
                    統計資料來源
                  </span>
                  <span className="font-mono text-emerald-700 font-black text-[10px]">
                    雲端即時同步中
                  </span>
                </div>
              )}
            </div>

            {/* Confirmation Banner for Clear / Refresh */}
            {showClearConfirm ? (
              <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-rose-800 text-xs font-black">
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>確定要清空雲端所有紀錄嗎？</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  清除後所有裝置的累計遊玩與兌換人次將同步歸零。
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClearRecords}
                    disabled={isLoading}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-black text-xs cursor-pointer transition-colors shadow-xs"
                  >
                    {isLoading ? "清除中..." : "確定清除紀錄"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setShowClearConfirm(false);
                      fetchCount(password);
                    }}
                    className="flex-1 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-black text-xs cursor-pointer transition-colors"
                  >
                    僅刷新不清除
                  </button>
                </div>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  fetchCount(password);
                }}
                disabled={isLoading}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>重新整理</span>
              </button>

              {onOpenFullAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playClick();
                    onClose();
                    onOpenFullAdmin();
                  }}
                  className="flex-1 py-2.5 bg-[#78350F] hover:bg-[#5E290C] text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>完整管理後台</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

