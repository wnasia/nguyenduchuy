// Chấm điểm phát âm: so khớp từ giữa câu mẫu và bản ghi nhận dạng được.

export type WordResult = { word: string; ok: boolean };

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const tokenize = (s: string) => (normalize(s) ? normalize(s).split(" ") : []);

const levenshtein = (a: string, b: string) => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
};

const similar = (a: string, b: string) => {
  if (a === b) return 1;
  const d = levenshtein(a, b);
  return 1 - d / Math.max(a.length, b.length, 1);
};

export type Assessment = {
  words: WordResult[];
  accuracy: number;
  completeness: number;
  overall: number;
};

export function assessPronunciation(reference: string, hypothesis: string): Assessment {
  const ref = tokenize(reference);
  const hyp = tokenize(hypothesis);
  const used = new Array(hyp.length).fill(false);

  const words: WordResult[] = ref.map((w, i) => {
    // tìm từ khớp nhất trong cửa sổ lân cận để chịu được lệch thứ tự nhẹ
    let bestIdx = -1;
    let best = 0;
    for (let j = Math.max(0, i - 3); j < Math.min(hyp.length, i + 4); j++) {
      if (used[j]) continue;
      const s = similar(w, hyp[j]);
      if (s > best) {
        best = s;
        bestIdx = j;
      }
    }
    const ok = best >= 0.8;
    if (ok && bestIdx >= 0) used[bestIdx] = true;
    return { word: ref[i], ok };
  });

  const matched = words.filter((w) => w.ok).length;
  const accuracy = ref.length ? Math.round((matched / ref.length) * 100) : 0;
  const completeness = ref.length
    ? Math.round((Math.min(hyp.length, ref.length) / ref.length) * 100)
    : 0;
  const overall = Math.round(accuracy * 0.75 + completeness * 0.25);

  return { words, accuracy, completeness, overall };
}

// Thu âm PCM qua Web Audio và đóng gói thành WAV 16kHz mono (an toàn trên mọi trình duyệt)
export function encodeWav(chunks: Float32Array[], sampleRate: number, targetRate = 16000): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }

  const ratio = sampleRate / targetRate;
  const outLength = Math.floor(merged.length / ratio);
  const out = new Int16Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const s = Math.max(-1, Math.min(1, merged[Math.floor(i * ratio)] || 0));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const buffer = new ArrayBuffer(44 + out.length * 2);
  const view = new DataView(buffer);
  const writeStr = (pos: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(pos + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + out.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, out.length * 2, true);
  new Int16Array(buffer, 44).set(out);

  return new Blob([buffer], { type: "audio/wav" });
}
