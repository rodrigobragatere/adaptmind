import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Brain,
  Music,
  BookOpen,
  MessageSquare,
  Trophy,
  Users,
  Settings,
  LogOut,
  Play,
  Pause,
  Send,
  Plus,
  Shield,
  Database,
  Sparkles,
  Zap,
  Layout,
  Heart,
  ClipboardCheck,
  CheckCircle,
  UploadCloud,
  Mic,
  X,
  Headphones,
  Calendar,
  Clock,
  Target,
  ListTodo,
  Gamepad2,
  Layers,
  RotateCw,
  Lightbulb,
  Loader2,
  Image as ImageIcon,
  MicOff,
  Trash2,
  Ban,
  BrainCircuit,
  Eye,
  Medal,
  Flame,
  Coins,
  Bot,
  Timer,
  StopCircle,
  ChevronUp,
  ChevronDown,
  Grid,
  Stethoscope,
  MapPin,
  Accessibility,
  Type,
  Move,
  MoveHorizontal,
  Ear,
  HandMetal,
  Fingerprint,
  RotateCcw,
  Coffee,
  Menu,
  PlayCircle,
  BarChart3,
  Lightbulb as IdeaIcon,
  Check,
  AlertTriangle,
  Info,
  Hourglass,
  ScanLine,
  Activity,
  FileText,
  Download,
  Upload,
  Share2,
  Square,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Sliders,
  Link as LinkIcon,
  Volume1,
  Radar,
  Save,
  Edit3,
  Badge as BadgeIcon,
  HelpCircle,
  Paperclip,
  Network,
} from "lucide-react";
import {
  JournalEntry,
  Post,
  MindMapNodeData,
  Flashcard,
  StorySegment,
  StudyPlan,
  ChatMessage,
  TeamMember,
  Badge,
  PodcastLine,
  User,
} from "../types";
import { Logo } from "./Logo";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReactFlow, { Background, Controls, MiniMap, Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import {
  callGeminiText,
  callGeminiJSON,
  ai,
  ensurePaidApiKey,
  generateAdaptiveSystemInstruction,
  generateNeuralAudio,
  createChatSession,
} from "../services/gemini";
import {
  LiveServerMessage,
  Modality,
  Chat,
  GenerateContentResponse,
  Type as GenAIType,
} from "@google/genai";
import { Pin } from "lucide-react";

// --- DATA ---
const COGNITIVE_QUESTIONS = [
  {
    id: 1,
    text: "Como você prefere absorver uma informação nova e complexa?",
    options: [
      {
        text: "Visualmente: Gráficos, diagramas, cores e mapas mentais.",
        icon: Eye,
        scores: { visual: 10, auditory: 2, kinesthetic: 2 },
      },
      {
        text: "Auditivamente: Ouvindo explicações, podcasts ou debatendo.",
        icon: Ear,
        scores: { visual: 2, auditory: 10, kinesthetic: 2 },
      },
      {
        text: "Cinestesicamente: Fazendo resumos à mão ou montando modelos.",
        icon: HandMetal,
        scores: { visual: 4, auditory: 2, kinesthetic: 10 },
      },
      {
        text: "Leitura/Escrita: Lendo textos estruturados e fazendo listas.",
        icon: BookOpen,
        scores: { visual: 8, auditory: 2, kinesthetic: 4 },
      },
      {
        text: "Multimodal: Variando estímulos (vídeo + prática) para não entediar.",
        icon: Layout,
        scores: { visual: 6, auditory: 6, kinesthetic: 6 },
      },
    ],
  },
  {
    id: 2,
    text: "Qual é o seu maior desafio na hora de começar uma tarefa?",
    options: [
      {
        text: "Paralisia: Sinto-me sobrecarregado e não sei o primeiro passo.",
        icon: Ban,
        scores: { focus: 2, resilience: 4 },
      },
      {
        text: "Procrastinação: Busco dopamina até o último minuto.",
        icon: Gamepad2,
        scores: { focus: 3, resilience: 3 },
      },
      {
        text: "Esquecimento: Se não estiver na minha frente, esqueço que existe.",
        icon: Eye,
        scores: { focus: 4, resilience: 5 },
      },
      {
        text: "Perfeccionismo: Medo de não fazer perfeito, então nem começo.",
        icon: Sparkles,
        scores: { focus: 8, resilience: 2 },
      },
      {
        text: "Impulsividade: Começo várias coisas e não termino nenhuma.",
        icon: Zap,
        scores: { focus: 5, resilience: 4 },
      },
    ],
  },
  {
    id: 3,
    text: "Como funciona o seu foco quando você gosta do assunto?",
    options: [
      {
        text: "Hiperfoco: O mundo desaparece, fico horas sem comer.",
        icon: Target,
        scores: { focus: 10, stamina: 8 },
      },
      {
        text: "Foco Dinâmico: Consigo estudar, mas preciso alternar tarefas.",
        icon: RotateCcw,
        scores: { focus: 6, stamina: 7 },
      },
      {
        text: "Foco Social: Preciso de alguém junto (body doubling).",
        icon: Users,
        scores: { focus: 5, stamina: 6 },
      },
      {
        text: "Foco Curto: Prefiro Tiros curtos (Pomodoro) de 15-20 min.",
        icon: Timer,
        scores: { focus: 4, stamina: 5 },
      },
      {
        text: "Foco por Pressão: Só funciono com o prazo estourando (Adrenalina).",
        icon: Flame,
        scores: { focus: 9, stamina: 4 },
      },
    ],
  },
  {
    id: 4,
    text: "O que mais te atrapalha no ambiente de estudo?",
    options: [
      {
        text: "Estímulos Sensoriais: Barulhos, luzes fortes ou texturas.",
        icon: Ear,
        scores: { sensitivity: 10 },
      },
      {
        text: "Desorganização Visual: Bagunça na mesa me trava.",
        icon: Layout,
        scores: { sensitivity: 8 },
      },
      {
        text: "Interrupções: Se me chamarem, demoro a voltar ao fluxo.",
        icon: MessageSquare,
        scores: { sensitivity: 7 },
      },
      {
        text: "Tédio: Silêncio absoluto me dá sono, preciso de ruído.",
        icon: Music,
        scores: { sensitivity: 4 },
      },
      {
        text: "Monotonia: Ficar sentado na mesma posição me agonia.",
        icon: Move,
        scores: { sensitivity: 6 },
      },
    ],
  },
  {
    id: 5,
    text: "Como é a sua percepção de tempo (Time Blindness)?",
    options: [
      {
        text: "Agora ou Nunca: Só percebo o tempo quando é urgente.",
        icon: Zap,
        scores: { planning: 2 },
      },
      {
        text: "Otimista: Sempre acho que vai dar tempo (e não dá).",
        icon: Clock,
        scores: { planning: 4 },
      },
      {
        text: "Ansiosa: Chego muito cedo por medo de atrasar.",
        icon: AlertTriangle,
        scores: { planning: 6 },
      },
      {
        text: "Presente: Perco a noção de dias ou horas facilmente.",
        icon: Hourglass,
        scores: { planning: 3 },
      },
      {
        text: "Metódica: Controlo cada minuto para não me perder.",
        icon: Calendar,
        scores: { planning: 10 },
      },
    ],
  },
];

// --- Helper Components ---
const LoadingState = ({ text }: { text: string }) => (
  <div
    className="flex flex-col items-center justify-center p-8 text-slate-400 animate-fadeIn w-full h-full"
    role="status"
  >
    <div className="relative">
      <div className="absolute inset-0 bg-teal-100 rounded-full animate-ping opacity-75"></div>
      <Loader2
        className="relative z-10 animate-spin text-teal-600 mb-4"
        size={48}
      />
    </div>
    <p className="font-medium text-lg text-slate-600">{text}</p>
  </div>
);

const EmptyState = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div
    className="h-full flex flex-col items-center justify-center text-slate-300"
    role="note"
  >
    <Icon size={64} className="mb-4 opacity-20" aria-hidden="true" />
    <p>{text}</p>
  </div>
);

const MedicalDisclaimer = () => (
  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg mt-4 text-sm animate-fadeIn">
    <div className="flex items-start gap-3">
      <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
      <div>
        <h4 className="font-bold text-amber-800">Aviso Importante</h4>
        <p className="text-amber-700">
          O AdaptMind é uma <strong>ferramenta educacional</strong> baseada em
          preferências de aprendizagem. As informações de "Compatibilidade
          Neurodivergente" são baseadas em padrões de estudo comuns e
          <strong>NÃO representam um diagnóstico médico ou clínico</strong>.
          Para diagnósticos de TDAH, Autismo, Dislexia ou outros, procure um
          neuropsicólogo ou médico especializado.
        </p>
      </div>
    </div>
  </div>
);

// --- READING MASK COMPONENT ---
export const ReadingMask = ({ active }: { active: boolean }) => {
  const [y, setY] = useState(0);

  useEffect(() => {
    if (!active) return;
    const handleMove = (e: MouseEvent) => setY(e.clientY);
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden h-screen w-screen"
      aria-hidden="true"
    >
      <div
        className="absolute top-0 left-0 w-full bg-black/70 transition-all duration-75 ease-out"
        style={{ height: Math.max(0, y - 60) }}
      ></div>
      <div
        className="absolute bottom-0 left-0 w-full bg-black/70 transition-all duration-75 ease-out"
        style={{ height: `calc(100vh - ${y + 60}px)` }}
      ></div>
      <div
        className="absolute w-full h-[120px] left-0 border-y-2 border-yellow-400/30 bg-yellow-400/5 mix-blend-overlay"
        style={{ top: y - 60 }}
      ></div>
    </div>
  );
};

// --- Top Music Bar ---
export const TopMusicBar = ({
  playlistId,
  onMenuClick,
  accessSettings,
  setAccessSettings,
}: {
  playlistId: string;
  onMenuClick?: () => void;
  accessSettings?: any;
  setAccessSettings?: (s: any) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [showAccessMenu, setShowAccessMenu] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"focus" | "break">("focus");

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const mainContent =
        document.querySelector("main")?.innerText || "Sem conteúdo para ler.";
      const utterance = new SpeechSynthesisUtterance(mainContent);
      utterance.lang = "pt-BR";
      utterance.rate = 1.1;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === "focus" ? 25 * 60 : 5 * 60);
  };

  const switchMode = () => {
    const newMode = mode === "focus" ? "break" : "focus";
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === "focus" ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const toggleExpand = () => {
    if (!isExpanded && !mediaLoaded) {
      setMediaLoaded(true);
    }
    setIsExpanded(!isExpanded);
  };

  const toggleAccessSetting = (key: string) => {
    if (setAccessSettings && accessSettings) {
      setAccessSettings({ ...accessSettings, [key]: !accessSettings[key] });
    }
  };

  const adjustFont = (delta: number) => {
    if (setAccessSettings && accessSettings) {
      setAccessSettings({
        ...accessSettings,
        fontSize: Math.max(0.8, Math.min(1.5, accessSettings.fontSize + delta)),
      });
    }
  };

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 flex flex-col shrink-0 transition-all duration-300 ease-in-out relative z-30">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white h-14 shadow-md relative">
        <div className="flex items-center gap-2 z-10">
          <button
            onClick={onMenuClick}
            className="md:hidden mr-2 text-slate-400 hover:text-white"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 text-sm font-bold text-teal-400">
            <Music
              size={16}
              className={isRunning ? "animate-pulse" : ""}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Zona de Foco</span>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center gap-3 bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700 shadow-inner backdrop-blur-sm z-20">
          <button
            onClick={switchMode}
            className={`transition hover:scale-110 ${mode === "focus" ? "text-teal-400" : "text-blue-400"}`}
            title={mode === "focus" ? "Modo Foco (25m)" : "Modo Pausa (5m)"}
            aria-label={
              mode === "focus" ? "Alternar para Pausa" : "Alternar para Foco"
            }
          >
            {mode === "focus" ? (
              <Brain size={16} aria-hidden="true" />
            ) : (
              <Coffee size={16} aria-hidden="true" />
            )}
          </button>
          <span
            className={`font-mono font-bold text-lg w-16 text-center ${mode === "focus" ? "text-white" : "text-blue-200"}`}
            role="timer"
          >
            {formatTime(timeLeft)}
          </span>
          <div className="h-4 w-px bg-slate-600 mx-1" aria-hidden="true"></div>
          <button
            onClick={toggleTimer}
            className="hover:text-teal-400 transition"
          >
            {isRunning ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
          </button>
          <button
            onClick={resetTimer}
            className="text-slate-500 hover:text-white transition"
            title="Reiniciar"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="relative">
            <button
              onClick={() => setShowAccessMenu(!showAccessMenu)}
              className={`transition hover:text-white ${showAccessMenu || accessSettings?.mask || accessSettings?.dyslexic ? "text-yellow-400" : "text-slate-400"}`}
            >
              <Accessibility size={20} />
            </button>
            {showAccessMenu && (
              <div className="absolute top-10 right-0 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-4 animate-fadeIn z-50 text-white">
                <h4 className="font-bold text-sm mb-4 text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Accessibility size={14} /> Acessibilidade
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm">
                      <Type size={16} /> Tamanho
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1">
                      <button
                        onClick={() => adjustFont(-0.1)}
                        className="p-1 hover:bg-slate-700 rounded"
                      >
                        A-
                      </button>
                      <span className="text-xs font-mono w-8 text-center">
                        {Math.round((accessSettings?.fontSize || 1) * 100)}%
                      </span>
                      <button
                        onClick={() => adjustFont(0.1)}
                        className="p-1 hover:bg-slate-700 rounded"
                      >
                        A+
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAccessSetting("dyslexic")}
                    className="w-full flex justify-between items-center text-sm p-2 rounded hover:bg-slate-700 transition"
                  >
                    <span className="flex items-center gap-2">
                      <Type size={16} /> Fonte Dislexia
                    </span>
                    <div
                      className={`w-8 h-4 rounded-full relative transition ${accessSettings?.dyslexic ? "bg-teal-500" : "bg-slate-600"}`}
                    >
                      <div
                        className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${accessSettings?.dyslexic ? "left-4.5" : "left-0.5"}`}
                        style={{
                          left: accessSettings?.dyslexic ? "18px" : "2px",
                        }}
                      ></div>
                    </div>
                  </button>
                  <button
                    onClick={() => toggleAccessSetting("mask")}
                    className="w-full flex justify-between items-center text-sm p-2 rounded hover:bg-slate-700 transition"
                  >
                    <span className="flex items-center gap-2">
                      <MoveHorizontal size={16} /> Régua de Leitura
                    </span>
                    <div
                      className={`w-8 h-4 rounded-full relative transition ${accessSettings?.mask ? "bg-teal-500" : "bg-slate-600"}`}
                    >
                      <div
                        className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all`}
                        style={{ left: accessSettings?.mask ? "18px" : "2px" }}
                      ></div>
                    </div>
                  </button>
                  <button
                    onClick={() => toggleAccessSetting("reducedMotion")}
                    className="w-full flex justify-between items-center text-sm p-2 rounded hover:bg-slate-700 transition"
                  >
                    <span className="flex items-center gap-2">
                      <Move size={16} /> Reduzir Movimento
                    </span>
                    <div
                      className={`w-8 h-4 rounded-full relative transition ${accessSettings?.reducedMotion ? "bg-teal-500" : "bg-slate-600"}`}
                    >
                      <div
                        className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all`}
                        style={{
                          left: accessSettings?.reducedMotion ? "18px" : "2px",
                        }}
                      ></div>
                    </div>
                  </button>
                  <div className="border-t border-slate-700 my-2"></div>
                  <button
                    onClick={toggleSpeech}
                    className={`w-full flex justify-between items-center text-sm p-2 rounded hover:bg-slate-700 transition ${isSpeaking ? "bg-slate-700 text-yellow-400" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      <Ear size={16} />{" "}
                      {isSpeaking ? "Parar Leitura" : "Ler Tela (TTS)"}
                    </span>
                    {isSpeaking && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={toggleExpand}
            className="text-slate-400 hover:text-white transition flex items-center gap-1 text-xs uppercase font-bold tracking-wider"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out bg-black ${isExpanded ? "h-[80px] opacity-100" : "h-0 opacity-0"}`}
        aria-hidden={!isExpanded}
      >
        {mediaLoaded ? (
          <iframe
            src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="block"
            title="Spotify Player"
          ></iframe>
        ) : (
          <button
            className="w-full h-full flex items-center justify-center text-slate-500 gap-2 cursor-pointer hover:text-white transition"
            onClick={() => setMediaLoaded(true)}
          >
            <PlayCircle size={24} /> <span>Carregar Player de Música</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Utils
function pcmToWav(
  pcmData: Uint8Array,
  sampleRate: number = 24000,
): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const totalSize = 36 + dataSize;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);
  const pcmBytes = new Uint8Array(buffer, 44);
  pcmBytes.set(pcmData);
  return buffer;
}
function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
function decodeBase64Audio(base64: string): Uint8Array {
  try {
    if (!base64) return new Uint8Array(0);
    let cleanBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");
    cleanBase64 = cleanBase64.replace(/\s/g, "");
    const pad = cleanBase64.length % 4;
    if (pad) cleanBase64 += "=".repeat(4 - pad);
    const binaryString = atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  } catch (e) {
    console.error("Base64 decode error:", e);
    return new Uint8Array(0);
  }
}
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(
    data.buffer,
    data.byteOffset,
    data.byteLength / 2,
  );
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
function createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = Math.max(-1, Math.min(1, data[i])) * 32768;
  }
  const buffer = new Uint8Array(int16.buffer);
  let binary = "";
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(buffer[i]);
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: "audio/pcm;rate=16000",
  };
}

export const LiveVoiceView = ({ notify }: any) => {
  const [connected, setConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const sessionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const decodeBase64Audio = (b64: string): Uint8Array => {
    try {
      const b64clean = b64.replace(/\s/g, "");
      const binary = atob(b64clean);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch (e) {
      console.error(e);
      return new Uint8Array();
    }
  };

  const playAudioChunk = (base64Audio: string) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const bytes = decodeBase64Audio(base64Audio);
    if (!bytes.length) return;

    try {
      const l = bytes.length / 2;
      const f32 = new Float32Array(l);
      const dataView = new DataView(bytes.buffer);
      for (let i = 0; i < l; i++) {
        f32[i] = dataView.getInt16(i * 2, true) / 32768;
      }

      const buffer = ctx.createBuffer(1, f32.length, 24000);
      buffer.getChannelData(0).set(f32);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const start = Math.max(ctx.currentTime, nextPlayTimeRef.current);
      source.start(start);
      nextPlayTimeRef.current = start + buffer.duration;
    } catch (err) {
      console.error(err);
    }
  };

  const connect = async () => {
    const hasKey = await ensurePaidApiKey();
    if (!hasKey) {
      notify("Chave da API necessária.", "error");
      return;
    }

    try {
      addLog("Iniciando conexão de áudio...");
      const ctx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = ctx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(ctx.destination);

      const liveSession = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: {
            parts: [{ text: "Você é um professor interativo, responda de forma muito concisa e ajude o aluno." }],
          },
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const au = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (au) playAudioChunk(au);
            if (message.serverContent?.interrupted) {
              nextPlayTimeRef.current = 0;
            }
          },
        },
      });
      sessionRef.current = liveSession;
      
      let isFirstMessage = true;

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current || isMuted) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(input);
        
        sessionRef.current.sendRealtimeInput([{
           mimeType: pcmBlob.mimeType,
           data: pcmBlob.data
        }]);
      };

      setConnected(true);
      addLog("Conexão estabelecida com sucesso.");
    } catch (err: any) {
      console.error(err);
      addLog(`Erro: ${err.message}`);
      disconnect();
    }
  };

  const disconnect = () => {
    sessionRef.current = null;
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    setConnected(false);
    addLog("Desconectado.");
  };

  useEffect(() => {
    return () => disconnect();
  }, []);

  return (
    <div className="p-6 h-full flex flex-col items-center justify-center space-y-8 bg-zinc-50 dark:bg-zinc-950 overflow-auto">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Conversa por Voz (Gemini Live)
        </h2>
        <p className="text-zinc-500 max-w-md mx-auto">
          Converse naturalmente com a IA em tempo real.
        </p>
      </div>

      <div className="flex bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-full p-4 items-center justify-center gap-6">
        {!connected ? (
          <button
            onClick={connect}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-6 transition-transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <Mic className="h-8 w-8" />
          </button>
        ) : (
          <>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`rounded-full p-6 transition-all shadow-md ${
                isMuted
                  ? "bg-rose-100 text-rose-600 hover:bg-rose-200"
                  : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
              }`}
            >
              {isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </button>
            <button
              onClick={disconnect}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-full p-6 transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <X className="h-8 w-8" />
            </button>
          </>
        )}
      </div>

      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 h-64 overflow-y-auto space-y-2">
        {logs.length === 0 && (
          <p className="text-zinc-400 text-center mt-20">Nenhum log disponível.</p>
        )}
        {logs.map((L, i) => (
          <div key={i} className="text-sm font-mono text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-1">
            {L}
          </div>
        ))}
      </div>
    </div>
  );
}

export const DashboardView = ({
  user,
  xp,
  level,
  setActiveView,
  journalEntries,
  posts,
  notify,
}: any) => {
  const recentEntry = useMemo(
    () => (journalEntries.length > 0 ? journalEntries[0] : null),
    [journalEntries],
  );
  const recentPosts = useMemo(() => posts.slice(0, 2), [posts]);
  const [isProfileExpanded, setIsProfileExpanded] = useState(true);

  const getNeuroAffinity = (profile: string, archetype: string) => {
    if (!profile) return null;
    const traits = [];
    if (profile.includes("Visual"))
      traits.push({
        label: "Processamento Visual",
        detail: "Comum em TDAH e Autismo",
      });
    if (profile.includes("Auditivo"))
      traits.push({
        label: "Processamento Auditivo",
        detail: "Aprendizado por diálogo",
      });
    if (profile.includes("Cinestésico"))
      traits.push({
        label: "Necessidade de Movimento",
        detail: "Alta afinidade com TDAH Hiperativo",
      });
    if (profile.includes("Multimodal"))
      traits.push({
        label: "Estímulo Dinâmico",
        detail: "Neuroplasticidade flexível",
      });
    if (archetype && archetype.includes("Hiperfoco"))
      traits.push({
        label: "Hiperfoco",
        detail: "Estado de fluxo intenso (TDAH/TEA)",
      });
    if (archetype && archetype.includes("Social"))
      traits.push({
        label: "Body Doubling",
        detail: "Estratégia social de foco",
      });
    return traits;
  };

  const getProfileDescription = (profileString: string) => {
    if (!profileString) return "Faça o teste para descobrir.";
    if (profileString.includes("Visual"))
      return "Seu cérebro processa informações através de **imagens**. Mapas mentais, vídeos e códigos de cores aumentam sua retenção.";
    if (profileString.includes("Auditivo"))
      return "Seu cérebro processa informações pelo **som**. Explicações orais, podcasts e ler em voz alta são essenciais.";
    if (profileString.includes("Cinestésico"))
      return "Seu cérebro aprende **fazendo**. Resumos manuais, movimento enquanto estuda e modelos físicos são cruciais.";
    if (profileString.includes("Leitura"))
      return "Seu cérebro gosta de **estrutura verbal**. Listas, textos organizados e leitura aprofundada são seu forte.";
    if (profileString.includes("Multimodal"))
      return "Seu cérebro precisa de **variedade**. Misture vídeos, textos e prática para manter o engajamento alto.";
    return "Estilo de aprendizado único.";
  };

  const neuroTraits = user.cognitiveProfile
    ? getNeuroAffinity(user.cognitiveProfile, user.archetype)
    : [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            Olá, {user.name} 👋
          </h2>
          <p className="text-slate-500">Vamos turbinar seu cérebro hoje?</p>
        </div>
        {user.cognitiveProfile && !isProfileExpanded && (
          <div className="flex gap-2">
            {user.archetype && (
              <div
                className="bg-indigo-100 px-4 py-2 rounded-full border border-indigo-200 shadow-sm flex items-center gap-2 text-sm text-indigo-800 font-bold"
                title="Seu Arquétipo de Aprendizado"
              >
                <Fingerprint size={16} className="text-indigo-600" />
                <span>{user.archetype}</span>
              </div>
            )}
            <div className="bg-white px-4 py-2 rounded-full border border-teal-200 shadow-sm flex items-center gap-2 text-sm text-slate-700">
              <BrainCircuit size={16} className="text-teal-500" />
              <span>
                Perfil:{" "}
                <strong className="text-teal-700">
                  {user.cognitiveProfile.split(":")[1]?.trim() || "Em análise"}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy size={64} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-sm uppercase font-bold tracking-wider mb-1">
              Nível {level}
            </p>
            <h3 className="text-3xl font-bold mb-2">{xp} XP</h3>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-yellow-400 h-full transition-all duration-1000"
                style={{ width: `${xp % 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Faltam {100 - (xp % 100)} XP para o próximo nível
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveView("live")}
          className="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-teal-500 hover:shadow-md transition text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-teal-50 rounded-bl-full opacity-20 transition-transform group-hover:scale-110"></div>
          <Mic className="text-teal-600 mb-3" size={32} />
          <h3 className="font-bold text-slate-800 text-lg">Conversa de Voz</h3>
          <p className="text-slate-500 text-sm">
            Pratique idiomas ou debata ideias falando.
          </p>
        </button>
        <button
          onClick={() => setActiveView("transformer")}
          className="group p-6 bg-white border border-slate-200 rounded-2xl hover:border-purple-500 hover:shadow-md transition text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-full opacity-20 transition-transform group-hover:scale-110"></div>
          <UploadCloud className="text-purple-600 mb-3" size={32} />
          <h3 className="font-bold text-slate-800 text-lg">AdaptCast Studio</h3>
          <p className="text-slate-500 text-sm">
            Transforme seus textos em podcasts.
          </p>
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6 animate-fadeIn">
        <div className="flex items-center gap-3 mb-4">
          <Target className="text-teal-600" size={24} />
          <h3 className="text-xl font-bold text-slate-800">Métrica de Ouro do Aprendizado</h3>
        </div>
        <p className="text-slate-600 mb-6 text-sm md:text-base">
          Para garantir o máximo desempenho, a neurociência recomenda o modelo <strong>80/20 de "Active Recall" (Recordação Ativa)</strong>. 
          Use este guia para distribuir seu tempo na plataforma:
        </p>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
             <div className="space-y-2">
                <div className="flex justify-between font-bold text-sm">
                   <span className="text-blue-700">Consumo Passivo</span>
                   <span className="text-blue-700">20%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4">
                   <div className="bg-blue-500 rounded-full h-4" style={{ width: '20%' }}></div>
                </div>
                <p className="text-xs text-slate-500">Ouvir Podcasts AdaptCast, Ler ou Assistir.</p>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between font-bold text-sm">
                   <span className="text-teal-700">Prática Ativa (Sugerido)</span>
                   <span className="text-teal-700">80%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 relative overflow-hidden">
                   <div className="bg-gradient-to-r from-teal-400 to-teal-500 rounded-full h-4 absolute top-0 left-0" style={{ width: '80%' }}></div>
                </div>
                <p className="text-xs text-slate-500">Flashcards IA, Quiz, Conversa de Voz (explicar para a IA).</p>
             </div>
          </div>
          <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-center text-sm text-slate-600">
            <p className="text-center">
              💡 <strong>Por que 80%?</strong> O cérebro forma memórias fortes ao <em>recuperar</em> informações (tentar lembrar), não ao <em>reler</em>. Use a maior parte do seu tempo testando a si mesmo nos programas da plataforma.
            </p>
          </div>
        </div>
      </div>

      {user.cognitiveProfile ? (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden transition-all duration-300">
          <div
            className="bg-indigo-50/50 p-4 flex justify-between items-center cursor-pointer hover:bg-indigo-50 transition"
            onClick={() => setIsProfileExpanded(!isProfileExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600">
                <Fingerprint size={24} />
              </div>
              <div>
                <h3 className="font-bold text-indigo-900">Seu Neuro-ID</h3>
                {user.archetype && (
                  <p className="text-xs text-indigo-600 font-medium">
                    {user.archetype}
                  </p>
                )}
              </div>
            </div>
            <button className="text-indigo-400 hover:text-indigo-700">
              {isProfileExpanded ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          </div>
          {isProfileExpanded && (
            <div className="p-6 border-t border-indigo-100 animate-slideIn">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-1">
                      Estilo de Aprendizagem
                    </h4>
                    <p className="text-xl font-bold text-slate-800">
                      {user.cognitiveProfile}
                    </p>
                  </div>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    {getProfileDescription(user.cognitiveProfile)}
                  </p>
                  {user.archetype && (
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                        <Sparkles size={14} /> Arquétipo: {user.archetype}
                      </h4>
                      <p className="text-sm text-indigo-700">
                        Uma combinação única de como você absorve informação e
                        como você mantém o foco.
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    Compatibilidade Neurodivergente
                  </h4>
                  {neuroTraits && neuroTraits.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {neuroTraits.map((trait: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100"
                        >
                          <div className="w-1.5 h-full min-h-[24px] bg-teal-400 rounded-full"></div>
                          <div>
                            <p className="font-bold text-slate-700 text-sm">
                              {trait.label}
                            </p>
                            <p className="text-xs text-slate-500">
                              {trait.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">
                      Faça o teste para ver suas afinidades neurais.
                    </p>
                  )}
                  <MedicalDisclaimer />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-8 text-white text-center shadow-lg">
          <BrainCircuit size={48} className="mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-2">Descubra seu Cérebro</h3>
          <p className="mb-6 opacity-90 max-w-lg mx-auto">
            Faça nosso mapeamento cognitivo rápido para adaptar toda a
            plataforma ao seu jeito de aprender.
          </p>
          <button
            onClick={() => setActiveView("test")}
            className="bg-white text-teal-600 px-8 py-3 rounded-full font-bold hover:bg-teal-50 transition shadow-md"
          >
            Iniciar Mapeamento
          </button>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-teal-500" /> Diário Recente
          </h3>
          {recentEntry ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-slate-600 italic mb-2 line-clamp-2">
                "{recentEntry.text}"
              </p>
              <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                <span>{recentEntry.date}</span>
                <button
                  onClick={() => setActiveView("journal")}
                  className="text-teal-600 font-bold hover:underline"
                >
                  Ler feedback
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p>Nenhum registro ainda.</p>
              <button
                onClick={() => setActiveView("journal")}
                className="text-teal-600 text-sm font-bold mt-2"
              >
                Escrever agora
              </button>
            </div>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-500" /> Comunidade
          </h3>
          <div className="space-y-3">
            {recentPosts.map((post: Post) => (
              <div
                key={post.id}
                className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${post.role === "admin" ? "bg-purple-500" : "bg-blue-500"}`}
                >
                  {post.user.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    {post.user}
                  </p>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {post.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActiveView("community")}
            className="w-full text-center text-sm text-blue-600 font-bold mt-4 hover:underline"
          >
            Ver tudo
          </button>
        </div>
      </div>
    </div>
  );
};

export const GamificationView = ({
  xp,
  level,
  coins,
  streak,
  badges,
}: {
  xp: number;
  level: number;
  coins: number;
  streak: number;
  badges: Badge[];
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Medal size={120} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Quadro de Conquistas</h2>
        <div className="flex gap-6 mt-4">
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold opacity-80">
              Nível Atual
            </span>
            <span className="text-4xl font-black">{level}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold opacity-80">
              XP Total
            </span>
            <span className="text-4xl font-black">{xp}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold opacity-80">
              Moedas
            </span>
            <span className="text-4xl font-black flex items-center gap-1">
              <Coins size={28} /> {coins}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold opacity-80">
              Ofensiva
            </span>
            <span className="text-4xl font-black flex items-center gap-1">
              <Flame size={28} /> {streak} dias
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`p-4 rounded-xl border-2 flex items-center gap-4 transition ${badge.unlocked !== false ? "bg-white border-teal-500 shadow-sm" : "bg-slate-100 border-slate-200 opacity-60 grayscale"}`}
          >
            <div className="text-3xl">{badge.icon}</div>
            <div>
              <h3 className="font-bold text-slate-800">{badge.name}</h3>
              <p className="text-xs text-slate-500">{badge.description}</p>
              {badge.unlocked === false && (
                <p className="text-xs text-teal-600 font-bold mt-1">
                  Requer {badge.requiredXp} XP
                </p>
              )}
            </div>
            {badge.unlocked !== false && (
              <div className="ml-auto text-teal-500">
                <CheckCircle size={20} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const UnifiedAIView = ({
  addXp,
  notify,
  agentPrompts,
  agentKnowledge,
  setActiveView,
  pdfContext,
  setPdfContext,
}: any) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const pdfFiles = files.filter((f) => f.type === "application/pdf");
    if (pdfFiles.length === 0) {
      notify("Apenas arquivos PDF são suportados no momento.", "error");
      return;
    }

    const newContexts: { name: string; data: string }[] = [];
    let loadedCount = 0;

    pdfFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        newContexts.push({ name: file.name, data: base64 });
        loadedCount++;
        if (loadedCount === pdfFiles.length) {
          setPdfContext((prev: any) => [...(prev || []), ...newContexts]);
          notify(
            `${pdfFiles.length} PDF(s) carregado(s) como contexto!`,
            "success",
          );
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)] animate-fadeIn">
      {/* Left Panel: Fontes (Sources) */}
      <div className="w-full md:w-1/3 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Layers size={18} className="text-indigo-600" /> Fontes
          </h3>
          <label className="cursor-pointer bg-white border border-slate-300 p-2 rounded-lg hover:bg-slate-100 transition shadow-sm" title="Adicionar Fonte">
            <UploadCloud size={16} className="text-slate-600" />
            <input
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {pdfContext && pdfContext.length > 0 ? (
            pdfContext.map((pdf: any, idx: number) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3 group"
              >
                <div className="bg-red-100 p-2 rounded-lg text-red-600 shrink-0">
                  <FileText size={20} />
                </div>
                <span className="text-sm font-medium text-slate-700 truncate flex-1 leading-tight">
                  {pdf.name}
                </span>
                <button
                  onClick={() =>
                    setPdfContext((prev: any) =>
                      prev.filter((_: any, i: number) => i !== idx),
                    )
                  }
                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center p-6 text-slate-400 flex flex-col items-center justify-center h-full">
              <UploadCloud size={48} className="mb-3 opacity-20" />
              <p className="text-sm">Nenhuma fonte adicionada.</p>
              <p className="text-xs mt-1">Carregue PDFs para começar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Center Panel: Estúdio (Studio) */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <BrainCircuit className="text-indigo-600" /> Guia do Estúdio
        </h2>

        {/* Audio Overview Like NotebookLM */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-6 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-1">
              <Headphones size={20} /> Visão Geral em Áudio
            </h3>
            <p className="text-indigo-700 text-sm">
              Gere um podcast (AdaptCast) onde dois especialistas discutem suas fontes.
            </p>
          </div>
          <button
            onClick={() => setActiveView("transformer")}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl shadow-md transition"
          >
            Gerar Podcast
          </button>
        </div>

        {/* Suggested Actions */}
        <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Ações Sugeridas</h4>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          <button
            onClick={() => setActiveView("summary")}
            className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 hover:border-yellow-500 hover:shadow-md transition text-left grou"
          >
            <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg shrink-0">
              <Zap size={20} />
            </div>
            <span className="font-bold text-slate-700 text-sm">Resumo Visual</span>
          </button>
          
          <button
            onClick={() => setActiveView("study_guide")}
            className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 hover:border-green-500 hover:shadow-md transition text-left group"
          >
            <div className="bg-green-100 text-green-600 p-2 rounded-lg shrink-0">
              <BookOpen size={20} />
            </div>
            <span className="font-bold text-slate-700 text-sm">Guia de Estudos</span>
          </button>

          <button
            onClick={() => setActiveView("exercises")}
            className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 hover:border-purple-500 hover:shadow-md transition text-left group"
          >
            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg shrink-0">
              <ClipboardCheck size={20} />
            </div>
            <span className="font-bold text-slate-700 text-sm">Gerar Exercícios</span>
          </button>

          <button
            onClick={() => setActiveView("timeline")}
            className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 hover:border-sky-500 hover:shadow-md transition text-left group"
          >
            <div className="bg-sky-100 text-sky-600 p-2 rounded-lg shrink-0">
              <Network size={20} />
            </div>
            <span className="font-bold text-slate-700 text-sm">Linha do Tempo</span>
          </button>
          
          <button
            onClick={() => setActiveView("mindmap")}
            className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 hover:border-orange-500 hover:shadow-md transition text-left group"
          >
            <div className="bg-orange-100 text-orange-600 p-2 rounded-lg shrink-0">
              <Brain size={20} />
            </div>
            <span className="font-bold text-slate-700 text-sm">Mapa Mental</span>
          </button>
        </div>

        {/* Chat input shortcut */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
           <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
             <MessageSquare size={18} className="text-teal-600" /> Chat com Fontes
           </h3>
           <p className="text-slate-500 text-sm mb-4">Tire dúvidas livremente sobre os documentos enviados.</p>
           <button onClick={() => setActiveView("ai")} className="w-full bg-slate-100 hover:bg-slate-200 text-left text-slate-500 p-4 rounded-xl border border-slate-200 cursor-text">
             Faça uma pergunta sobre as fontes...
           </button>
        </div>

      </div>
    </div>
  );
};

export const CognitiveTestView = ({
  user,
  setUser,
  setActiveView,
  addXp,
  notify,
}: any) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<any>({});

  const handleAnswer = (optionScores: any) => {
    const newScores = { ...scores };
    Object.entries(optionScores).forEach(([key, val]) => {
      newScores[key] = (newScores[key] || 0) + (val as number);
    });
    setScores(newScores);
    if (step < COGNITIVE_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      finishTest(newScores);
    }
  };

  const finishTest = async (finalScores: any) => {
    let profile = "Multimodal";
    let maxScore = 0;

    // Determine profile based on scores
    if (finalScores.visual > maxScore) {
      maxScore = finalScores.visual;
      profile = "Visual";
    }
    if (finalScores.auditory > maxScore) {
      maxScore = finalScores.auditory;
      profile = "Auditivo";
    }
    if (finalScores.kinesthetic > maxScore) {
      maxScore = finalScores.kinesthetic;
      profile = "Cinestésico";
    }

    // Archetype logic (simplified)
    let archetype = "Explorador Nato";
    if (profile === "Visual" && finalScores.focus > 5)
      archetype = "Visionário Imersivo";
    if (profile === "Auditivo" && finalScores.focus > 5)
      archetype = "Comunicador Analítico";

    const profileString = `Predominância: ${profile}`;

    const updatedUser = {
      ...user,
      cognitiveProfile: profileString,
      archetype: archetype,
    };
    setUser(updatedUser);
    localStorage.setItem("adaptmind_cognitive_profile", profileString);
    localStorage.setItem("adaptmind_archetype", archetype);

    addXp(100);
    notify("Perfil Calibrado com Sucesso!", "success");
    setActiveView("dashboard");
  };

  const currentQuestion = COGNITIVE_QUESTIONS[step];

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 animate-slideIn">
      <div className="mb-8 flex justify-between items-center">
        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Pergunta {step + 1} de {COGNITIVE_QUESTIONS.length}
        </span>
        <div className="w-1/3 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 transition-all duration-500"
            style={{
              width: `${((step + 1) / COGNITIVE_QUESTIONS.length) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-slate-800 mb-8 leading-tight">
        {currentQuestion.text}
      </h2>

      <div className="space-y-4">
        {currentQuestion.options.map((opt: any, index: number) => (
          <button
            key={index}
            onClick={() => handleAnswer(opt.scores)}
            className="w-full text-left p-5 rounded-xl border-2 border-slate-100 hover:border-teal-500 hover:bg-teal-50 transition-all duration-200 flex items-center gap-4 group bg-white"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-teal-500 group-hover:text-white transition-colors">
              <opt.icon size={20} />
            </div>
            <span className="text-lg font-medium text-slate-700 group-hover:text-teal-900">
              {opt.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const AdminView = ({
  user,
  notify,
  playlistId,
  setPlaylistId,
  agentPrompts,
  updateAgentPrompt,
  agentKnowledge,
  updateAgentKnowledge,
  theme,
  setTheme,
  team,
  setTeam,
  users,
  setUsers,
  customLogo,
  setCustomLogo,
}: any) => {
  const [activeTab, setActiveTab] = useState<
    "general" | "team" | "ai" | "users"
  >("general");
  const [driveUrl, setDriveUrl] = useState("");

  // --- LOGO UPLOAD LOGIC ---
  const handleDriveUrlSave = () => {
    if (!driveUrl) return;
    let finalUrl = driveUrl;
    // Match /d/ID/ or /d/ID or id=ID
    const match =
      driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
      driveUrl.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      // Standard Google Drive direct link format
      finalUrl = `https://drive.google.com/uc?id=${match[1]}`;
    }
    setCustomLogo(finalUrl);
    localStorage.setItem("adaptmind_logo", finalUrl);
    notify("Link da imagem salvo!", "success");
    setDriveUrl("");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      notify("Arquivo muito grande. Máx 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxSize = 150;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx?.clearRect(0, 0, width, height);
        ctx?.drawImage(img, 0, 0, width, height);

        // Force PNG to keep transparency
        const compressedBase64 = canvas.toDataURL("image/png");

        setCustomLogo(compressedBase64);
        localStorage.setItem("adaptmind_logo", compressedBase64);
        notify("Logo atualizado com sucesso!", "success");
        e.target.value = "";
      };
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setCustomLogo("");
    localStorage.removeItem("adaptmind_logo");
    notify("Logo removido. Usando padrão.", "info");
  };

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [newMember, setNewMember] = useState<Omit<TeamMember, "id">>({
    name: "",
    role: "",
    desc: "",
  });

  const addMember = () => {
    if (!newMember.name || !newMember.role) return;

    if (editingMemberId) {
      setTeam(
        team.map((m: any) =>
          m.id === editingMemberId ? { ...m, ...newMember } : m,
        ),
      );
      notify("Membro atualizado!", "success");
      setEditingMemberId(null);
    } else {
      setTeam([...team, { ...newMember, id: crypto.randomUUID() }]);
      notify("Membro adicionado!", "success");
    }
    setIsAddingMember(false);
    setNewMember({ name: "", role: "", desc: "" });
  };

  const startEditingMember = (member: any) => {
    setNewMember({ name: member.name, role: member.role, desc: member.desc });
    setEditingMemberId(member.id);
    setIsAddingMember(true);
  };

  const removeMember = (id: string) => {
    setTeam(team.filter((m: any) => m.id !== id));
    notify("Membro removido.", "info");
  };

  if (user.role !== "admin")
    return (
      <div className="text-center p-10 text-red-500 font-bold">
        Acesso Negado
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
        <Settings size={32} className="text-purple-600" /> Painel Administrativo
      </h2>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 font-bold border-b-2 transition ${activeTab === "general" ? "border-purple-600 text-purple-600" : "border-transparent text-slate-500"}`}
        >
          Geral
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2 font-bold border-b-2 transition ${activeTab === "team" ? "border-purple-600 text-purple-600" : "border-transparent text-slate-500"}`}
        >
          Equipe
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`px-4 py-2 font-bold border-b-2 transition ${activeTab === "ai" ? "border-purple-600 text-purple-600" : "border-transparent text-slate-500"}`}
        >
          Treinamento IA
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-bold border-b-2 transition ${activeTab === "users" ? "border-purple-600 text-purple-600" : "border-transparent text-slate-500"}`}
        >
          Usuários
        </button>
      </div>

      {activeTab === "general" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <ImageIcon size={20} /> Logo Personalizado
            </h3>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-slate-100 rounded-xl flex items-center justify-center border border-slate-300 overflow-hidden relative shrink-0">
                <Logo url={customLogo} className="w-full h-full" />
              </div>
              <div className="space-y-4 flex-1 w-full">
                <div>
                  <label className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 cursor-pointer inline-flex items-center gap-2 mb-1">
                    <UploadCloud size={18} /> Carregar Imagem Local
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                  <p className="text-xs text-slate-400">
                    <strong>100% Privado:</strong> Fica salvo apenas no seu
                    navegador (Máx 2MB)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Ou cole o link de uma imagem (Google Drive, ImgBB, etc)..."
                      className="w-full p-2 border rounded-lg text-sm bg-slate-50"
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      <strong>Atenção:</strong> O link precisa ser público. Para
                      logos privados, use o upload local acima.
                    </p>
                  </div>
                  <button
                    onClick={handleDriveUrlSave}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 text-sm h-10 self-start"
                  >
                    Salvar Link
                  </button>
                </div>

                {customLogo && (
                  <button
                    onClick={removeLogo}
                    className="text-red-500 text-sm font-bold hover:underline flex items-center gap-1 mt-2"
                  >
                    <Trash2 size={14} /> Remover Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Layout size={20} /> Tema da Interface
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setTheme("light")}
                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${theme === "light" ? "border-purple-500 bg-purple-50" : "border-slate-100"}`}
              >
                <div className="w-full h-4 bg-white border border-slate-200 rounded"></div>
                <span className="font-bold text-sm">Claro</span>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${theme === "dark" ? "border-purple-500 bg-slate-800 text-white" : "border-slate-100 bg-slate-900 text-slate-400"}`}
              >
                <div className="w-full h-4 bg-slate-700 border border-slate-600 rounded"></div>
                <span className="font-bold text-sm">Escuro</span>
              </button>
              <button
                onClick={() => setTheme("high-contrast")}
                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${theme === "high-contrast" ? "border-yellow-400 bg-black text-yellow-400" : "border-slate-100 bg-black text-slate-500"}`}
              >
                <div className="w-full h-4 bg-black border border-white rounded"></div>
                <span className="font-bold text-sm">Alto Contraste</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Music size={20} /> Playlist da Zona de Foco
            </h3>
            <div className="flex gap-2">
              <input
                value={playlistId}
                onChange={(e) => setPlaylistId(e.target.value)}
                placeholder="Cole o ID ou Link do Spotify..."
                className="flex-1 p-3 border rounded-xl bg-slate-50"
              />
              <button
                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold"
                onClick={() => {
                  let id = playlistId;
                  if (playlistId.includes("/playlist/")) {
                    id = playlistId.split("/playlist/")[1].split("?")[0];
                    setPlaylistId(id);
                  }
                  notify("Playlist atualizada!", "success");
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Membros da Equipe</h3>
            <button
              onClick={() => {
                setIsAddingMember(true);
                setEditingMemberId(null);
                setNewMember({ name: "", role: "", desc: "" });
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700"
            >
              <Plus size={18} /> Adicionar
            </button>
          </div>

          {isAddingMember && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-200 animate-slideIn">
              <h4 className="font-bold text-green-800 mb-2">
                {editingMemberId ? "Editar Membro" : "Novo Membro"}
              </h4>
              <input
                placeholder="Nome"
                className="w-full p-2 mb-2 rounded border"
                value={newMember.name}
                onChange={(e) =>
                  setNewMember({ ...newMember, name: e.target.value })
                }
              />
              <input
                placeholder="Cargo"
                className="w-full p-2 mb-2 rounded border"
                value={newMember.role}
                onChange={(e) =>
                  setNewMember({ ...newMember, role: e.target.value })
                }
              />
              <input
                placeholder="Descrição"
                className="w-full p-2 mb-2 rounded border"
                value={newMember.desc}
                onChange={(e) =>
                  setNewMember({ ...newMember, desc: e.target.value })
                }
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsAddingMember(false);
                    setEditingMemberId(null);
                  }}
                  className="text-slate-500 font-bold px-3"
                >
                  Cancelar
                </button>
                <button
                  onClick={addMember}
                  className="bg-green-600 text-white px-4 py-1 rounded font-bold"
                >
                  Salvar
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {team.map((member: any) => (
              <div
                key={member.id}
                className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-slate-800">{member.name}</p>
                  <p className="text-xs text-purple-600 font-bold uppercase">
                    {member.role}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditingMember(member)}
                    className="text-blue-500 hover:text-blue-700 p-2"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => removeMember(member.id)}
                    className="text-red-400 hover:text-red-600 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Brain size={20} className="text-purple-600" /> Instruções de Sistema e Conhecimento (IA)
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Ajuste as diretrizes e a base de conhecimento de cada módulo de IA separadamente.
            </p>
            
            <div className="space-y-8">
              {Object.keys(agentPrompts || {}).map((agentKey) => (
                <div key={agentKey} className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                  <h4 className="font-bold text-slate-800 uppercase mb-3 border-b pb-2 text-sm">
                    Agente: {agentKey}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        System Prompt (Diretrizes)
                      </label>
                      <textarea
                        rows={4}
                        className="w-full p-3 border rounded-lg text-sm"
                        value={agentPrompts[agentKey]}
                        onChange={(e) => updateAgentPrompt(agentKey, e.target.value)}
                        placeholder="Instruções de como a IA deve agir..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">
                        Base de Conhecimento (Contexto extra)
                      </label>
                      <textarea
                        rows={4}
                        className="w-full p-3 border rounded-lg text-sm bg-blue-50/50"
                        value={agentKnowledge?.[agentKey] || ""}
                        onChange={(e) => updateAgentKnowledge(agentKey, e.target.value)}
                        placeholder="Regras de negócio, referências..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-4">
               <button onClick={() => notify("Instruções IA salvas com sucesso!", "success")} className="bg-purple-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-purple-700">
                  Salvar Alterações
               </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <Users size={20} className="text-purple-600" /> Progresso dos Aprendizes
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-sm">
                    <th className="p-4">Nome</th>
                    <th className="p-4">Nível</th>
                    <th className="p-4">XP Total</th>
                    <th className="p-4">Dias Seguidos</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Membro desde</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {(users || []).map((u: any) => (
                    <tr key={u.id || u.uid} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-700">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email || "Sem e-mail"}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Trophy size={14} className="text-yellow-500" />
                          <span className="font-bold text-slate-700">{u.level || Math.floor((u.xp || 0) / 100) + 1}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-teal-600">{u.xp || 0} XP</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Flame size={14} className="text-orange-500" />
                          <span className="font-bold text-slate-700">{u.streak || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {u.status === 'blocked' ? 'Bloqueado' : 'Ativo'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-right">
                        {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString("pt-BR") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!users || users.length === 0) && (
                <div className="text-center p-8 text-slate-500">
                  Nenhum registro encontrado.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TeamView = ({ team }: { team: TeamMember[] }) => {
  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
        <Layout className="text-teal-600" size={32} /> Quem Faz Acontecer
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        {team.map((member) => (
          <div
            key={member.id}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-teal-500 transition group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl font-bold text-slate-500 group-hover:bg-teal-500 group-hover:text-white transition">
                {member.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  {member.name}
                </h3>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                  {member.role}
                </span>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              {member.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PartnerClinicsView = () => (
  <div className="animate-fadeIn max-w-5xl mx-auto">
    <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-3">
      <Stethoscope className="text-teal-600" size={32} /> Clínicas Parceiras
    </h2>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
        >
          <div className="h-32 bg-slate-200 flex items-center justify-center">
            <ImageIcon className="text-slate-400" size={32} />
          </div>
          <div className="p-6">
            <div className="flex gap-2 mb-2">
              <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">
                Psicologia
              </span>
              <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded">
                TDAH
              </span>
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-1">
              Clínica NeuroVida {i}
            </h3>
            <div className="flex items-center gap-1 text-yellow-500 text-sm mb-4">
              <BadgeIcon size={14} /> (4.9)
            </div>
            <button className="w-full py-2 border border-teal-600 text-teal-600 font-bold rounded-lg hover:bg-teal-50 transition">
              Agendar Consulta
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- RESTORED COMPONENTS ---

export const FocusSoundView = (props: any) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleNoise = () => {
    if (isPlaying) {
      sourceRef.current?.stop();
      setIsPlaying(false);
    } else {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      audioCtxRef.current = ctx;
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Brown Noise Math
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      noise.connect(ctx.destination);
      noise.start();
      sourceRef.current = noise;
      setIsPlaying(true);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center animate-fadeIn bg-slate-900 text-white">
      <h2 className="text-4xl font-bold mb-8">Foco Profundo</h2>
      <button
        onClick={toggleNoise}
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-700 ${isPlaying ? "bg-teal-500 shadow-[0_0_60px_rgba(20,184,166,0.5)] scale-110" : "bg-slate-700 hover:bg-slate-600"}`}
      >
        {isPlaying ? (
          <Pause size={48} fill="currentColor" />
        ) : (
          <Play size={48} fill="currentColor" className="ml-2" />
        )}
      </button>
      <p className="mt-8 text-slate-400 font-mono tracking-widest uppercase text-sm">
        {isPlaying ? "Ruído Marrom Ativo • Onda Teta" : "Toque para Focar"}
      </p>
    </div>
  );
};

export const FlashcardView = ({ addXp, notify }: any) => {
  const [topic, setTopic] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [pdfContext, setPdfContext] = useState<
    { name: string; data: string }[]
  >([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((f) => f.type === "application/pdf" || f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      notify("Por favor, envie documentos (PDF) ou imagens.", "error");
      return;
    }

    const newContexts: { name: string; data: string; mimeType: string }[] = [];
    let loadedCount = 0;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(",")[1];
        newContexts.push({ name: file.name, data: base64String, mimeType: file.type });
        loadedCount++;
        if (loadedCount === validFiles.length) {
          setPdfContext((prev: any) => [...(prev || []), ...newContexts]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const generateCards = async () => {
    if (!topic && pdfContext.length === 0) return;
    setLoading(true);
    
    let promptContents: any[] = [];
    
    if (topic) {
        promptContents.push({ text: `Crie 5 flashcards sobre "${topic}". Retorne JSON: [{"front": "Pergunta", "back": "Resposta"}].` });
    } else {
        promptContents.push({ text: `Crie 5 flashcards sobre o conteúdo do(s) documento(s)/imagem(ns) anexado(s). Retorne JSON: [{"front": "Pergunta", "back": "Resposta"}].` });
    }
    
    pdfContext.forEach((file: any) => {
        promptContents.push({
            inlineData: {
                data: file.data,
                mimeType: file.mimeType || "application/pdf",
            },
        });
    });

    try {
      const result = await callGeminiJSON<Flashcard[]>(promptContents);
      if (result) {
        setCards(result);
        addXp(20);
      }
    } catch (e) {
      notify("Erro.", "error");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex gap-2">
            <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Tema dos flashcards..."
            className="flex-1 p-3 border rounded-xl dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
            />
            <label className="cursor-pointer bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 p-3 px-5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition shadow-sm text-slate-600 dark:text-zinc-300 flex items-center justify-center gap-2" title="Anexar Arquivo">
                <UploadCloud size={20} />
                <span className="hidden sm:inline font-medium">Anexar</span>
                <input
                type="file"
                accept=".pdf,image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                />
            </label>
            <button
            onClick={generateCards}
            disabled={loading || (!topic && pdfContext.length === 0)}
            className="bg-blue-600 text-white px-6 rounded-xl font-bold disabled:opacity-50"
            >
            {loading ? "..." : "Gerar"}
            </button>
        </div>
        
        {pdfContext.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {pdfContext.map((pdf, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm">
                <FileText size={16} className="text-red-500" />
                <span className="truncate max-w-[200px]">{pdf.name}</span>
                <button 
                  onClick={() => setPdfContext(prev => prev.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="h-48 perspective-1000 cursor-pointer"
            onClick={() => setFlippedIndex(flippedIndex === i ? null : i)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flippedIndex === i ? "rotate-y-180" : ""}`}
            >
              <div className="absolute inset-0 backface-hidden bg-white p-6 rounded-xl border flex items-center justify-center text-center shadow-sm">
                <p className="font-medium text-slate-700">{card.front}</p>
              </div>
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-blue-50 p-6 rounded-xl border border-blue-200 flex items-center justify-center text-center shadow-sm">
                <p className="font-bold text-blue-800">{card.back}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StudyPlannerView = ({ user, addXp, notify }: any) => {
  const [goal, setGoal] = useState("");
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    if (!goal) return;
    setLoading(true);
    const prompt = `Crie um plano semanal para: "${goal}". Retorne JSON: {"tips": ["dica"], "schedule": [{"day": "Segunda", "tasks": ["tarefa"]}]}`;
    const result = await callGeminiJSON<StudyPlan>(prompt);
    if (result) {
      setPlan(result);
      addXp(30);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex gap-2">
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Objetivo de estudo..."
          className="flex-1 p-3 border rounded-xl"
        />
        <button
          onClick={generatePlan}
          disabled={loading}
          className="bg-green-600 text-white px-6 rounded-xl font-bold"
        >
          {loading ? "..." : "Planejar"}
        </button>
      </div>
      {plan && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {plan.schedule.map((day, i) => (
              <div
                key={i}
                className="bg-white border-l-4 border-green-500 p-4 rounded shadow-sm"
              >
                <h3 className="font-bold text-slate-800">{day.day}</h3>
                <ul className="list-disc ml-5 text-sm text-slate-600">
                  {day.tasks.map((t, j) => (
                    <li key={j}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="bg-yellow-50 p-6 rounded-2xl h-fit">
            <h3 className="font-bold text-yellow-800 mb-2">Dicas</h3>
            <ul className="text-sm text-yellow-900 space-y-2">
              {plan.tips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export const TransformerUploadView = ({ user, addXp, notify }: any) => {
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [pdfContext, setPdfContext] = useState<
    { name: string; data: string }[]
  >([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const pdfFiles = files.filter((f) => f.type === "application/pdf");
    if (pdfFiles.length === 0) {
      notify("Por favor, envie apenas arquivos PDF.", "error");
      return;
    }

    const newContexts: { name: string; data: string }[] = [];
    let loadedCount = 0;

    pdfFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(",")[1];
        newContexts.push({ name: file.name, data: base64String });
        loadedCount++;
        if (loadedCount === pdfFiles.length) {
          setPdfContext((prev: any) => [...(prev || []), ...newContexts]);
          notify(
            `${pdfFiles.length} arquivo(s) anexado(s) com sucesso!`,
            "success",
          );
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const generate = async () => {
    if (!text && pdfContext.length === 0) return;
    setLoading(true);
    setStatus("Preparando roteiro...");
    try {
      let promptPayload: any = `Crie um roteiro de podcast estilo "Deep Dive" (de 6 a 10 falas alternadas para garantir performance). Apresentadores: Alex e Bia. Eles devem discutir o conteúdo de forma natural, didática e com analogias.
      IMPORTANTE: Retorne APENAS um array JSON puro (sem explicações antes ou depois) seguindo exatamente este formato:
      [
        {"speaker": "Alex", "text": "..."},
        {"speaker": "Bia", "text": "..."}
      ]`;

      if (pdfContext.length > 0) {
        promptPayload = [
          promptPayload,
          text ? `Texto adicional: ${text}` : "",
          ...pdfContext.map((pdf) => ({
            inlineData: {
              data: pdf.data,
              mimeType: "application/pdf",
            },
          })),
        ].filter(Boolean);
      } else if (text) {
        promptPayload = `${promptPayload}\n\nConteúdo: ${text}`;
      }

      const scriptResponse = await callGeminiJSON<any>(promptPayload);
      if (!scriptResponse) {
        notify(
          "Erro: Falha na comunicação com a API de texto (callGeminiJSON retornou null).",
          "error",
        );
        setLoading(false);
        return;
      }

      let script: PodcastLine[] | null = null;
      if (Array.isArray(scriptResponse)) {
        script = scriptResponse;
      } else if (scriptResponse && typeof scriptResponse === "object") {
        // Tenta encontrar qualquer propriedade que seja um array
        const arrays = Object.values(scriptResponse).filter(Array.isArray);
        if (arrays.length > 0) {
          script = arrays[0] as PodcastLine[];
        }
      }

      if (script && Array.isArray(script)) {
        // Sanitize speakers
        const cleanScript = script.map((l) => ({
          speaker: l.speaker?.includes("Alex") ? "Alex" : "Bia",
          text: l.text || "",
        }));

        if (cleanScript.length === 0) {
          notify("Erro: O roteiro gerado está vazio.", "error");
          setLoading(false);
          return;
        }

        setStatus("Transformando texto em áudio...");
        try {
          const audioResult = await generateNeuralAudio(cleanScript);
          if (audioResult && audioResult.data) {
            let blob: Blob;
            if (audioResult.mimeType && audioResult.mimeType.includes("wav")) {
              // It's already WAV
              const bytes = decodeBase64Audio(audioResult.data);
              blob = new Blob([bytes], { type: audioResult.mimeType });
            } else if (
              audioResult.mimeType &&
              audioResult.mimeType.includes("mp3")
            ) {
              // It's MP3
              const bytes = decodeBase64Audio(audioResult.data);
              blob = new Blob([bytes], { type: audioResult.mimeType });
            } else {
              // Assume raw PCM and convert to WAV
              const bytes = decodeBase64Audio(audioResult.data);
              const wav = pcmToWav(bytes);
              blob = new Blob([wav], { type: "audio/wav" });
            }
            setAudioUrl(URL.createObjectURL(blob));
            addXp(50);
            setStatus("");
            notify("Podcast gerado com sucesso!", "success");
          } else {
            notify("Erro: A API de áudio não retornou dados válidos.", "error");
          }
        } catch (audioError: any) {
          console.error("Audio generation error:", audioError);
          notify(
            `Erro na geração de áudio: ${audioError.message || "Falha desconhecida"}`,
            "error",
          );
        }
      } else {
        notify(
          `Erro: Formato de roteiro inválido. Recebido: ${JSON.stringify(scriptResponse).substring(0, 50)}...`,
          "error",
        );
      }
    } catch (error: any) {
      console.error("Error generating podcast:", error);
      notify(
        `Erro geral: ${error.message || "Falha ao gerar o podcast."}`,
        "error",
      );
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        {pdfContext.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {pdfContext.map((pdf: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-purple-50 text-purple-700 p-2 rounded-lg text-sm w-fit"
              >
                <FileText size={16} />
                <span className="truncate max-w-[200px]">{pdf.name}</span>
                <button
                  onClick={() =>
                    setPdfContext((prev: any) =>
                      prev.filter((_: any, i: number) => i !== idx),
                    )
                  }
                  className="hover:text-purple-900"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Texto para podcast ou instruções adicionais..."
          className="w-full h-32 p-4 border rounded-xl mb-4"
        />
        <div className="flex gap-4 items-center">
          <label className="cursor-pointer bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition flex items-center gap-2">
            <Paperclip size={18} /> Anexar PDF
            <input
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <button
            onClick={generate}
            disabled={loading || (!text && pdfContext.length === 0)}
            className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {status || "Gerando..."}
              </>
            ) : (
              "Criar Podcast"
            )}
          </button>
        </div>
      </div>
      {audioUrl && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <span className="font-bold text-slate-700">Podcast Gerado</span>
          <audio controls src={audioUrl} className="h-10" />
        </div>
      )}
    </div>
  );
};

export const JournalView = ({
  addXp,
  journalEntries,
  setJournalEntries,
  notify,
  basePrompt,
}: any) => {
  const [entry, setEntry] = useState("");
  const save = async () => {
    if (!entry) return;
    const feedback = await callGeminiText(
      entry,
      basePrompt + " Dê feedback curto e empático.",
    );
    setJournalEntries([
      {
        id: crypto.randomUUID(),
        text: entry,
        feedback,
        date: new Date().toLocaleDateString(),
        time: "",
      },
      ...journalEntries,
    ]);
    setEntry("");
    addXp(10);
  };
  return (
    <div className="grid md:grid-cols-2 gap-6 animate-fadeIn h-[calc(100vh-140px)]">
      <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col">
        <textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="Querido diário..."
          className="flex-1 p-4 border rounded-xl resize-none mb-4"
        />
        <button
          onClick={save}
          disabled={!entry}
          className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold"
        >
          Salvar
        </button>
      </div>
      <div className="overflow-y-auto space-y-4">
        {journalEntries.map((e: any) => (
          <div key={e.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border dark:border-slate-700">
            <p className="text-slate-700 dark:text-slate-200 mb-2">{e.text}</p>
            <div className="bg-teal-50/50 dark:bg-teal-900/30 p-4 rounded-xl text-sm text-teal-900 dark:text-teal-100 border border-teal-100 dark:border-teal-800 prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-headings:font-bold prose-a:text-teal-600 dark:prose-a:text-teal-400 prose-strong:text-teal-950 dark:prose-strong:text-teal-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{e.feedback}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CommunityView = ({ posts, setPosts, user, addXp }: any) => {
  const [text, setText] = useState("");
  const post = () => {
    if (!text) return;
    setPosts([
      {
        id: crypto.randomUUID(),
        user: user.name,
        role: user.role,
        content: text,
        likes: 0,
        comments: 0,
      },
      ...posts,
    ]);
    setText("");
    addXp(5);
  };
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Compartilhe algo..."
          className="w-full p-2 border rounded-lg mb-2"
        />
        <button
          onClick={post}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold"
        >
          Postar
        </button>
      </div>
      {posts.map((p: any) => (
        <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold">{p.user}</span>
            {p.role === "admin" && (
              <span className="bg-purple-100 text-purple-700 text-xs px-2 rounded">
                Admin
              </span>
            )}
          </div>
          <p className="text-slate-700">{p.content}</p>
        </div>
      ))}
    </div>
  );
};

// --- GENERIC AGENT COMPONENT (Para Tutor, Simplificador, etc.) ---
const GenericAgentChatView = ({
  addXp,
  notify,
  basePrompt,
  agentKnowledge,
  title,
  icon: Icon,
  color,
  setActiveView,
  pdfContext,
  setPdfContext,
  onDataGenerated,
  customPlaceholder,
  systemInstructionModifier,
  autoTriggerText,
  autoButtonLabel,
}: any) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatSession = useRef<Chat | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const pdfFiles = files.filter((f) => f.type === "application/pdf");
    if (pdfFiles.length === 0) {
      notify("Por favor, envie apenas arquivos PDF.", "error");
      return;
    }

    const newContexts: { name: string; data: string }[] = [];
    let loadedCount = 0;

    pdfFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(",")[1];
        newContexts.push({ name: file.name, data: base64String });
        loadedCount++;
        if (loadedCount === pdfFiles.length && setPdfContext) {
          setPdfContext((prev: any) => [...(prev || []), ...newContexts]);
          notify(
            `${pdfFiles.length} PDF(s) anexado(s) com sucesso!`,
            "success",
          );
        }
      };
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    let instruction = `${basePrompt} Base de conhecimento: ${agentKnowledge}`;
    if (pdfContext && pdfContext.length > 0) {
      const fileNames = pdfContext.map((p: any) => `"${p.name}"`).join(", ");
      instruction += `\n\nO usuário carregou os seguintes documentos PDF como contexto adicional: ${fileNames}. Use as informações destes documentos para enriquecer suas respostas quando relevante.`;
    }
    if (systemInstructionModifier) {
      instruction += `\n\n${systemInstructionModifier}`;
    }
    chatSession.current = createChatSession(instruction);
  }, [basePrompt, agentKnowledge, pdfContext, systemInstructionModifier]);

  const send = async () => {
    if (!input.trim() || !chatSession.current) return;
    const text = input;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setLoading(true);

    try {
      // Multimodal support: if pdfContext exists, send it with the first message or every message?
      // Usually, sending it with every message in a session is fine if it's small,
      // but Gemini sessions remember context. However, for simplicity and ensuring it's always there:
      const parts: any[] = [{ text }];
      if (pdfContext && pdfContext.length > 0) {
        pdfContext.forEach((pdf: any) => {
          parts.push({
            inlineData: {
              data: pdf.data,
              mimeType: "application/pdf",
            },
          });
        });
      }

      const result = await chatSession.current.sendMessage({ message: parts });
      const rawText = result.text || "";

      // Check for MINDMAP_DATA
      if (onDataGenerated && rawText.includes("<MINDMAP_DATA>")) {
        const match = rawText.match(/<MINDMAP_DATA>([\s\S]*?)<\/MINDMAP_DATA>/);
        if (match && match[1]) {
          try {
            const data = JSON.parse(match[1]);
            onDataGenerated(data);
          } catch (e) {
            console.warn("Failed to parse visual data:", e);
          }
        }
      }

      setMessages((prev) => [...prev, { sender: "bot", text: rawText }]);
    } catch (e: any) {
      console.error("Nexus Chat Error:", e);
      const msg = e.message || "";
      let userMsg = "Erro ao conectar com a IA.";
      if (msg.includes("API key"))
        userMsg = "Erro: Chave de API inválida ou ausente.";
      if (msg.includes("403"))
        userMsg = "Erro: Acesso negado (Verifique cota ou região).";

      setMessages((prev) => [...prev, { sender: "bot", text: userMsg }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border overflow-hidden animate-fadeIn">
      <div
        className={`p-4 border-b flex items-center gap-3 ${color.replace("text-", "bg-").replace("600", "50")}`}
      >
        <button
          onClick={() => setActiveView("nexus")}
          className="mr-2 text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={24} />
        </button>
        <Icon className={color} size={24} />
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-slate-400 mt-10 p-6">
            <Icon size={48} className={`mb-4 opacity-50 ${color}`} />
            <p className="font-medium text-lg text-slate-600 mb-2">
              Olá! Eu sou o {title}.
            </p>
            <p className="text-sm text-center max-w-md mb-6">
              Envie um documento PDF (botão de clipe abaixo) ou digite sobre o que você deseja conversar.
            </p>
            {autoTriggerText && (
              <button
                onClick={() => {
                  const textToSend = autoTriggerText;
                  setMessages([{ sender: "user", text: textToSend }]);
                  setLoading(true);
                  if (!chatSession.current) {
                    setTimeout(() => {
                      // fallback to input if not ready
                      setInput(autoTriggerText);
                    }, 500);
                  } else {
                    const runAuto = async () => {
                      try {
                        const parts: any[] = [{ text: textToSend }];
                        if (pdfContext && pdfContext.length > 0) {
                          pdfContext.forEach((pdf: any) => {
                            parts.push({ inlineData: { data: pdf.data, mimeType: "application/pdf" } });
                          });
                        }
                        const result = await chatSession.current!.sendMessage({ message: parts });
                        setMessages((prev) => [...prev, { sender: "bot", text: result.text || "" }]);
                      } catch (e) {
                        setMessages((prev) => [...prev, { sender: "bot", text: "Erro ao gerar." }]);
                      }
                      setLoading(false);
                    };
                    runAuto();
                  }
                }}
                className={`px-6 py-2 rounded-xl text-white font-bold shadow-sm transition ${color.replace("text-", "bg-")} hover:opacity-90`}
              >
                {autoButtonLabel || `Gerar ${title} Agora`}
              </button>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-5 rounded-2xl shadow-sm ${m.sender === "user" ? "bg-indigo-600 dark:bg-indigo-700 text-white rounded-tr-none" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none"}`}
            >
              {m.sender === "user" ? (
                m.text
              ) : (
                <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-headings:font-bold prose-headings:text-slate-800 dark:prose-headings:text-white prose-a:text-indigo-600 hover:prose-a:text-indigo-500 dark:prose-a:text-indigo-400 dark:hover:prose-a:text-indigo-300 prose-strong:text-indigo-900 dark:prose-strong:text-indigo-200 prose-ul:list-disc prose-ol:list-decimal prose-li:my-1 marker:text-indigo-500 dark:marker:text-indigo-400">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-slate-400 text-sm animate-pulse">
            Digitando...
          </div>
        )}
      </div>
      <div className="p-4 border-t flex flex-col gap-2">
        {pdfContext && pdfContext.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pdfContext.map((pdf: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-blue-50 text-blue-700 p-2 rounded-lg text-sm w-fit"
              >
                <FileText size={16} />
                <span className="truncate max-w-[200px]">{pdf.name}</span>
                <button
                  onClick={() =>
                    setPdfContext &&
                    setPdfContext((prev: any) =>
                      prev.filter((_: any, i: number) => i !== idx),
                    )
                  }
                  className="hover:text-blue-900"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-center">
          <label className="cursor-pointer text-slate-400 hover:text-blue-600 transition p-2">
            <Paperclip size={20} />
            <input
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && send()}
            placeholder={customPlaceholder || "Digite sua mensagem..."}
            className="flex-1 p-3 border rounded-xl"
          />
          <button
            onClick={send}
            disabled={loading}
            className="bg-blue-600 text-white p-3 rounded-xl"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Agent Wrappers ---
export const AIChatView = (props: any) => (
  <GenericAgentChatView
    {...props}
    title="Tutor Pessoal (Chat)"
    icon={Bot}
    color="text-teal-600"
  />
);
export const SummaryView = (props: any) => (
  <GenericAgentChatView
    {...props}
    title="Resumo Visual"
    icon={Zap}
    color="text-yellow-600"
    customPlaceholder="Gerar resumo do contexto..."
    autoTriggerText="Gere um Resumo Visual completo e bem formatado com as informações do documento."
  />
);
export const StudyGuideView = (props: any) => (
  <GenericAgentChatView
    {...props}
    title="Guia de Estudos"
    icon={BookOpen}
    color="text-green-600"
    customPlaceholder="Gerar guia de estudos..."
    autoTriggerText="Gere um Guia de Estudos interativo com base no contexto anexado."
  />
);
export const ExercisesView = (props: any) => (
  <GenericAgentChatView
    {...props}
    title="Exercícios Práticos"
    icon={ClipboardCheck}
    color="text-purple-600"
    customPlaceholder="Criar lista de exercícios..."
    autoTriggerText="Gere uma lista de exercícios práticos com base neste conteúdo, escondendo o gabarito no final."
  />
);
export const TimelineView = (props: any) => (
  <GenericAgentChatView
    {...props}
    title="Linha do Tempo"
    icon={Network}
    color="text-sky-600"
    customPlaceholder="Mapear cronologia dos eventos..."
    autoTriggerText="Gere a Linha do Tempo / Cronologia baseada nos acontecimentos do documento."
  />
);
export const MindMapView = (props: any) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onMindMapGenerated = (data: MindMapNodeData) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    let idCounter = 1;

    // Build the nodes & edges flat list first
    const buildGraph = (
      node: MindMapNodeData,
      parentId: string | null = null,
      level: number = 0,
    ) => {
      const id = `node-${idCounter++}`;
      newNodes.push({
        id,
        data: { label: node.label },
        position: { x: 0, y: 0 },
        style: {
          background: level === 0 ? "#4f46e5" : level === 1 ? "#0ea5e9" : "#f8fafc",
          color: level < 2 ? "white" : "#1e293b",
          borderRadius: "12px",
          padding: "10px",
          fontWeight: "bold",
          border: "2px solid #e2e8f0",
          width: 150,
          textAlign: "center" as any
        },
      });

      if (parentId) {
        newEdges.push({
          id: `edge-${parentId}-${id}`,
          source: parentId,
          target: id,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#94a3b8", strokeWidth: 2 },
        });
      }

      if (node.children) {
        node.children.forEach((child) => {
          buildGraph(child, id, level + 1);
        });
      }
    };

    if (data) buildGraph(data);

    // Layout using dagre
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'LR', align: 'UL', nodesep: 50, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));

    newNodes.forEach((node) => {
      g.setNode(node.id, { width: 150, height: 50 });
    });

    newEdges.forEach((edge) => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    newNodes.forEach((node) => {
      const nodeWithPosition = g.node(node.id);
      node.position = {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 25,
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      <div className="flex-1 min-h-[400px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 relative overflow-hidden">
        {nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            nodesConnectable={false}
            nodesDraggable={true}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <Network size={64} className="mb-4 opacity-20" />
            <p className="font-medium">O seu mapa mental visual aparecerá aqui.</p>
            <p className="text-sm">Peça ao AdaptMind para estruturar um tema!</p>
          </div>
        )}
      </div>

      <div className="h-[400px]">
        <GenericAgentChatView
          {...props}
          title="Mapa Mental (Inteligente)"
          icon={Network}
          color="text-orange-600"
          onDataGenerated={onMindMapGenerated}
          customPlaceholder="Ex: Desenhe um mapa sobre fotossíntese..."
          autoTriggerText="Gere um mapa mental extraindo as ideias centrais e ramificações do documento."
          systemInstructionModifier={'IMPORTANTE: Quando responder, você DEVE EXIGIR MÁXIMA CONCISÃO (palavras-chave apenas, limite de ramos) e incluir no final da sua resposta um bloco JSON puro entre as tags <MINDMAP_DATA> e </MINDMAP_DATA>. O JSON deve seguir este formato: { "label": "Tema (Curto)", "children": [ { "label": "Subtema 1", "children": [] } ] }. Não coloque nada além do JSON dentro das tags.'}
        />
      </div>
    </div>
  );
};

// --- Dummy for ApiDoc only ---
export const ApiDocView = () => (
  <EmptyState icon={Database} text="Documentação da API em manutenção." />
);
