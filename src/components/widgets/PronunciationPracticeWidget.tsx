import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, RotateCcw, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { assessPronunciation, encodeWav, type Assessment } from "@/lib/pronunciation";
import { Textarea } from "@/components/ui/textarea";
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

const scoreColor = (n: number) =>
  n >= 80 ? "text-emerald-600" : n >= 60 ? "text-amber-600" : "text-destructive";

const PronunciationPracticeWidget = () => {
  const [reference, setReference] = useState(SENTENCES[0]);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [result, setResult] = useState<Assessment | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const srcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const pcmRef = useRef<Float32Array[]>([]);

  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(reference);
    u.lang = "en-US";
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const nextSentence = () => {
    const idx = SENTENCES.indexOf(reference);
    setReference(SENTENCES[(idx + 1 + SENTENCES.length) % SENTENCES.length] ?? SENTENCES[0]);
    setResult(null);
    setTranscript(null);
    setError(null);
  };

  const start = async () => {
    setError(null);
    setResult(null);
    setTranscript(null);
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
      setTranscript(text);
      setResult(assessPronunciation(reference, text));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi khi chấm điểm phát âm.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-muted-foreground">
        Đọc to câu mẫu bên dưới, hệ thống sẽ nhận dạng giọng nói và chấm điểm phát âm từng từ.
      </p>

      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Câu mẫu
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={speak}>
              <Volume2 className="h-4 w-4 mr-2" />
              Nghe mẫu
            </Button>
            <Button variant="ghost" size="sm" onClick={nextSentence}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Câu khác
            </Button>
          </div>
        </div>
        <Textarea
          value={reference}
          onChange={(e) => {
            setReference(e.target.value);
            setResult(null);
            setTranscript(null);
          }}
          rows={2}
          className="text-[18px] leading-relaxed font-medium bg-background"
        />
      </div>

      <div className="flex items-center gap-3">
        {recording ? (
          <Button onClick={stop} variant="destructive" size="lg">
            <Square className="h-4 w-4 mr-2" />
            Dừng & chấm điểm
          </Button>
        ) : (
          <Button onClick={start} size="lg" disabled={loading || !reference.trim()}>
            <Mic className="h-4 w-4 mr-2" />
            {loading ? "Đang chấm điểm..." : "Bắt đầu đọc"}
          </Button>
        )}
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

      {result && (
        <div className="space-y-4 rounded-xl border border-border/60 bg-background p-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Tổng điểm", value: result.overall },
              { label: "Chính xác", value: result.accuracy },
              { label: "Đầy đủ", value: result.completeness },
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
              {result.words.map((w, i) => (
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
            {transcript?.trim() || "(không nghe rõ)"}
          </div>
        </div>
      )}
    </div>
  );
};

export default PronunciationPracticeWidget;
