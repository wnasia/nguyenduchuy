import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, ChevronLeft, ChevronRight, Volume2, Sparkles, Trophy, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { assessPronunciation, encodeWav, type Assessment } from "@/lib/pronunciation";

const SENTENCES = [
  "What's the weather like today?",
  "I would like to book a table for two, please.",
  "Could you please repeat that more slowly?",
  "She sells seashells by the seashore.",
  "Technology is changing the way we work and learn.",
  "I have been living in this city for three years.",
  "Thank you for your help, I really appreciate it.",
];

type Attempt = { transcript: string; result: Assessment };

const scoreTone = (n: number) =>
  n >= 80
    ? { text: "text-emerald-600", bg: "bg-emerald-500", soft: "bg-emerald-500/10", label: "Xịn xò!" }
    : n >= 60
      ? { text: "text-amber-600", bg: "bg-amber-500", soft: "bg-amber-500/10", label: "Ổn áp!" }
      : { text: "text-destructive", bg: "bg-destructive", soft: "bg-destructive/10", label: "Thử lại nha!" };

const PronunciationPracticeWidget = () => {
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Record<number, Attempt>>({});

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const srcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const pcmRef = useRef<Float32Array[]>([]);

  const reference = SENTENCES[index];
  const attempt = attempts[index];
  const doneList = Object.values(attempts);
  const done = doneList.length;
  const avg = done ? Math.round(doneList.reduce((s, a) => s + a.result.overall, 0) / done) : 0;
  const progressPct = (done / SENTENCES.length) * 100;

  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(reference);
    u.lang = "en-US";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const goto = (next: number) => {
    if (recording || loading) return;
    setError(null);
    window.speechSynthesis?.cancel();
    setIndex((next + SENTENCES.length) % SENTENCES.length);
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      srcRef.current = src;
      const node = ctx.createScriptProcessor(4096, 1, 1);
      nodeRef.current = node;
      pcmRef.current = [];
      node.onaudioprocess = (e) => {
        pcmRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      src.connect(node);
      node.connect(ctx.destination);
      setRecording(true);
    } catch {
      setError("Không truy cập được micro. Hãy cho phép quyền micro trong trình duyệt.");
    }
  };

  const stop = async () => {
    setRecording(false);
    const currentIndex = index;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    nodeRef.current?.disconnect();
    srcRef.current?.disconnect();
    const ctx = ctxRef.current;
    const rate = ctx?.sampleRate ?? 48000;
    const blob = encodeWav(pcmRef.current, rate);
    await ctx?.close();

    if (blob.size < 4096) {
      setError("Bản ghi quá ngắn, hãy đọc lại câu mẫu rõ ràng hơn.");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", blob, "recording.wav");
      const { data, error: fnError } = await supabase.functions.invoke("speech-assess", {
        body: form,
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      const text: string = data?.text ?? "";
      setAttempts((prev) => ({
        ...prev,
        [currentIndex]: {
          transcript: text,
          result: assessPronunciation(SENTENCES[currentIndex], text),
        },
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi khi chấm điểm phát âm.");
    } finally {
      setLoading(false);
    }
  };

  const tone = attempt ? scoreTone(attempt.result.overall) : null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/70 p-6 text-primary-foreground">
        <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="relative space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/20 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.14em]">
            <Sparkles className="h-3.5 w-3.5" />
            Speak &amp; Score
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            Nói to lên nào — điểm phát âm tính liền!
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-[14px] font-semibold">
              <Flame className="h-4 w-4" />
              {done}/{SENTENCES.length} câu
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-[14px] font-semibold">
              <Trophy className="h-4 w-4" />
              Điểm TB {avg}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary-foreground/20">
            <div
              className="h-full rounded-full bg-primary-foreground transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current sentence */}
      <div className="rounded-3xl border-2 border-dashed border-primary/30 bg-muted/30 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.14em] text-primary">
            Câu {index + 1}/{SENTENCES.length}
          </span>
          <Button variant="outline" size="sm" className="rounded-full font-semibold" onClick={speak}>
            <Volume2 className="h-4 w-4 mr-2" />
            Nghe mẫu
          </Button>
        </div>
        <p className="text-[22px] sm:text-[26px] font-extrabold leading-snug tracking-tight">
          {reference}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-11 w-11"
            aria-label="Câu trước"
            onClick={() => goto(index - 1)}
            disabled={recording || loading}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          {recording ? (
            <Button onClick={stop} variant="destructive" size="lg" className="rounded-full font-bold px-6">
              <Square className="h-4 w-4 mr-2" />
              Dừng &amp; chấm điểm
            </Button>
          ) : (
            <Button
              onClick={start}
              size="lg"
              disabled={loading}
              className="rounded-full font-bold px-7 shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03]"
            >
              <Mic className="h-4 w-4 mr-2" />
              {loading ? "Đang chấm điểm..." : attempt ? "Đọc lại" : "Bắt đầu đọc"}
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-11 w-11"
            aria-label="Câu tiếp"
            onClick={() => goto(index + 1)}
            disabled={recording || loading}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
          {recording && (
            <span className="flex items-center gap-2 text-[15px] font-semibold text-destructive">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
              Đang thu âm...
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-[15px] font-medium text-destructive">
          {error}
        </div>
      )}

      {attempt && tone && (
        <div className={`space-y-5 rounded-3xl border border-border/60 ${tone.soft} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-background shadow-sm">
              <span className={`text-3xl font-extrabold ${tone.text}`}>{attempt.result.overall}</span>
            </div>
            <div className="space-y-2">
              <div className={`text-xl font-extrabold ${tone.text}`}>{tone.label}</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Chính xác", value: attempt.result.accuracy },
                  { label: "Đầy đủ", value: attempt.result.completeness },
                ].map((s) => (
                  <span
                    key={s.label}
                    className="rounded-full bg-background px-3 py-1.5 text-[14px] font-semibold"
                  >
                    {s.label} <span className={scoreTone(s.value).text}>{s.value}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-background p-4 space-y-3">
            <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Chi tiết từng từ
            </div>
            <p className="flex flex-wrap gap-2 text-[18px] leading-relaxed">
              {attempt.result.words.map((w, i) => (
                <span
                  key={`${w.word}-${i}`}
                  className={
                    w.ok
                      ? "rounded-lg bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-600"
                      : "rounded-lg bg-destructive/10 px-2 py-0.5 font-bold text-destructive underline decoration-wavy decoration-destructive/60"
                  }
                >
                  {w.word}
                </span>
              ))}
            </p>
            <div className="text-[15px] text-muted-foreground">
              <span className="font-bold text-foreground">Bạn đã đọc: </span>
              {attempt.transcript.trim() || "(không nghe rõ)"}
            </div>
          </div>
        </div>
      )}

      {/* Sentence list */}
      <div className="space-y-3">
        <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Danh sách luyện tập
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {SENTENCES.map((s, i) => {
            const a = attempts[i];
            const at = a ? scoreTone(a.result.overall) : null;
            return (
              <button
                key={i}
                onClick={() => goto(i)}
                disabled={recording || loading}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left text-[15px] transition-all hover:-translate-y-0.5 ${
                  i === index
                    ? "border-primary bg-primary/5 font-semibold shadow-sm"
                    : "border-border/60 hover:border-primary/40"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                    at ? `${at.bg} text-background` : "bg-muted text-muted-foreground"
                  }`}
                >
                  {a ? a.result.overall : i + 1}
                </span>
                <span className="flex-1 truncate">{s}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PronunciationPracticeWidget;
