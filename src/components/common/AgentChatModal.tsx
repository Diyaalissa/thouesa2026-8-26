import React, { useState } from 'react';
import { X, Send, Bot, User, ShieldCheck, CheckCheck } from 'lucide-react';
import { Locale } from '../../types';

interface AgentChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  hubName?: string;
  agentName?: string;
  trackingNumber?: string;
  locale?: Locale;
}

export const AgentChatModal: React.FC<AgentChatModalProps> = ({
  isOpen,
  onClose,
  hubName = 'مركز عمان الرئيسي (AMM-01)',
  agentName = 'عمر النجار (Omar Al-Najjar)',
  trackingNumber,
  locale = 'ar',
}) => {
  const isAr = locale === 'ar';
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'agent',
      text: isAr
        ? `أهلاً بك! معك ${agentName} من ${hubName}. كيف يمكنني مساعدتك بخصوص شحنتك${trackingNumber ? ` (${trackingNumber})` : ''}؟`
        : `Hello! This is ${agentName} from ${hubName}. How can I assist with your shipment${trackingNumber ? ` (${trackingNumber})` : ''}?`,
      time: 'الآن',
    },
  ]);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
      time: 'الآن',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Simulated helpful agent reply
    setTimeout(() => {
      const agentReply = {
        id: Date.now() + 1,
        sender: 'agent',
        text: isAr
          ? 'تم استلام استفسارك! طاقم الفرع متواجد حالياً لفحص واستلام الطرود حتى الساعة 22:00. لا تتردد في زيارتنا أو الاستفسار عن أي تفاصيل.'
          : 'Thank you! The hub team is available for parcel intake & inspection until 22:00. Feel free to visit or ask any additional questions.',
        time: 'الآن',
      };
      setMessages((prev) => [...prev, agentReply]);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-md w-full h-[520px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Chat Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white relative">
              <span>ع</span>
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute bottom-0 right-0 border-2 border-slate-900" />
            </div>
            <div>
              <h4 className="text-sm font-bold">{agentName}</h4>
              <p className="text-[11px] text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{hubName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                <p className="leading-relaxed">{m.text}</p>
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                    m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  <span>{m.time}</span>
                  {m.sender === 'user' && <CheckCheck className="w-3 h-3 text-white" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isAr ? 'اكتب رسالتك لموظف الفرع...' : 'Type your message to the agent...'}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
