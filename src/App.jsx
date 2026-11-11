import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Lock, Smartphone, RefreshCw, Volume2, ShieldCheck, Phone, MessageSquare, Send, XCircle } from 'lucide-react';

export default function App() {
  // 狀態設定
  const [transferAmount, setTransferAmount] = useState(600000);
  const [threshold, setThreshold] = useState(500000);
  const [isIntercepted, setIsIntercepted] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [isAlertPlaying, setIsAlertPlaying] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isTimeoutCancelled, setIsTimeoutCancelled] = useState(false);

  // 家屬緊急聯絡資訊 (模擬資料)
  const familyContact = {
    name: "張小明 (長子)",
    phone: "0912345678",
    lineId: "family_guard_line"
  };

  // Web Audio API 警報聲生成器
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);

  // 解鎖平板/手機音效播放權限
  const handleUnlockAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setIsAudioUnlocked(true);
  };

  // 播放/停止蜂鳴警報
  const triggerAlarm = (start) => {
    if (!start) {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
        oscRef.current = null;
      }
      setIsAlertPlaying(false);
      return;
    }

    if (!audioCtxRef.current) handleUnlockAudio();

    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      setIsAlertPlaying(true);
    } catch (e) {
      console.log("Audio play error:", e);
    }
  };

  // 倒數計時與逾時未回應處理
  useEffect(() => {
    let timer;
    if (isIntercepted && countdown > 0 && !isApproved && !isTimeoutCancelled) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isIntercepted && !isApproved) {
      triggerAlarm(false);
      setIsTimeoutCancelled(true);
    }
    return () => clearInterval(timer);
  }, [isIntercepted, countdown, isApproved, isTimeoutCancelled]);

  // 執行模擬轉帳
  const handleTransfer = () => {
    if (!isAudioUnlocked) handleUnlockAudio();

    if (transferAmount >= threshold) {
      setIsIntercepted(true);
      setCountdown(30);
      setIsApproved(false);
      setIsTimeoutCancelled(false);
      triggerAlarm(true);
      if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 1000]);
      }
    } else {
      alert(`✅ 轉帳成功！金額：NT$ ${transferAmount.toLocaleString()}（未達防詐攔截門檻）`);
    }
  };

  // 重設測試
  const handleReset = () => {
    triggerAlarm(false);
    setIsIntercepted(false);
    setIsApproved(false);
    setIsTimeoutCancelled(false);
    setCountdown(30);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden font-sans">
      
      {/* 📱 1. 行動裝置解鎖音效提示蓋板 */}
      {!isAudioUnlocked && (
        <div 
          onClick={handleUnlockAudio}
          className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center cursor-pointer border-4 border-indigo-500/50"
        >
          <div className="bg-indigo-600/20 p-6 rounded-full animate-bounce mb-6">
            <Volume2 className="w-16 h-16 text-indigo-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">點擊螢幕任意處以開始 Demo</h2>
          <p className="text-slate-300 text-lg md:text-xl max-w-lg mb-8">
            為突破平板/手機瀏覽器音效限制，請點擊一次螢幕授權「地震級防詐警報音效」與互動體驗。
          </p>
          <span className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xl font-bold rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
            開啟 Demo 模式
          </span>
          <p className="text-xs md:text-sm text-slate-400/90 font-normal tracking-wide">
            💡 評審體驗提示：請先輕點一次畫面授權音效存取權限，以獲得最佳爆閃警報與聲音效果
          </p>
        </div>
      )}

      {/* HEADER */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/30 rounded-2xl border border-indigo-500/40">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white">家庭防詐即時風控模擬器</h1>
            <p className="text-xs md:text-sm text-slate-400">Family Transfer Anti-Fraud Guard • 雙端協同展示版</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" /> 重置展示
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 my-auto py-6">
        
        {/* 左欄：長輩轉帳模擬卡片 */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="flex items-center gap-2 text-indigo-400 text-sm font-semibold bg-indigo-950/60 px-3 py-1.5 rounded-full border border-indigo-800/50">
                <Smartphone className="w-4 h-4" /> 長輩網銀轉帳端
              </span>
              <span className="text-xs text-slate-500">Demo Mode</span>
            </div>

            <div className="mb-6">
              <label className="block text-slate-400 text-sm mb-2">輸入轉帳金額 (NT$)</label>
              <input
                type="number"
                disabled={isIntercepted}
                value={transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3.5 text-2xl font-mono text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {[100000, 600000, 1200000].map((amt) => (
                <button
                  key={amt}
                  disabled={isIntercepted}
                  onClick={() => setTransferAmount(amt)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono border transition ${
                    transferAmount === amt
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 disabled:opacity-50'
                  }`}
                >
                  NT$ {(amt / 10000).toFixed(0)} 萬
                </button>
              ))}
            </div>
          </div>

          {isIntercepted ? (
            <div className="bg-indigo-950/80 border border-indigo-500/50 rounded-2xl p-5 space-y-3 animate-pulse">
              {isApproved ? (
                <div className="text-emerald-400 font-bold flex items-center gap-2 text-base">
                  <CheckCircle className="w-5 h-5 shrink-0" /> 家屬已授權放行，轉帳處理中...
                </div>
              ) : isTimeoutCancelled ? (
                <div className="text-slate-300 font-bold flex items-center gap-2 text-base">
                  <XCircle className="w-5 h-5 text-amber-400 shrink-0" /> 逾時未回應，已自動安全取消該筆交易
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-amber-400 font-bold text-base">
                    <ShieldAlert className="w-6 h-6 animate-spin shrink-0" />
                    已觸發風控託管，正在通知緊急聯絡人...
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    已自動同步推播至預設聯絡人：<span className="text-white font-bold">{familyContact.name}</span>。倒數結束前家屬未授權，將自動安全阻斷交易。
                  </p>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={handleTransfer}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition"
            >
              發送轉帳請求
            </button>
          )}
        </div>

        {/* 右欄：家屬風控設定卡片 */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="flex items-center gap-2 text-emerald-400 text-sm font-semibold bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800/50">
                <Lock className="w-4 h-4" /> 家屬聯防門檻與快捷聯絡
              </span>
              <span className="text-xs text-emerald-400/80 font-mono">系統防護中</span>
            </div>

            {/* 平時顯示之家屬聯絡資訊 */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 mb-6">
              <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
                <span>設定指定緊急關懷家屬：</span>
                <span className="text-emerald-400 font-bold">{familyContact.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={`tel:${familyContact.phone}`}
                  className="flex items-center justify-center gap-1.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition"
                >
                  <Phone className="w-3.5 h-3.5" /> 電話直連
                </a>
                <a
                  href={`sms:${familyContact.phone}?body=【防詐警報】發起轉帳測試確認`}
                  className="flex items-center justify-center gap-1.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> 發送簡訊
                </a>
                <a
                  href={`https://line.me/R/ti/p/~${familyContact.lineId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30 rounded-xl text-xs font-bold transition"
                >
                  <Send className="w-3.5 h-3.5" /> LINE 通知
                </a>
              </div>
            </div>

            {/* 門檻設定 */}
            <div className="mb-6">
              <label className="block text-slate-400 text-sm mb-2">單筆攔截約定金額 (NT$)</label>
              <div className="relative mb-4">
                <input
                  type="number"
                  step="10000"
                  min="10000"
                  max="5000000"
                  value={threshold}
                  onChange={(e) => setThreshold(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-emerald-500/40 rounded-2xl px-4 py-3 text-xl font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-400 transition"
                  placeholder="請輸入門檻金額"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                  自訂門檻
                </span>
              </div>

              <input
                type="range"
                min={100000}
                max={2000000}
                step={50000}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>音效權限狀態：</span>
            <span className={`font-bold ${isAudioUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isAudioUnlocked ? '● 警報已授權 (Audio Active)' : '○ 點擊螢幕進行授權'}
            </span>
          </div>

          {/* 🚨 右欄預警爆閃彈窗 (含【預警狀態下】快捷聯絡快捷鍵) */}
          {isIntercepted && (
            <div className={`absolute inset-0 z-30 p-6 flex flex-col justify-between text-center ${
              isApproved 
                ? 'bg-slate-900/95' 
                : isTimeoutCancelled 
                ? 'bg-slate-900/95'
                : 'bg-red-950/95 animate-pulse border-4 border-red-600'
            }`}>
              {!isApproved && !isTimeoutCancelled ? (
                <div className="my-auto space-y-3">
                  <div className="inline-flex p-2.5 bg-red-600/20 rounded-full text-red-500 animate-bounce">
                    <ShieldAlert className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-red-500">高風險異常轉帳觸發！</h3>
                    <p className="text-xs text-slate-300">
                      長輩請求轉帳 <span className="text-amber-400 font-bold">NT$ {transferAmount.toLocaleString()}</span>
                    </p>
                  </div>

                  {/* 託管倒數區 */}
                  <div className="bg-slate-950/90 border border-red-500/40 rounded-xl p-3">
                    <div className="text-[11px] text-slate-400">家屬託管倒數中</div>
                    <div className="text-3xl font-mono font-extrabold text-amber-400 my-0.5">
                      00:{countdown < 10 ? `0${countdown}` : countdown}
                    </div>
                    <div className="text-[10px] text-slate-400">倒數結束將自動阻斷交易</div>
                  </div>

                  {/* 💡 預警狀態專屬：家屬即時快捷聯絡按鈕組 */}
                  <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5">
                    <div className="text-[11px] text-slate-300 mb-2 font-medium flex items-center justify-center gap-1">
                      <span>📞 快捷聯絡長輩/緊急聯絡人：</span>
                      <span className="text-emerald-400 font-bold">{familyContact.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <a
                        href={`tel:${familyContact.phone}`}
                        className="flex items-center justify-center gap-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow transition"
                      >
                        <Phone className="w-3 h-3" /> 打電話
                      </a>
                      <a
                        href={`sms:${familyContact.phone}?body=【緊急防詐】您發起了高額轉帳 NT$${transferAmount.toLocaleString()}，請問是否為本人操作？`}
                        className="flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold shadow transition"
                      >
                        <MessageSquare className="w-3 h-3" /> 傳簡訊
                      </a>
                      <a
                        href={`https://line.me/R/ti/p/~${familyContact.lineId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-[11px] font-bold shadow transition"
                      >
                        <Send className="w-3 h-3" /> LINE 聯絡
                      </a>
                    </div>
                  </div>

                  {/* 審核處置按鈕組 */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        setIsApproved(true);
                        triggerAlarm(false);
                      }}
                      className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
                    >
                      確認安全放行
                    </button>
                    <button
                      onClick={() => {
                        triggerAlarm(false);
                        setIsIntercepted(false);
                        alert("已阻斷該筆轉帳交易（帳戶安全未受封鎖）。");
                      }}
                      className="py-2.5 px-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow transition"
                    >
                      阻斷該筆交易
                    </button>
                  </div>
                </div>
              ) : isApproved ? (
                <div className="my-auto py-4">
                  <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-emerald-400 mb-1">交易已放行</h3>
                  <p className="text-xs text-slate-400 mb-4">家屬已進行雙重驗證放行此筆交易。</p>
                  <button onClick={handleReset} className="py-2 px-6 bg-slate-800 text-xs text-white rounded-xl">
                    重置模擬
                  </button>
                </div>
              ) : (
                <div className="my-auto py-4">
                  <XCircle className="w-16 h-16 text-amber-400 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-amber-400 mb-1">交易已逾時自動取消</h3>
                  <p className="text-xs text-slate-400 mb-4">由於未在 30 秒內確認，系統已保護資金安全並取消轉帳。</p>
                  <button onClick={handleReset} className="py-2 px-6 bg-slate-800 text-xs text-white rounded-xl">
                    返回主頁
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </main>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 pt-4 border-t border-slate-800/80">
        Demo Version • 競賽展示專用 • Vite + React + Tailwind CSS
      </footer>
    </div>
  );
}