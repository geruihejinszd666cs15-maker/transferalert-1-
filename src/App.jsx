import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, ShieldCheck, Smartphone, AlertTriangle, PhoneCall, 
  Slash, CheckCircle, RefreshCw, Volume2, VolumeX, Lock, X, 
  Clock, DollarSign, UserCheck, Shield, ChevronRight, Info
} from 'lucide-react';

export default function App() {
  // 1. 轉帳交易狀態 (符合企劃書情境)
  const [amount, setAmount] = useState('2000000'); // 預設 200 萬 (約定轉帳破口)
  const [recipientName, setRecipientName] = useState('假投資專戶 (812-9842)');
  const [bankAccount, setBankAccount] = useState('812 4920 1092 8812');
  const [note, setNote] = useState('內線投資申購股票');

  // 自訂約定/防詐觸發門檻設定
  const [agreedThreshold, setAgreedThreshold] = useState('500000'); // 預設門檻 50 萬
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // 系統與介面控制狀態
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('dual'); // 'dual', 'deviceA', 'deviceB'
  const [logs, setLogs] = useState([]);

  // 2. 交易託管與警報狀態 (30秒風控託管期)
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [activeAlert, setActiveAlert] = useState(null); // null, { id, amount, isHighAmount, status: 'PENDING'|'BLOCKED'|'PASSED' }
  const [blockReason, setBlockReason] = useState('');
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  // 倒數計時器 Ref
  const timerRef = useRef(null);

  // Web Audio 警報聲波播放 (模擬地震警報頻率)
  const playAlertSound = (isHighRisk) => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq, duration, delay = 0) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = isHighRisk ? 'sawtooth' : 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + duration);
        }, delay * 1000);
      };

      if (isHighRisk) {
        // 高危急促雙音音效 (模擬國家級地震警報節奏)
        playTone(880, 0.2, 0);
        playTone(660, 0.2, 0.2);
        playTone(880, 0.2, 0.4);
        playTone(660, 0.3, 0.6);
      } else {
        playTone(520, 0.3, 0);
        playTone(650, 0.4, 0.3);
      }
    } catch (e) {
      console.log('Audio API not allowed before interaction', e);
    }
  };

  // 清除倒數計時器
  const clearAlertTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 30 秒倒數處理邏輯
  useEffect(() => {
    if (isProcessing && countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isProcessing && activeAlert?.status === 'PENDING') {
      // 30秒結束家屬未阻斷 -> 交易通過
      clearAlertTimer();
      setIsProcessing(false);
      setActiveAlert((prev) => (prev ? { ...prev, status: 'PASSED' } : null));

      setLogs((prev) => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString(),
          sender: '系統安控中心',
          type: 'INFO',
          message: `[${activeAlert.txnId}] 30秒風控託管期滿，家屬無異議，資金扣款完成。`
        },
        ...prev
      ]);
    }

    return () => clearAlertTimer();
  }, [isProcessing, countdown, activeAlert]);

  // 長輩 A 發起轉帳 -> 進入 30 秒雙人安控託管
  const handleTransferSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    const thresholdNum = parseFloat(agreedThreshold) || 500000;

    if (isNaN(numAmount) || numAmount <= 0) {
      alert('請輸入有效的轉帳金額');
      return;
    }

    clearAlertTimer();
    setIsProcessing(true);
    setCountdown(30);

    const timestamp = new Date().toLocaleTimeString();
    const isHighAmount = numAmount >= thresholdNum;
    const txnId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const alertData = {
      id: Date.now(),
      txnId,
      amount: numAmount,
      recipientName,
      bankAccount,
      note,
      timestamp,
      isHighAmount,
      status: 'PENDING'
    };

    setActiveAlert(alertData);
    playAlertSound(isHighAmount);

    setLogs((prev) => [
      {
        id: Date.now(),
        time: timestamp,
        sender: '使用者 A (長輩)',
        type: isHighAmount ? 'CRITICAL' : 'WARNING',
        message: `[${txnId}] 申請轉帳 NT$ ${numAmount.toLocaleString()} (${
          isHighAmount
            ? `已突破安控門檻 NT$ ${thresholdNum.toLocaleString()}`
            : '一般轉帳'
        }) → 進入 30 秒雙人安控託管期`
      },
      ...prev
    ]);
  };

  // 家屬 B 點擊「一鍵阻斷轉帳」
  const handleConfirmBlock = () => {
    if (!activeAlert) return;
    clearAlertTimer();
    setIsProcessing(false);
    setShowBlockDialog(false);

    const timestamp = new Date().toLocaleTimeString();
    const reasonText = blockReason.trim() || '家屬懷疑遭詐騙攔截';

    setActiveAlert((prev) => (prev ? { ...prev, status: 'BLOCKED', reason: reasonText } : null));

    setLogs((prev) => [
      {
        id: Date.now(),
        time: timestamp,
        sender: '家屬 B (監護人)',
        type: 'BLOCKED',
        message: `[${activeAlert.txnId}] 🚫 成功阻斷本次轉帳！原因：${reasonText}。資金已解凍回歸帳戶。`
      },
      ...prev
    ]);
  };

  // 一鍵重置全域狀態
  const handleReset = () => {
    clearAlertTimer();
    setIsProcessing(false);
    setCountdown(30);
    setActiveAlert(null);
    setShowBlockDialog(false);
    setBlockReason('');
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* 頂部控制與設定列 */}
      <header className="bg-slate-900 border-b border-slate-800 p-3 sm:p-4 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-red-600 rounded-xl shadow-lg">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                高齡雙人雙驗證安控系統 (防詐警報模擬器)
              </h1>
              <p className="text-[11px] text-slate-400">
                企劃實作：約定轉帳破口防護 × 地震警報級全螢幕家屬即時阻斷
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 text-amber-300 transition"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              設定約定安控門檻 (NT$ {parseInt(agreedThreshold).toLocaleString()})
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
                soundEnabled
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-blue-400" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              音效: {soundEnabled ? '開' : '關'}
            </button>

            <button
              onClick={handleReset}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 重置
            </button>
          </div>
        </div>
      </header>

      {/* 手機顯示切換 (小螢幕頁籤) */}
      <div className="lg:hidden bg-slate-900/80 border-b border-slate-800 p-2 flex justify-center space-x-2">
        <button
          onClick={() => setActiveTab('dual')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            activeTab === 'dual' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'
          }`}
        >
          雙機並排
        </button>
        <button
          onClick={() => setActiveTab('deviceA')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
            activeTab === 'deviceA' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          長輩 A (轉帳端)
        </button>
        <button
          onClick={() => setActiveTab('deviceB')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold relative ${
            activeTab === 'deviceB' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          家屬 B (監控端)
          {isProcessing && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
          )}
        </button>
      </div>

      {/* 主體內容區域：雙手機並排區 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 左側與中間：雙手機顯示區域 (佔 8 欄) */}
        <div
          className={`lg:col-span-8 grid gap-6 ${
            activeTab === 'dual'
              ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1'
          }`}
        >
          {/* ==================== 手機 A：長輩轉帳端 ==================== */}
          {(activeTab === 'dual' || activeTab === 'deviceA') && (
            <div className="flex flex-col items-center">
              <div className="text-center mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Smartphone className="w-3.5 h-3.5" /> 使用者 A (長輩轉帳端)
                </span>
              </div>

              {/* 手機外殼 */}
              <div className="w-full max-w-[340px] h-[640px] bg-slate-900 rounded-[40px] border-4 border-slate-700 shadow-2xl p-4 flex flex-col relative overflow-hidden ring-1 ring-slate-800">
                {/* 瀏海 / 狀態列 */}
                <div className="w-full flex justify-between items-center px-4 pt-1 pb-2 text-[10px] text-slate-400 border-b border-slate-800/50">
                  <span>09:41</span>
                  <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-slate-800 rounded-full" />
                  </div>
                  <span>5G 100%</span>
                </div>

                {/* 網銀 App 頂部 Bar */}
                <div className="py-2.5 border-b border-slate-800 text-center">
                  <h2 className="font-bold text-sm text-slate-200">極速行動銀行</h2>
                  <p className="text-[9px] text-slate-400">已開通雙人安控聯動保護</p>
                </div>

                {/* 手機內部內容 */}
                <div className="flex-1 overflow-y-auto py-3 space-y-3">
                  {/* 轉帳表單 */}
                  <form onSubmit={handleTransferSubmit} className="space-y-3">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-amber-400" /> 轉帳金額 (NT$)
                        </span>
                        <span className="text-[9px] text-amber-400 font-bold">
                          門檻：NT$ {parseInt(agreedThreshold).toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={isProcessing}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-bold text-amber-400 text-xl focus:outline-none focus:border-amber-500 disabled:opacity-50"
                          placeholder="請輸入金額"
                        />
                      </div>

                      {/* 快速填入按鈕 (配合企劃情境測試) */}
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() => setAmount('50000')}
                          disabled={isProcessing}
                          className="py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 font-medium disabled:opacity-50"
                        >
                          5萬 (非約定)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmount(agreedThreshold)}
                          disabled={isProcessing}
                          className="py-1 bg-amber-950 hover:bg-amber-900 border border-amber-800 rounded-lg text-[10px] text-amber-300 font-bold disabled:opacity-50"
                        >
                          {parseInt(agreedThreshold) / 10000}萬 (門檻)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmount('2000000')}
                          disabled={isProcessing}
                          className="py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 rounded-lg text-[10px] text-rose-300 font-bold disabled:opacity-50"
                        >
                          200萬 (約定上限)
                        </button>
                      </div>
                    </div>

                    {/* 轉帳帳號資訊 */}
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1">收款人 / 戶名</label>
                        <input
                          type="text"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          disabled={isProcessing}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1">收款帳號</label>
                        <input
                          type="text"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          disabled={isProcessing}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px] block mb-1">轉帳備註</label>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          disabled={isProcessing}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs"
                        />
                      </div>
                    </div>

                    {/* 轉帳觸發按鈕 */}
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                        isProcessing
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      {isProcessing ? '雙人防護風控中...' : '確認發起網銀轉帳'}
                    </button>
                  </form>

                  {/* 30 秒風控託管中動態視窗 */}
                  {isProcessing && (
                    <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-2xl space-y-2 animate-pulse">
                      <div className="flex items-center justify-between text-amber-400 font-bold text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> 風控託管中 (雙人驗證)
                        </span>
                        <span className="text-sm font-mono">{countdown}s</span>
                      </div>
                      <p className="text-[10px] text-amber-200/80 leading-relaxed">
                        根據安控協議：本筆交易已即時推播給您的指定家屬 B。家屬可在 30 秒內進行電話確認或安全阻斷。
                      </p>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full transition-all duration-1000"
                          style={{ width: `${(countdown / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 交易結果狀態提示 */}
                  {!isProcessing && activeAlert && (
                    <div
                      className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                        activeAlert.status === 'BLOCKED'
                          ? 'bg-red-950/40 border-red-500/50 text-red-200'
                          : activeAlert.status === 'PASSED'
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>
                          {activeAlert.status === 'BLOCKED' && '⚠️ 轉帳已被家屬成功阻斷！'}
                          {activeAlert.status === 'PASSED' && '✅ 轉帳完成'}
                        </span>
                        <span className="text-[10px] opacity-75">{activeAlert.timestamp}</span>
                      </div>
                      <p className="text-[10px] leading-normal opacity-90">
                        {activeAlert.status === 'BLOCKED' &&
                          `理由：${activeAlert.reason || '家屬判定為可疑交易'}。資金未扣款，已即時解凍退回原帳戶。`}
                        {activeAlert.status === 'PASSED' &&
                          `交易金額 NT$ ${activeAlert.amount.toLocaleString()} 已順利匯出。`}
                      </p>
                    </div>
                  )}
                </div>

                {/* 底部 Home Indicator */}
                <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto mt-1" />
              </div>
            </div>
          )}

          {/* ==================== 手機 B：家屬監控端 ==================== */}
          {(activeTab === 'dual' || activeTab === 'deviceB') && (
            <div className="flex flex-col items-center">
              <div className="text-center mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> 家屬 B (安全監控端)
                </span>
              </div>

              {/* 手機外殼 */}
              <div
                className={`w-full max-w-[340px] h-[640px] bg-slate-900 rounded-[40px] border-4 transition-all duration-300 shadow-2xl p-4 flex flex-col relative overflow-hidden ${
                  activeAlert?.isHighAmount && isProcessing
                    ? 'border-red-600 ring-4 ring-red-500/30'
                    : 'border-slate-700 ring-1 ring-slate-800'
                }`}
              >
                {/* 狀態列 */}
                <div className="w-full flex justify-between items-center px-4 pt-1 pb-2 text-[10px] text-slate-400 border-b border-slate-800/50">
                  <span>09:41</span>
                  <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-slate-800 rounded-full" />
                  </div>
                  <span>5G 100%</span>
                </div>

                {/* App 頂部 Bar */}
                <div className="py-2.5 border-b border-slate-800 flex items-center justify-between px-2">
                  <div className="flex items-center space-x-1.5">
                    <Shield className="w-4 h-4 text-rose-500" />
                    <span className="font-bold text-xs text-slate-200">家屬安控防詐衛士</span>
                  </div>
                  <span className="text-[9px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded-md">
                    實時防護中
                  </span>
                </div>

                {/* 內容主體區 */}
                <div className="flex-1 overflow-y-auto py-3 space-y-3 relative">
                  {/* 當沒有警報時的常態首頁 */}
                  {!isProcessing && (!activeAlert || activeAlert.status !== 'BLOCKED') && (
                    <div className="space-y-3">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                          <UserCheck className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-sm text-slate-200">長輩帳戶安全維護中</h3>
                        <p className="text-[10px] text-slate-400">
                          已綁定長輩「使用者 A」。當發生大額約定/非約定轉帳時，系統將發送全螢幕地震級警報。
                        </p>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          安全設定資訊
                        </div>
                        <div className="flex justify-between items-center text-[11px] py-1 border-b border-slate-900">
                          <span className="text-slate-400">觸發警報門檻</span>
                          <span className="font-bold text-amber-400">
                            NT$ {parseInt(agreedThreshold).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] py-1">
                          <span className="text-slate-400">緊急聯絡電話</span>
                          <span className="font-mono text-slate-200">0912-***-567</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 成功阻斷後顯示的歷史說明 */}
                  {!isProcessing && activeAlert?.status === 'BLOCKED' && (
                    <div className="bg-red-950/40 border border-red-500/50 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center space-x-2 text-red-400 font-bold text-xs">
                        <Slash className="w-5 h-5 text-red-500" />
                        <span>已成功攔截異常轉帳！</span>
                      </div>
                      <div className="space-y-1.5 text-[11px] text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">交易單號:</span>
                          <span className="font-mono text-slate-200">{activeAlert.txnId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">攔截金額:</span>
                          <span className="font-bold text-amber-400">
                            NT$ {activeAlert.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">攔截原因:</span>
                          <span className="text-rose-300">{activeAlert.reason}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('已撥打 165 反詐騙專線諮詢。')}
                        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> 通報 165 反詐騙專線
                      </button>
                    </div>
                  )}

                  {/* ==================== 核心亮點：地震警報級 全螢幕覆蓋 Alerts ==================== */}
                  {isProcessing && activeAlert && (
                    <div className="absolute inset-0 bg-slate-950/95 z-30 rounded-2xl flex flex-col justify-between p-4 border-2 border-red-500 animate-in fade-in duration-200">
                      {/* 紅色雷達擴散脈衝 背景 */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-red-600/20 rounded-full animate-ping pointer-events-none" />

                      {/* 頂部強烈警告 Header */}
                      <div className="relative z-10 text-center space-y-1">
                        <div className="inline-flex items-center gap-1.5 bg-red-600 text-white font-black text-[11px] px-3 py-1 rounded-full shadow-lg animate-bounce">
                          <AlertTriangle className="w-4 h-4" /> 國家級安全警報 (緊急攔截)
                        </div>
                        <h2 className="text-lg font-black text-red-500 tracking-tight pt-1">
                          長輩正進行大額交易！
                        </h2>
                        <p className="text-[10px] text-slate-300">
                          風控緩衝剩餘：<span className="font-mono font-bold text-amber-400 text-sm">{countdown} 秒</span>
                        </p>
                      </div>

                      {/* 中間交易詳細卡片 */}
                      <div className="relative z-10 bg-slate-900 border border-slate-700 p-3 rounded-2xl space-y-2 text-xs shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                          <span className="text-slate-400 text-[10px]">轉帳發起人</span>
                          <span className="font-bold text-slate-200">使用者 A (長輩)</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                          <span className="text-slate-400 text-[10px]">轉帳金額</span>
                          <span className="font-black text-amber-400 text-base font-mono">
                            NT$ {activeAlert.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                          <span className="text-slate-400 text-[10px]">受款帳號</span>
                          <span className="font-mono text-slate-300 text-[10px]">{activeAlert.bankAccount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-[10px]">轉帳備註</span>
                          <span className="text-slate-300 text-[10px]">{activeAlert.note}</span>
                        </div>
                      </div>

                      {/* 底部緊急處置雙按鈕 */}
                      <div className="relative z-10 space-y-2">
                        {/* 1. 一鍵阻斷轉帳按鈕 */}
                        <button
                          onClick={() => setShowBlockDialog(true)}
                          className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-sm rounded-xl shadow-xl flex items-center justify-center gap-2 ring-2 ring-red-400/50"
                        >
                          <Slash className="w-4 h-4" /> 🚫 立即阻斷轉帳 (凍結資金)
                        </button>

                        {/* 2. 電話確認按鈕 */}
                        <button
                          onClick={() => alert('正發起防詐確認電話致長輩 A 手機...')}
                          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-blue-400" /> 致電長輩確認情況
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 底部 Home Indicator */}
                <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto mt-1" />
              </div>
            </div>
          )}
        </div>

        {/* 右側：系統操作日誌與企劃亮點對照 (佔 4 欄) */}
        <div className="lg:col-span-4 space-y-4">
          {/* 系統即時日誌 Audit Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[340px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h2 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-400" /> 安控即時日誌 (Audit Log)
              </h2>
              <span className="text-[10px] font-mono text-slate-500">{logs.length} 筆事件</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[11px]">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                  等待發起轉帳測試...
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-xl border space-y-1 ${
                      log.type === 'BLOCKED'
                        ? 'bg-red-950/40 border-red-500/40 text-red-300'
                        : log.type === 'CRITICAL'
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between text-[10px] opacity-75">
                      <span className="font-bold">{log.sender}</span>
                      <span>{log.time}</span>
                    </div>
                    <div className="text-[10px] leading-relaxed">{log.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 企劃特色痛點解法對照 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
            <h3 className="font-bold text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4" /> 企劃書關鍵痛點對應解法
            </h3>
            <ul className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>破解單人驗證失效：</strong> 長輩即使遭隔空洗腦輸入密碼，家屬端末依然可強制介入阻斷。
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>防堵約定轉帳巨額破口：</strong> 超過自訂門檻（如 50 萬或 200 萬）強制進入 30 秒風控託管期。
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>地震警報級強震音效：</strong> 採用高優先級全螢幕 Alert 與震動頻率，克服長輩與家屬忽略通知的問題。
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* ==================== 彈出 Modal：家屬確認阻斷轉帳原因 ==================== */}
      {showBlockDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-red-400 text-sm flex items-center gap-2">
                <Slash className="w-5 h-5" /> 阻斷轉帳交易確認
              </h3>
              <button
                onClick={() => setShowBlockDialog(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              您即將阻斷長輩 A 申請的 NT$ {activeAlert?.amount.toLocaleString()} 筆轉帳。請選擇或填寫阻斷原因：
            </p>

            <div className="space-y-2">
              {['疑遭假投資詐騙騙取積蓄', '未事先告知的大額異常轉帳', '長輩電話中神情慌張/疑遭洗腦', '非本人自由意志操作'].map(
                (reason) => (
                  <button
                    key={reason}
                    onClick={() => setBlockReason(reason)}
                    className={`w-full text-left p-2 rounded-xl text-xs border transition ${
                      blockReason === reason
                        ? 'bg-red-950 border-red-500 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {reason}
                  </button>
                )
              )}

              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="或手動輸入阻斷理由..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowBlockDialog(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                取消
              </button>
              <button
                onClick={handleConfirmBlock}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black shadow-lg"
              >
                確認阻斷並退回資金
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 彈出 Modal：設定約定安控門檻 ==================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                設定防詐與家屬雙驗證觸發門檻
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  指定約定/防詐監護觸發金額 (NT$)
                </label>
                <input
                  type="number"
                  value={agreedThreshold}
                  onChange={(e) => setAgreedThreshold(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-amber-400 font-bold text-lg focus:outline-none"
                  placeholder="請輸入門檻金額"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  說明：當長輩 A 轉帳金額高於此門檻時，家屬 B 的手機會觸發「地震警報級」強烈全螢幕視覺與雙音聲波；低於此門檻則發送一般提醒。
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-300">
                <div className="text-amber-400 font-bold mb-1">企劃書銀行額度數據參考：</div>
                <div className="flex justify-between">
                  <span>非約定轉帳單筆上限:</span>
                  <span>NT$ 50,000</span>
                </div>
                <div className="flex justify-between">
                  <span>約定轉帳每日上限 (中信/玉山):</span>
                  <span>NT$ 2,000,000</span>
                </div>
                <div className="flex justify-between">
                  <span>約定轉帳每日上限 (國泰/台新):</span>
                  <span>NT$ 3,000,000</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
              >
                儲存並套用門檻
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}