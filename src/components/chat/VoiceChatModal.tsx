"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, Mic, MicOff, PhoneOff, AlertCircle, ShieldUser, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GeminiLiveClient } from "@/lib/ai/geminiLiveClient";

interface VoiceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  documentText: string;
  selectedVoice: string;
  onChatMessageSave?: (role: "user" | "assistant", content: string) => void;
}

export const VoiceChatModal: React.FC<VoiceChatModalProps> = ({
  isOpen,
  onClose,
  documentName,
  documentText,
  selectedVoice,
  onChatMessageSave,
}) => {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [sessionMessages, setSessionMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    const startSession = async () => {
      setStatus("connecting");
      setErrorMsg("");
      setTranscript("");
      setUserTranscript("");
      setSessionMessages([]);

      try {
        const res = await fetch("/api/gemini-token");
        if (!res.ok) {
          throw new Error("Failed to authenticate session.");
        }
        const data = await res.json();
        if (!data.key) {
          throw new Error("Voice API key is not available.");
        }

        const systemInstruction = `
You are the DocMind Voice Assistant. You are having a real-time, natural spoken conversation with the user about their document: "${documentName}".
Here is the text of the document you must ground your answers in:
---
${documentText.slice(0, 45000)}
---
Voice Guidelines:
- Provide concise, conversational spoken answers. Do not speak in markdown formatting or lists since this is spoken audio.
- Keep your answers direct and clear, as if you are reading them naturally.
- If the user asks about something not mentioned in the document, answer politely that you cannot find it in the document, but try to help based on general knowledge if appropriate, making it clear it's not in the file.
- Respond in the same language the user speaks.
        `;

        const client = new GeminiLiveClient({
          apiKey: data.key,
          systemInstruction,
          onStatusChange: (newStatus) => {
            setStatus(newStatus);
          },
          onAudioLevel: (level) => {
            setAudioLevel(level);
          },
          onTranscript: (text, isModel) => {
            if (isModel) {
              setTranscript((prev) => prev + text);
            }
          },
          onModelTurnComplete: (fullText) => {
            const cleanText = fullText.trim();
            if (cleanText) {
              setSessionMessages((prev) => [...prev, { role: "assistant", content: cleanText }]);
              onChatMessageSave?.("assistant", cleanText);
            }
            setTranscript("");
          },
          onError: (err) => {
            console.error("Voice Live Error:", err);
            setErrorMsg(err.message || "An error occurred during the voice session.");
            setStatus("error");
          },
        });

        clientRef.current = client;
        await client.connect();

        
        if (typeof window !== "undefined") {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = "en-US";
            rec.onresult = (e: any) => {
              setTranscript("");

              let interim = "";
              for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) {
                  const finalSpeech = e.results[i][0].transcript.trim();
                  if (finalSpeech) {
                    setUserTranscript(finalSpeech);
                    setTimeout(() => setUserTranscript(""), 4000);
                    setSessionMessages((prev) => [...prev, { role: "user", content: finalSpeech }]);
                    onChatMessageSave?.("user", finalSpeech);
                  }
                } else {
                  interim += e.results[i][0].transcript;
                  setUserTranscript(interim);
                }
              }
            };
            rec.onerror = (err: any) => {
              console.warn("Speech recognition error:", err);
            };
            rec.start();
            recognitionRef.current = rec;
          }
        }
      } catch (err: any) {
        console.error("Voice session setup error:", err);
        setErrorMsg(err.message || "Could not start voice session.");
        setStatus("error");
      }
    };

    startSession();

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [isOpen, documentName, documentText]);

  const handleToggleMute = () => {
    if (clientRef.current) {
      const muted = clientRef.current.toggleMute();
      setIsMuted(muted);

      if (recognitionRef.current) {
        if (muted) {
          try {
            recognitionRef.current.stop();
          } catch {}
        } else {
          try {
            recognitionRef.current.start();
          } catch {}
        }
      }
    }
  };

  const handleDisconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md overflow-hidden bg-[#f9f7f4]/95 border border-[#eae6df] rounded-3xl shadow-2xl p-8 flex flex-col items-center"
        >
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <button
            onClick={handleDisconnect}
            className="absolute top-4 right-4 p-2 text-foreground/40 hover:text-foreground rounded-full hover:bg-[#eae6df]/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 cursor-pointer" />
          </button>

          <div className="text-center mb-6 flex flex-col items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-primary bg-primary/8 rounded-full border border-primary/15 shadow-xs mb-3">
              <ShieldUser className="w-3.5 h-3.5 animate-pulse text-primary" /> 
              {status === "connected" ? `Connected with ${selectedVoice === "Aoede" ? "Sarah" : selectedVoice === "Kore" ? "Jessica" : selectedVoice === "Charon" ? "Adam" : "Eric"}` : "Live Voice Assistant"}
            </span>
            <h3 className="text-md font-black text-foreground line-clamp-1 px-4 leading-tight">
              {documentName}
            </h3>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            <AnimatePresence mode="popLayout">
              {status === "connecting" && (
                <motion.div
                  key="connecting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-foreground/50"
                >
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-3" />
                  <p className="text-sm font-bold animate-pulse">Connecting...</p>
                </motion.div>
              )}

              {status === "disconnected" && (
                <motion.div
                  key="disconnected"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-foreground/40"
                >
                  <AlertCircle className="w-12 h-12 text-foreground/30 mb-3" />
                  <p className="text-sm font-bold">Session Disconnected</p>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-red-600 text-center px-4"
                >
                  <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                  <p className="text-sm font-bold">Connection Failed</p>
                  <p className="text-xs text-foreground/50 mt-1 line-clamp-2">{errorMsg}</p>
                  <button
                    onClick={() => {
                      if (clientRef.current) clientRef.current.disconnect();
                      onClose();
                    }}
                    className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                  >
                    Close & Retry
                  </button>
                </motion.div>
              )}

              {status === "connected" && (
                <motion.div
                  key="connected"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/10"
                    animate={{
                      scale: isMuted ? 1.0 : 1.0 + audioLevel * 0.6,
                      opacity: isMuted ? 0.2 : 0.3 - audioLevel * 0.15,
                    }}
                    transition={{ type: "spring", stiffness: 100, damping: 10 }}
                  />
                  <motion.div
                    className="absolute w-32 h-32 rounded-full bg-blue-500/10"
                    animate={{
                      scale: isMuted ? 1.0 : 1.0 + audioLevel * 0.3,
                      opacity: isMuted ? 0.3 : 0.5 - audioLevel * 0.1,
                    }}
                    transition={{ type: "spring", stiffness: 120, damping: 12 }}
                  />

                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                      isMuted
                        ? "bg-[#eae6df] border-2 border-white text-foreground/40 shadow-sm"
                        : "bg-linear-to-tr from-primary to-indigo-500 text-white shadow-primary/20 shadow-xl"
                    }`}
                  >
                    {isMuted ? (
                      <MicOff className="w-8 h-8 text-foreground/30 animate-pulse" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </div>

                  
                  <div className="absolute -bottom-6 flex items-center gap-1.5 justify-center h-8 w-full">
                    {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                      <motion.div
                        key={bar}
                        className="w-1 bg-primary rounded-full animate-pulse"
                        animate={{
                          height: isMuted ? 4 : 4 + audioLevel * (bar === 4 ? 28 : bar === 3 || bar === 5 ? 20 : bar === 2 || bar === 6 ? 12 : 6),
                        }}
                        transition={{ type: "spring", stiffness: 350, damping: 15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-full flex-1 flex flex-col min-h-0 mb-6 bg-white/80 border border-[#eae6df] rounded-2xl p-3.5 shadow-2xs">
            <style>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #eae6df;
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #4f46e5/35;
              }
            `}</style>
            <span className="text-[10px] font-black uppercase text-foreground/45 tracking-wider mb-2 block border-b border-[#eae6df]/50 pb-1 text-left">
              Live Session Transcript
            </span>
            <div 
              className="flex-1 overflow-y-auto space-y-2.5 max-h-48 pr-1.5 custom-scrollbar flex flex-col"
              ref={(el) => {
                if (el) {
                  el.scrollTop = el.scrollHeight;
                }
              }}
            >
              {sessionMessages.length === 0 && !userTranscript && !transcript && (
                <div className="flex-1 flex items-center justify-center text-center py-6 text-foreground/30 text-xs font-semibold">
                  Start speaking to see real-time transcription...
                </div>
              )}
              {sessionMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    msg.role === "user" ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <span className="text-[9px] font-black text-foreground/30 mb-0.5">
                    {msg.role === "user" ? "You" : "DocMind"}
                  </span>
                  <div
                    className={`px-3 py-2 rounded-xl text-xs leading-relaxed font-semibold text-left ${
                      msg.role === "user"
                        ? "bg-primary text-white rounded-tr-none"
                        : "bg-[#eae6df]/35 border border-[#eae6df] text-foreground rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {userTranscript && (
                <div className="flex flex-col max-w-[85%] self-end items-end animate-pulse">
                  <span className="text-[9px] font-black text-primary mb-0.5">You (speaking...)</span>
                  <div className="px-3 py-2 rounded-xl text-xs leading-relaxed font-semibold bg-primary/10 border border-primary/20 text-primary rounded-tr-none text-left">
                    {userTranscript}
                  </div>
                </div>
              )}

              {transcript && (
                <div className="flex flex-col max-w-[85%] self-start items-start">
                  <span className="text-[9px] font-black text-indigo-500 mb-0.5">DocMind (responding...)</span>
                  <div className="px-3 py-2 rounded-xl text-xs leading-relaxed font-semibold bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-tl-none text-left">
                    {transcript}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={handleToggleMute}
              disabled={status !== "connected"}
              className={`p-4 rounded-full border transition-all cursor-pointer ${
                isMuted
                  ? "bg-red-50 border-red-150 text-red-600 hover:bg-red-100"
                  : "bg-white border-[#eae6df] text-foreground hover:bg-[#eae6df]/35 shadow-xs"
              } disabled:opacity-50 disabled:pointer-events-none`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={handleDisconnect}
              className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all active:scale-95 shadow-lg shadow-red-600/20 hover:shadow-red-500/35 cursor-pointer flex items-center justify-center"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
