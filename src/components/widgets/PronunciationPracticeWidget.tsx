import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { assessPronunciation, encodeWav, type Assessment } from "@/lib/pronunciation";
import { Progress } from "@/components/ui/progress";

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

const scoreColor = (n: number) =>
  n >= 80 ? "text-emerald-600" : n >= 60 ? "text-amber-600" : "text-destructive";

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
  const done = Object.keys(attempts).length;

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

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-muted-foreground">
        Đọc to từng câu mẫu, hệ thống sẽ nhận dạng giọng nói và chấm điểm phát âm từng từ.
      </p>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[14px]">
          <span className="font-semibold">
            Câu {index + 1}/{SENTENCES.length}
          </span>
          <span className="text-muted-foreground">Đã luyện {done}/{SENTENCES.length} câu</span>
        </div>
        <Progress value={((index + 1) / SENTENCES.length) * 100} className="h-1.5" />
      </div>

      {/* Current sentence */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Câu mẫu
          </span>
          <Button variant="outline" size="sm" onClick={speak}>
            <Volume2 className="h-4 w-4 mr-2" />
            Nghe mẫu
          </Button>
        </div>
        <p className="text-[18px] leading-relaxed font-medium">{reference}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => goto(index - 1)} disabled={recording || loading}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Câu trước
        </Button>
        {recording ? (
          <Button onClick={stop} variant="destructive" size="lg">
            <Square className="h-4 w-4 mr-2" />
            Dừng & chấm điểm
          </Button>
        ) : (
          <Button onClick={start} size="lg" disabled={loading}>
            <Mic className="h-4 w-4 mr-2" />
            {loading ? "Đang chấm điểm..." : attempt ? "Đọc lại" : "Bắt đầu đọc"}
          </Button>
        )}
        <Button variant="outline" onClick={() => goto(index + 1)} disabled={recording || loading}>
          Câu tiếp
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        {recording && (
          <span className="flex items-center gap-2 text-[15px] text-destructive">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
            Đang thu âm...
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-[15px] text-destructive">
          {error}
        </div>
      )}

      {attempt && (
        <div className="space-y-4 rounded-xl border border-border/60 bg-background p-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Tổng điểm", value: attempt.result.overall },
              { label: "Chính xác", value: attempt.result.accuracy },
              { label: "Đầy đủ", value: attempt.result.completeness },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border/60 p-3">
                <div className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">
                  {s.label}
                </div>
                <div className={`text-2xl font-bold ${scoreColor(s.value)}`}>{s.value}</div>
                <Progress value={s.value} className="mt-2 h-1.5" />
              </div>
            ))}
          </div>

          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">
              Chi tiết từng từ
            </div>
            <p className="flex flex-wrap gap-x-2 gap-y-1 text-[18px] leading-relaxed">
              {attempt.result.words.map((w, i) => (
                <span
                  key={`${w.word}-${i}`}
                  className={
                    w.ok
                      ? "text-emerald-600 font-medium"
                      : "text-destructive font-semibold underline decoration-wavy decoration-destructive/60"
                  }
                >
                  {w.word}
                </span>
              ))}
            </p>
          </div>

          <div className="text-[15px] text-muted-foreground">
            <span className="font-semibold text-foreground">Bạn đã đọc: </span>
            {attempt.transcript.trim() || "(không nghe rõ)"}
          </div>
        </div>
      )}

      {/* Sentence list */}
      <div className="space-y-2">
        <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Danh sách luyện tập
        </div>
        <div className="flex flex-col gap-1">
          {SENTENCES.map((s, i) => {
            const a = attempts[i];
            return (
              <button
                key={i}
                onClick={() => goto(i)}
                disabled={recording || loading}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-[15px] transition-colors ${
                  i === index
                    ? "border-primary/50 bg-muted/50 font-medium"
                    : "border-border/60 hover:bg-muted/40"
                }`}
              >
                <span className="text-muted-foreground w-6 shrink-0">{i + 1}.</span>
                <span className="flex-1 truncate">{s}</span>
                {a && (
                  <span className={`shrink-0 font-semibold ${scoreColor(a.result.overall)}`}>
                    {a.result.overall}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PronunciationPracticeWidget;
