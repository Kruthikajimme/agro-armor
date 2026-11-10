
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  MicOff, 
  X, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  Navigation, 
  Globe, 
  Sparkles, 
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  SupportedLanguage, 
  SUPPORTED_VOICE_LANGUAGES, 
  VOICE_UI_TEXT, 
  QUICK_SAMPLE_PHRASES, 
  matchVoiceCommand,
  MatchResult
} from "@/utils/voiceRegistry";

// --- Types for Web Speech API ---
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'success' | 'not_understood' | 'error' | 'mic_denied' | 'unsupported';

const VoiceAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { language: currentAppLang, setLanguage: setAppLang } = useLanguage();
  
  // Safe cast to supported voice language
  const activeLang: SupportedLanguage = (currentAppLang in SUPPORTED_VOICE_LANGUAGES) 
    ? (currentAppLang as SupportedLanguage) 
    : 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [activeVoiceLang, setActiveVoiceLang] = useState<SupportedLanguage>(activeLang);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const isNavigatingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const uiText = VOICE_UI_TEXT[activeVoiceLang] || VOICE_UI_TEXT.en;
  const samplePhrases = QUICK_SAMPLE_PHRASES[activeVoiceLang] || QUICK_SAMPLE_PHRASES.en;
  const langConfig = SUPPORTED_VOICE_LANGUAGES[activeVoiceLang] || SUPPORTED_VOICE_LANGUAGES.en;

  // Sync component language when app language changes
  useEffect(() => {
    if (currentAppLang in SUPPORTED_VOICE_LANGUAGES) {
      setActiveVoiceLang(currentAppLang as SupportedLanguage);
    }
  }, [currentAppLang]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
  }, []);

  // Speak confirmation using browser SpeechSynthesis
  const speakFeedback = useCallback((text: string, langCode: string) => {
    if (!ttsEnabled || !synthRef.current) return;
    try {
      stopSpeaking();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly slower for clarity
      utterance.pitch = 1.0;
      utterance.lang = langCode;

      // Try finding a matching voice
      const voices = synthRef.current.getVoices?.() || [];
      const prefix = langCode.split('-')[0].toLowerCase();
      const matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      synthRef.current.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }, [ttsEnabled, stopSpeaking]);

  // Execute recognized navigation
  const executeNavigation = useCallback((match: MatchResult) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    setAssistantState('success');
    setFeedbackMessage(match.confirmation);
    speakFeedback(match.confirmation, langConfig.bcp47);

    // Short delay so the farmer hears the confirmation and sees the green success badge
    setTimeout(() => {
      if (match.route === '__back__') {
        navigate(-1);
      } else if (match.route === '__help__') {
        setShowHelpGuide(true);
        setAssistantState('idle');
      } else {
        navigate(match.route);
        // Auto-minimize after navigating to clean the screen on mobile
        setTimeout(() => {
          setIsOpen(false);
        }, 800);
      }
      isNavigatingRef.current = false;
    }, 1100);
  }, [langConfig.bcp47, navigate, speakFeedback]);

  // Process text command (from speech or tapped chips)
  const processCommandText = useCallback((spokenText: string) => {
    if (!spokenText.trim()) {
      setAssistantState('idle');
      return;
    }

    setAssistantState('processing');
    setTranscript(spokenText);

    // Short natural pause before processing
    setTimeout(() => {
      const match = matchVoiceCommand(spokenText, activeVoiceLang);
      if (match) {
        executeNavigation(match);
      } else {
        setAssistantState('not_understood');
        const notUnderstoodMsg = uiText.notUnderstood;
        setFeedbackMessage(notUnderstoodMsg);
        speakFeedback(notUnderstoodMsg, langConfig.bcp47);
      }
    }, 350);
  }, [activeVoiceLang, executeNavigation, langConfig.bcp47, speakFeedback, uiText.notUnderstood]);

  // Initialize Speech Recognition instance
  const initRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAssistantState('unsupported');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = langConfig.bcp47;
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setAssistantState('listening');
      setTranscript("");
      setFeedbackMessage("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          const finalVal = item[0].transcript;
          setTranscript(finalVal);
          processCommandText(finalVal);
        } else {
          interim += item[0].transcript;
          setTranscript(interim);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn("Voice assistant recognition error:", event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setAssistantState('mic_denied');
        setFeedbackMessage(uiText.micDenied);
      } else if (event.error === 'no-speech') {
        setAssistantState('idle');
      } else {
        setAssistantState('error');
        setFeedbackMessage(uiText.notUnderstood);
      }
    };

    recognition.onend = () => {
      if (assistantState === 'listening') {
        setAssistantState('idle');
      }
    };

    return recognition;
  }, [assistantState, langConfig.bcp47, processCommandText, uiText.micDenied, uiText.notUnderstood]);

  // Keep recognition updated with active language
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAssistantState('unsupported');
      return;
    }

    const rec = initRecognition();
    recognitionRef.current = rec;

    return () => {
      try {
        rec?.stop?.();
      } catch (e) {
        // cleanup safe
      }
    };
  }, [initRecognition]);

  // Start listening trigger
  const startListening = useCallback(() => {
    stopSpeaking();
    if (assistantState === 'unsupported') return;

    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = langConfig.bcp47;
        recognitionRef.current.start();
        setAssistantState('listening');
      } catch (err: any) {
        // If already started, restart
        try {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current?.start(), 150);
        } catch (e) {
          console.warn("Could not start recognition:", e);
        }
      }
    }
  }, [assistantState, initRecognition, langConfig.bcp47, stopSpeaking]);

  // Stop listening trigger
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // safe
      }
    }
    setAssistantState('idle');
  }, []);

  // Listen for global navbar voice assistant open events
  useEffect(() => {
    const handleOpenVoice = () => {
      setIsOpen(true);
      setTimeout(() => {
        startListening();
      }, 300);
    };

    window.addEventListener('agroarmor:open-voice', handleOpenVoice);
    return () => {
      window.removeEventListener('agroarmor:open-voice', handleOpenVoice);
    };
  }, [startListening]);

  const handleLanguageChange = (code: SupportedLanguage) => {
    setActiveVoiceLang(code);
    setAppLang(code); // synchronize website language
    setShowLanguageDropdown(false);
    stopSpeaking();

    // Reconfigure recognition language
    if (recognitionRef.current) {
      recognitionRef.current.lang = SUPPORTED_VOICE_LANGUAGES[code].bcp47;
    }
  };

  const toggleModal = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (!nextState) {
      stopListening();
      stopSpeaking();
      setTranscript("");
      setFeedbackMessage("");
      setAssistantState('idle');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans" id="voice-assistant-container">
      {/* Floating Modal Panel */}
      {isOpen && (
        <div 
          className="w-[92vw] max-w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-300"
          role="dialog"
          aria-label={uiText.assistantTitle}
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-4 text-white relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-base leading-snug tracking-tight">
                  {uiText.assistantTitle}
                </h3>
                <span className="text-[11px] text-emerald-100 font-medium">
                  {langConfig.nativeName} ({langConfig.name})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Audio Toggle */}
              <button
                type="button"
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className="p-2 rounded-xl hover:bg-white/20 text-white/90 transition-colors"
                title={ttsEnabled ? "Voice Feedback On" : "Voice Feedback Muted"}
                aria-label="Toggle Voice Audio Feedback"
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-60" />}
              </button>

              {/* Close Button */}
              <button 
                type="button"
                onClick={toggleModal}
                className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors"
                aria-label={uiText.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Language Selector Bar */}
          <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 font-bold">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{uiText.selectLanguage}:</span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm font-bold text-slate-800 hover:border-emerald-500 transition-all text-xs"
              >
                <span>{langConfig.nativeName}</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {/* Language Dropdown List */}
              {showLanguageDropdown && (
                <div className="absolute right-0 top-9 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 max-h-60 overflow-y-auto">
                  {(Object.keys(SUPPORTED_VOICE_LANGUAGES) as SupportedLanguage[]).map(langKey => {
                    const item = SUPPORTED_VOICE_LANGUAGES[langKey];
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => handleLanguageChange(item.code)}
                        className={cn(
                          "w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition-colors",
                          activeVoiceLang === item.code ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-700"
                        )}
                      >
                        <span>{item.nativeName}</span>
                        <span className="text-[10px] text-slate-400">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Assistant Body */}
          <div className="p-5 space-y-4 max-h-[380px] min-h-[220px] overflow-y-auto bg-slate-50/40">
            {/* Status Alert: Unsupported */}
            {assistantState === 'unsupported' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-medium">{uiText.unsupported}</p>
              </div>
            )}

            {/* Status Alert: Mic Denied */}
            {assistantState === 'mic_denied' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 flex items-start gap-3">
                <MicOff className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-medium">{uiText.micDenied}</p>
              </div>
            )}

            {/* Status Alert: Success Navigation */}
            {assistantState === 'success' && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 flex items-center gap-3 animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-emerald-900">{feedbackMessage}</p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">Navigating now...</p>
                </div>
                <Navigation className="w-4 h-4 text-emerald-600 animate-spin" />
              </div>
            )}

            {/* Status Alert: Not Understood / Try Again */}
            {assistantState === 'not_understood' && (
              <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs leading-snug">{feedbackMessage || uiText.notUnderstood}</p>
              </div>
            )}

            {/* Listening Soundwave Animation */}
            {assistantState === 'listening' && (
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <div className="relative">
                  <div className="absolute -inset-3 bg-red-500/25 rounded-full animate-ping" />
                  <div className="absolute -inset-1.5 bg-red-500/40 rounded-full animate-pulse" />
                  <div className="relative bg-red-600 p-5 rounded-full text-white shadow-xl flex items-center justify-center">
                    <Mic className="w-7 h-7" />
                  </div>
                </div>
                <p className="text-xs font-black text-red-600 uppercase tracking-widest animate-pulse">
                  {uiText.listening}
                </p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-8 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-1.5 h-5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                  <span className="w-1.5 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '600ms' }} />
                </div>
              </div>
            )}

            {/* Real-time recognized speech transcript bubble */}
            {transcript && assistantState !== 'success' && (
              <div className="flex justify-end">
                <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-none max-w-[85%] shadow-md">
                  <p className="text-xs font-semibold leading-relaxed">
                    &ldquo;{transcript}&rdquo;
                  </p>
                </div>
              </div>
            )}

            {/* Default Instruction Banner when Idle */}
            {assistantState === 'idle' && (
              <div className="text-center py-3">
                <p className="text-sm font-bold text-slate-800 mb-1">
                  {uiText.instruction}
                </p>
                <p className="text-[11px] text-slate-500">
                  Speak clearly in {langConfig.nativeName} or English.
                </p>
              </div>
            )}

            {/* Quick Action Chips (Tap or Read Aloud) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  {uiText.quickCommandsHeader}
                </span>
                <button
                  type="button"
                  onClick={() => setShowHelpGuide(!showHelpGuide)}
                  className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  Help
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {samplePhrases.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => processCommandText(phrase.text)}
                    className="flex items-center justify-between p-2.5 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl shadow-xs text-left transition-all group"
                  >
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 truncate">
                      {phrase.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-1 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Expanded Help Sheet */}
            {showHelpGuide && (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs space-y-2 mt-2">
                <h4 className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  How to speak to AgroArmor:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed">
                  <li><strong>Marketplace:</strong> Say &ldquo;Marketplace kholo&rdquo; or &ldquo;ಮಾರ್ಕೆಟ್ ತೆರೆಯಿರಿ&rdquo;</li>
                  <li><strong>Veterinary:</strong> Say &ldquo;Doctor page&rdquo; or &ldquo;ಪಶು ವೈದ್ಯರು&rdquo;</li>
                  <li><strong>Disease Scan:</strong> Say &ldquo;Check disease&rdquo; or &ldquo;ರೋಗ ಪರೀಕ್ಷೆ&rdquo;</li>
                  <li><strong>Animal GPS:</strong> Say &ldquo;Track my animal&rdquo; or &ldquo;ಜಿಪಿಎಸ್&rdquo;</li>
                  <li><strong>Go Back:</strong> Say &ldquo;Go back&rdquo; or &ldquo;ಹಿಂದೆ ಹೋಗಿ&rdquo;</li>
                </ul>
              </div>
            )}
          </div>

          {/* Primary Action Button (Big Farmer-Friendly Mic Button) */}
          <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
            <Button
              type="button"
              id="voice-assistant-main-mic-btn"
              onClick={assistantState === 'listening' ? stopListening : startListening}
              className={cn(
                "flex-1 h-14 font-black uppercase tracking-wider text-sm rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2",
                assistantState === 'listening' 
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse" 
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              {assistantState === 'listening' ? (
                <>
                  <MicOff className="w-5 h-5" />
                  {uiText.tapToStop}
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  {uiText.tapToSpeak}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Floating Microphone Trigger Button (Visible on mobile & desktop) */}
      <button
        type="button"
        id="voice-assistant-floating-btn"
        onClick={toggleModal}
        className={cn(
          "w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative group focus:outline-none focus:ring-4 focus:ring-emerald-400",
          isOpen ? "bg-slate-900 rotate-90 scale-95" : "bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95"
        )}
        aria-label="Open AgroArmor Voice Assistant"
      >
        {isOpen ? (
          <X className="w-7 h-7 text-white" />
        ) : (
          <>
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-25 group-hover:opacity-40" />
            <Mic className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            {/* Native language pill tag */}
            <span className="absolute -top-2 -left-2 bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md border border-white">
              {langConfig.nativeName}
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export default VoiceAssistant;
