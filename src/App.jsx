import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, CheckCircle, Lock, Smartphone, RefreshCw, Volume2, ShieldCheck, Phone, MessageSquare, Send, XCircle, Home, Mail, Calendar, Camera, Settings, MessageCircle, Users } from 'lucide-react';

export default function App() {
  // 多長輩帳號預設資料 (支援一對多獨立門檻與聯絡資訊)
  const [elders, setElders] = useState([
    {
      id: 'dad',
      label: '👨 爸爸 (王大明)',
      name: '王大明 (爸爸)',
      bank: '台灣銀行 (004) •••• 8821',
      phone: '0912345678',
      lineId: 'dad_guard_line',
      threshold: 500000,
    },
    {
      id: 'mom',
      label: '👩 媽媽 (李美華)',
      name: '李美華 (媽媽)',
      bank: '國泰世華 (013) •••• 3390',
      phone: '0987654321',
      lineId: 'mom_guard_line',
      threshold: 100000,
    },
    {
      id: 'grandma',
      label: '👵 祖母 (陳秀英)',
      name: '陳秀英 (祖母)',
      bank: '中華郵政 (700) •••• 5104',
      phone: '0922334455',
      lineId: 'grandma_guard_line',
      threshold: 50000,
    },
  ]);

  // 當前操作的長輩 ID (左側轉帳端) 與 當前檢視設定的長輩 ID (右側家屬端)
  const [activeElderId, setActiveElderId] = useState('dad');
  const [managingElderId, setManagingElderId] = useState('dad');

  const activeElder = elders.find((e) => e.id === activeElderId) || elders[0];
  const managingElder = elders.find((e) => e.id === managingElderId) || elders[0];

  // 交易與預警狀態
  const [transferAmount, setTransferAmount] = useState(600000);
  const [isIntercepted, setIsIntercepted] = useState(false);
  const [interceptedElderId, setInterceptedElderId] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const [isAlertPlaying, setIsAlertPlaying] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isTimeoutCancelled, setIsTimeoutCancelled] = useState(false);
  const [isHomeScreen, setIsHomeScreen] = useState(false);

  const interceptedElder = elders.find((e) => e.id === interceptedElderId) || activeElder;

  // 家屬資訊
  const guardianName = '張小明 (長子 • 聯防管理員)';

  // 更新指定長輩的獨立攔截門檻
  const updateElderThreshold = (elderId, newThreshold) => {
    setElders((prev) =>
      prev.map((item) => (item.id === elderId ? { ...item, threshold: newThreshold } : item))
    );
  };

  // 千分位數字解析輔助函式
  const handleFormattedNumberChange = (rawValue, onParsed, maxLimit = 100000000) => {
    const numericString = rawValue.replace(/[^0-9]/g, '');
    const parsed = numericString === '' ? 0 : Math.min(maxLimit, Number(numericString));
    onParsed(parsed);
  };

  // Web Audio API 警報聲生成器
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);

  const handleUnlockAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setIsAudioUnlocked(true);
  };

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
      console.log('Audio play error:', e);
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

    if (transferAmount >= activeElder.threshold) {
      setInterceptedElderId(activeElder.id);
      setIsIntercepted(true);
      setCountdown(30);
      setIsApproved(false);
      setIsTimeoutCancelled(false);
      triggerAlarm(true);
      if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 1000]);
      }
    } else {
      alert(
        `✅ 轉帳成功！\n帳戶：${activeElder.name}（${activeElder.bank}）\n金額：NT$ ${transferAmount.toLocaleString()}（未達該帳戶設定之 NT$ ${activeElder.threshold.toLocaleString()} 攔截門檻）`
      );
    }
  };

  // 重設測試
  const handleReset = () => {
    triggerAlarm(false);
    setIsIntercepted(false);
    setInterceptedElderId(null);
    setIsApproved(false);
    setIsTimeoutCancelled(false);
    setCountdown(30);
    setIsHomeScreen(false);
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
            <h1 className="text-xl md:text-2xl font-black text-white">金盾聯防 FamGuard • 家庭防詐風控模擬器</h1>
            <p className="text-xs md:text-sm text-slate-400">支援多長輩 / 跨銀行帳號一對多即時監控</p>
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
        
        {/* 左欄：長輩轉帳模擬卡片 (支援切換不同長輩帳號) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="flex items-center gap-2 text-indigo-400 text-sm font-semibold bg-indigo-950/60 px-3 py-1.5 rounded-full border border-indigo-800/50">
                <Smartphone className="w-4 h-4" /> 長輩網銀轉帳端
              </span>
              <span className="text-xs text-slate-400 font-mono">{activeElder.bank}</span>
            </div>

            {/* 💡 切換發起轉帳的長輩帳號 */}
            <div className="mb-5">
              <label className="block text-slate-400 text-xs mb-2">選擇發起轉帳的長輩帳戶：</label>
              <div className="grid grid-cols-3 gap-2">
                {elders.map((elder) => (
                  <button
                    key={elder.id}
                    disabled={isIntercepted}
                    onClick={() => {
                      setActiveElderId(elder.id);
                      setManagingElderId(elder.id);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition truncate ${
                      activeElderId === elder.id
                        ? 'bg-indigo-600/30 text-indigo-200 border-indigo-400 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 disabled:opacity-50'
                    }`}
                  >
                    {elder.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">輸入轉帳金額 (NT$)</span>
                <span className="text-xs text-slate-500">
                  此帳戶門檻：<span className="text-emerald-400 font-mono">NT$ {activeElder.threshold.toLocaleString()}</span>
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                disabled={isIntercepted}
                value={transferAmount === 0 ? '' : transferAmount.toLocaleString()}
                onChange={(e) => handleFormattedNumberChange(e.target.value, setTransferAmount)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3.5 text-2xl font-mono text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>

            {/* 快速金額選擇：1萬、60萬、120萬、180萬、240萬、300萬 */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[10000, 600000, 1200000, 1800000, 2400000, 3000000].map((amt) => (
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
                    偵測到 <span className="text-white font-bold">{interceptedElder.name}</span>（{interceptedElder.bank}）發起大額轉帳，已同步強行推播至 <span className="text-white font-bold">{guardianName}</span>。
                  </p>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={handleTransfer}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition"
            >
              發送轉帳請求（{activeElder.label}）
            </button>
          )}
        </div>

        {/* 右欄：家屬多帳號風控中心與手機首頁模擬 */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[500px]">
          
          {/* 當處於【手機首頁】且【沒有預警】時顯示首頁介面 */}
          {isHomeScreen && !isIntercepted ? (
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                  <span className="text-xs text-slate-400 font-mono">09:41 • 5G 100%</span>
                  <span className="text-xs text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                    監控中：3 組家庭帳戶
                  </span>
                </div>

                <div className="text-center my-4">
                  <div className="text-3xl font-extrabold text-slate-200">09:41</div>
                  <div className="text-xs text-slate-400">11月19日 星期四</div>
                </div>

                {/* 手機桌面的 App 圖示網格 */}
                <div className="grid grid-cols-4 gap-4 my-6 px-2">
                  <div className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => setIsHomeScreen(false)}>
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/40 relative">
                      <ShieldCheck className="w-6 h-6" />
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-[9px] font-bold px-1.5 rounded-full text-slate-950">
                        3
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-medium">金盾聯防</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <div className="p-3 bg-green-600 rounded-2xl text-white">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] text-slate-400">LINE</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <div className="p-3 bg-blue-600 rounded-2xl text-white">
                      <Mail className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] text-slate-400">郵件</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <div className="p-3 bg-amber-600 rounded-2xl text-white">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] text-slate-400">行事曆</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <div className="p-3 bg-purple-600 rounded-2xl text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] text-slate-400">相機</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <div className="p-3 bg-slate-700 rounded-2xl text-white">
                      <Settings className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] text-slate-400">設定</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-800">
                點擊「金盾聯防」可設定各長輩獨立額度；任一長輩超額轉帳時將<span className="text-amber-400 font-bold">強行覆蓋警報</span>。
              </div>
            </div>
          ) : (
            /* 防詐 App 多帳號管理主頁 */
            <>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2 text-emerald-400 text-sm font-semibold bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800/50">
                    <Users className="w-4 h-4" /> 多帳戶一對多聯防中心
                  </span>
                  <button
                    onClick={() => setIsHomeScreen(true)}
                    className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 transition"
                  >
                    <Home className="w-3.5 h-3.5 text-indigo-400" /> 回手機首頁
                  </button>
                </div>

                {/* 💡 家屬端切換要設定/聯絡的長輩卡片 */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {elders.map((elder) => (
                    <button
                      key={elder.id}
                      onClick={() => setManagingElderId(elder.id)}
                      className={`p-2 rounded-xl border text-left transition ${
                        managingElderId === elder.id
                          ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{elder.label}</div>
                      <div className="text-[10px] font-mono text-emerald-400/90 mt-0.5">
                        門檻 {(elder.threshold / 10000).toFixed(0)}萬
                      </div>
                    </button>
                  ))}
                </div>

                {/* 當前選中長輩的快捷聯絡資訊 */}
                <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 mb-4">
                  <div className="text-xs text-slate-400 mb-2 flex items-center justify-between">
                    <span>聯絡對象：<strong className="text-emerald-400">{managingElder.name}</strong></span>
                    <span className="text-[10px] font-mono text-slate-500">{managingElder.bank}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={`tel:${managingElder.phone}`}
                      className="flex items-center justify-center gap-1.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition"
                    >
                      <Phone className="w-3.5 h-3.5" /> 電話直連
                    </a>
                    <a
                      href={`sms:${managingElder.phone}?body=【金盾聯防】關心確認轉帳狀況`}
                      className="flex items-center justify-center gap-1.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> 發送簡訊
                    </a>
                    <a
                      href={`https://line.me/R/ti/p/~${managingElder.lineId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30 rounded-xl text-xs font-bold transition"
                    >
                      <Send className="w-3.5 h-3.5" /> LINE 通知
                    </a>
                  </div>
                </div>

                {/* 獨立門檻設定 (1萬 ~ 300萬 + 千分位逗號) */}
                <div className="mb-4">
                  <label className="block text-slate-400 text-xs mb-2">
                    設定 <span className="text-emerald-400 font-bold">{managingElder.name}</span> 單筆攔截門檻 (NT$)
                  </label>
                  <div className="relative mb-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={managingElder.threshold === 0 ? '' : managingElder.threshold.toLocaleString()}
                      onChange={(e) =>
                        handleFormattedNumberChange(
                          e.target.value,
                          (val) => updateElderThreshold(managingElder.id, val),
                          3000000
                        )
                      }
                      onBlur={() => {
                        if (managingElder.threshold < 10000) updateElderThreshold(managingElder.id, 10000);
                      }}
                      className="w-full bg-slate-950 border border-emerald-500/40 rounded-2xl px-4 py-2.5 text-xl font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-400 transition"
                      placeholder="10,000 ~ 3,000,000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                      1萬 ~ 300萬
                    </span>
                  </div>

                  <input
                    type="range"
                    min={10000}
                    max={3000000}
                    step={10000}
                    value={Math.min(3000000, Math.max(10000, managingElder.threshold))}
                    onChange={(e) => updateElderThreshold(managingElder.id, Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1.5 font-mono">
                    <span>1萬</span>
                    <span>150萬</span>
                    <span>300萬</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>聯防狀態：已監控 <strong className="text-emerald-400">3</strong> 個家庭帳戶</span>
                <span className={`font-bold ${isAudioUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isAudioUnlocked ? '● 警報已授權' : '○ 待授權音效'}
                </span>
              </div>
            </>
          )}

          {/* 🚨 右欄預警爆閃彈窗 (精準顯示觸發預警的長輩與銀行資訊) */}
          {isIntercepted && (
            <div className={`absolute inset-0 z-40 p-6 flex flex-col justify-between text-center ${
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
                    <div className="inline-block bg-red-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                      警報來源：{interceptedElder.name} • {interceptedElder.bank}
                    </div>
                    <h3 className="text-xl font-black text-red-400">高風險異常轉帳觸發！</h3>
                    <p className="text-xs text-slate-300">
                      請求轉帳 <span className="text-amber-400 font-bold">NT$ {transferAmount.toLocaleString()}</span>（超過設定門檻 NT$ {interceptedElder.threshold.toLocaleString()}）
                    </p>
                  </div>

                  {/* 託管倒數區 */}
                  <div className="bg-slate-950/90 border border-red-500/40 rounded-xl p-3">
                    <div className="text-[11px] text-slate-400">家屬託管倒數中（強行覆蓋手機畫面）</div>
                    <div className="text-3xl font-mono font-extrabold text-amber-400 my-0.5">
                      00:{countdown < 10 ? `0${countdown}` : countdown}
                    </div>
                    <div className="text-[10px] text-slate-400">倒數結束未確認將自動取消交易</div>
                  </div>

                  {/* 家屬即時快捷聯絡按鈕組 (自動帶入觸發預警的長輩電話/LINE) */}
                  <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5">
                    <div className="text-[11px] text-slate-300 mb-2 font-medium flex items-center justify-center gap-1">
                      <span>📞 立即聯絡確認：</span>
                      <span className="text-emerald-400 font-bold">{interceptedElder.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <a
                        href={`tel:${interceptedElder.phone}`}
                        className="flex items-center justify-center gap-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow transition"
                      >
                        <Phone className="w-3 h-3" /> 打電話
                      </a>
                      <a
                        href={`sms:${interceptedElder.phone}?body=【金盾聯防警報】偵測到您的帳戶（${interceptedElder.bank}）發起高額轉帳 NT$${transferAmount.toLocaleString()}，請問是否為本人操作？`}
                        className="flex items-center justify-center gap-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold shadow transition"
                      >
                        <MessageSquare className="w-3 h-3" /> 傳簡訊
                      </a>
                      <a
                        href={`https://line.me/R/ti/p/~${interceptedElder.lineId}`}
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
                        alert(`已阻斷 ${interceptedElder.name} 的該筆轉帳交易（帳戶安全未受封鎖）。`);
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
                  <p className="text-xs text-slate-400 mb-4">
                    已授權 {interceptedElder.name}（{interceptedElder.bank}）之轉帳。
                  </p>
                  <button onClick={handleReset} className="py-2 px-6 bg-slate-800 text-xs text-white rounded-xl">
                    重置模擬
                  </button>
                </div>
              ) : (
                <div className="my-auto py-4">
                  <XCircle className="w-16 h-16 text-amber-400 mx-auto mb-2" />
                  <h3 className="text-lg font-bold text-amber-400 mb-1">交易已逾時自動取消</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    未在 30 秒內確認，已安全取消 {interceptedElder.name} 的轉帳並保持帳戶正常使用。
                  </p>
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
        金盾聯防 FamGuard • 競賽展示專用 • Vite + React + Tailwind CSS
      </footer>
    </div>
  );
}