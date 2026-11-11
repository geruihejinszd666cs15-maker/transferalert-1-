import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock, Smartphone, RefreshCw, Volume2, ShieldCheck } from 'lucide-react';

export default function App() {
  // 狀態設定
  const [transferAmount, setTransferAmount] = useState(600000);
  const [threshold, setThreshold] = useState(500000);
  const [isIntercepted, setIsIntercepted] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [isAlertPlaying, setIsAlertPlaying] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

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
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 高音
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4); // 警報頻率下降

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

  // 倒數計時與阻斷觸發
  useEffect(() => {
    let timer;
    if (isIntercepted && countdown > 0 && !isApproved) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      triggerAlarm(false);
    }
    return () => clearInterval(timer);
  }, [isIntercepted, countdown, isApproved]);

  // 執行模擬轉帳
  const handleTransfer = () => {
    if (!isAudioUnlocked) handleUnlockAudio();

    if (transferAmount >= threshold) {
      setIsIntercepted(true);
      setCountdown(30);
      setIsApproved(false);
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
          <span className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xl font-bold rounded-2xl shadow-lg shadow-indigo-500/30">
            開啟 Demo 模式
          </span>
        </div>
      )}

      {/* 🚨 2. 全螢幕爆閃警報彈窗 */}
      {isIntercepted && (
        <div className={`fixed inset-0 z-40 flex flex-col items-center justify-center p-6 text-center ${
          isApproved ? 'bg-slate-900/95' : 'bg-red-950/95 animate-pulse'
        }`}>
          <div className="max-w-2xl w-full bg-slate-900/90 border-2 border-red-500/50 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
            {!isApproved ? (
              <>
                <div className="inline-flex p-4 bg-red-600/20 rounded-full text-red-500 mb-4 animate-bounce">
                  <ShieldAlert className="w-20 h-20" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-red-500 mb-2">高風險異常轉帳已被阻斷！</h2>
                <p className="text-slate-300 text-lg md:text-xl mb-6">
                  偵測到單筆轉帳金額 <span className="text-amber-400 font-bold underline">NT$ {transferAmount.toLocaleString()}</span> 超過家族設定門檻！
                </p>

                {/* 倒數託管區 */}
                <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 mb-8">
                  <div className="text-slate-400 text-sm md:text-base mb-1">30秒家屬聯防託管倒數中</div>
                  <div className="text-5xl md:text-7xl font-mono font-extrabold text-amber-400 my-2">
                    00:{countdown < 10 ? `0${countdown}` : countdown}
                  </div>
                  <p className="text-xs md:text-sm text-slate-400">已向長輩指定關懷家屬手機發出「地震級特快即時推播」</p>
                </div>

                {/* 按鈕組 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setIsApproved(true);
                      triggerAlarm(false);
                    }}
                    className="py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg transition"
                  >
                    關懷家屬：確認安全放行
                  </button>
                  <button
                    onClick={handleReset}
                    className="py-4 px-6 bg-red-600 hover:bg-red-500 text-white font-bold text-lg rounded-xl shadow-lg transition"
                  >
                    立即終止並鎖定帳戶
                  </button>
                </div>
              </>
            ) : (
              /* 家屬放行後狀態 */
              <div className="py-8">
                <CheckCircle2 className="w-24 h-24 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-emerald-400 mb-2">授權完成，轉帳已安全放行</h2>
                <p className="text-slate-300 text-lg mb-8">家屬已進行二階段驗證，該筆交易記錄已加密歸檔。</p>
                <button
                  onClick={handleReset}
                  className="py-3 px-8 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition"
                >
                  返回模擬主介面
                </button>
              </div>
            )}
          </div>
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
            <p className="text-xs md:text-sm text-slate-400">Family Transfer Anti-Fraud Guard • 跨裝置展演版</p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" /> 重置展示
        </button>
      </header>

      {/* MAIN CONTENT (RWD 雙欄/單欄佈局) */}
      <main className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6 my-auto py-6">
        
        {/* 左欄：長輩轉帳模擬卡片 */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl">
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
                value={transferAmount}
                onChange={(e) => setTransferAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3.5 text-2xl font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* 快速金額選擇 */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[100000, 600000, 1200000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTransferAmount(amt)}
                  className={`py-2 px-3 rounded-xl text-xs font-mono border transition ${
                    transferAmount === amt
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  NT$ {(amt / 10000).toFixed(0)} 萬
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleTransfer}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition"
          >
            發送轉帳請求
          </button>
        </div>

        {/* 右欄：家屬風控規則設定卡片 */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="flex items-center gap-2 text-emerald-400 text-sm font-semibold bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800/50">
                <Lock className="w-4 h-4" /> 家屬聯防門檻設定
              </span>
              <span className="text-xs text-emerald-400/80 font-mono">系統防護中</span>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-slate-400 text-sm">單筆攔截門檻</label>
                <span className="text-emerald-400 font-mono font-bold text-lg">
                  NT$ {threshold.toLocaleString()}
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
              <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                <span>10萬</span>
                <span>100萬</span>
                <span>200萬</span>
              </div>
            </div>

            {/* 風控狀態說明 */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  高於 <span className="text-emerald-400 font-bold">NT$ {threshold.toLocaleString()}</span> 之轉帳，將觸發 30 秒風控託管並自動發送全螢幕爆閃警報。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>音效權限狀態：</span>
            <span className={`font-bold ${isAudioUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isAudioUnlocked ? '● 警報已授權 (Audio Active)' : '○ 點擊螢幕進行授權'}
            </span>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 pt-4 border-t border-slate-800/80">
        Demo Version • 競賽展示專用 • Vite + React + Tailwind CSS
      </footer>
    </div>
  );
}