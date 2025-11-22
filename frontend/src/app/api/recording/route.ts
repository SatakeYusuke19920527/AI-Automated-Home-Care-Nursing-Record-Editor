import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

type RecordingPayload = {
  transcript?: string | null;
  durationMs?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RecordingPayload;
    if (!body?.transcript) {
      return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
    }

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    const baseName = `recording-${y}${m}${d}-${hh}${mm}${ss}`;
    const mdFile = `${baseName}.md`;

    const mdDir = path.join(process.cwd(), 'src', 'recording');
    const mdTarget = path.join(mdDir, mdFile);

    await fs.mkdir(mdDir, { recursive: true });

    const durationSec = body.durationMs ? (body.durationMs / 1000).toFixed(1) : 'unknown';
    const transcript = body.transcript?.trim();
    const transcriptText =
      transcript && transcript.length > 0
        ? transcript
        : '文字起こしは取得できませんでした（ブラウザの音声認識が無効の可能性があります）。';

    const content = `# 音声録音 ${y}-${m}-${d}\n\n- 収録: ${now.toLocaleString('ja-JP')}\n- 時間: ${durationSec} 秒\n- 音声ファイル: 保存なし（文字起こしのみ保存）\n\n## 文字起こし\n${transcriptText}\n`;

    await fs.writeFile(mdTarget, content, 'utf8');

    return NextResponse.json({
      filename: mdFile,
      path: `recording/${mdFile}`,
    });
  } catch (error) {
    console.error('Failed to save recording', error);
    return NextResponse.json({ error: 'failed to save recording' }, { status: 500 });
  }
}
