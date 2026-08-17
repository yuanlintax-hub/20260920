import React, { useState, useEffect, useCallback } from "react";
import { soundManager } from "../utils/audio";
import { X, RefreshCw, Shield, Lock, Clock, CalendarDays, Award, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";

interface StaffCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullAdmin?: () => void;
}

interface CountData {
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
      const res = await fetch("/api/redemptions/count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: pwd }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
        setIsAuthenticated(true);
        setErrorMsg(null);
      } else {
        setErrorMsg(json.error || "密碼錯誤，請重新輸入。");
        soundManager.playIncorrect();
      }
    } catch {
      setErrorMsg("連線異常，請稍候再試。");
      soundManager.playIncorrect();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleClearRecords = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setShowClearConfirm(false);
    try {
      const res = await fetch("/api/redemptions/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData({
          totalRedemptions: 0,
          todayRedemptions: 0,
          lastRedemptionTime: "尚無紀錄",
          statsStartTime: json.statsStartTime,
        });
        setSuccessMsg("兌換紀錄已成功清空重置為 0 筆！");
        soundManager.playCorrect();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(json.error || "清除失敗，請檢查密碼。");
        soundManager.playIncorrect();
      }
    } catch {
      setErrorMsg("連線異常，無法清除紀錄。");
      soundManager.playIncorrect();
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
                工作人員專屬統計
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5">
              彰化豚肉節 ‧ 兌換件數即時查閱與重整
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
                placeholder="請輸入密碼"
                className="w-full text-center py-2.5 px-3 bg-slate-50 border-2 border-amber-300 focus:border-[#78350F] rounded-xl text-lg font-black tracking-widest font-mono outline-hidden transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying || !password}
              className="w-full py-3 bg-[#78350F] hover:bg-[#5E290C] text-white rounded-xl font-black text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <span>驗證中...</span>
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
            {/* Big Count Number Display */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total count */}
              <div className="bg-amber-50 rounded-2xl p-3.5 border-2 border-amber-200 text-center flex flex-col items-center justify-center">
                <span className="text-[11px] font-black text-[#B45309] mb-0.5">
                  累計已兌換
                </span>
                <div className="text-3xl font-black text-[#DC2626] font-mono leading-none">
                  {isLoading ? "..." : data?.totalRedemptions ?? 0}
                </div>
                <span className="text-[10px] text-slate-500 font-bold mt-1">件宣導品</span>
              </div>

              {/* Today count */}
              <div className="bg-emerald-50 rounded-2xl p-3.5 border-2 border-emerald-200 text-center flex flex-col items-center justify-center">
                <span className="text-[11px] font-black text-emerald-800 mb-0.5">
                  今日已兌換
                </span>
                <div className="text-3xl font-black text-emerald-700 font-mono leading-none">
                  {isLoading ? "..." : data?.todayRedemptions ?? 0}
                </div>
                <span className="text-[10px] text-slate-500 font-bold mt-1">件宣導品</span>
              </div>
            </div>

            {/* Details list */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2 text-xs font-bold text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-[#B45309]" />
                  最後兌換時間
                </span>
                <span className="font-mono text-slate-800 font-black text-[11px]">
                  {data?.lastRedemptionTime || "尚無紀錄"}
                </span>
              </div>
              {data?.statsStartTime && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-slate-500">
                    <CalendarDays className="w-3.5 h-3.5 text-[#B45309]" />
                    統計起始時間
                  </span>
                  <span className="font-mono text-slate-800 font-black text-[11px]">
                    {data.statsStartTime}
                  </span>
                </div>
              )}
            </div>

            {/* Confirmation Banner for Clear / Refresh */}
            {showClearConfirm ? (
              <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-rose-800 text-xs font-black">
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>確定要清除所有兌換紀錄嗎？</span>
                </div>
                <p className="text-[11px] text-rose-700">
                  清除後累計與今日兌換件數將歸零重新計算。
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
                  setShowClearConfirm(true);
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
