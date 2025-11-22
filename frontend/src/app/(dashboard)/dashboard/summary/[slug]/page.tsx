import fs from 'fs/promises';
import path from 'path';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CopyButton } from './copy-button';

// 動的に都度ファイルを読むため静的プリレンダーを避ける
export const dynamic = 'force-dynamic';

const RECORDING_DIR = path.join(process.cwd(), 'src', 'recording');

type Vitals = {
  temperature?: string;
  bloodPressure?: string;
  pulse?: string;
  spo2?: string;
  note?: string;
};

async function getRecording(slug: string) {
  const filename = `${slug}.md`;
  const filePath = path.join(RECORDING_DIR, filename);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return { filename, content };
  } catch {
    return null;
  }
}

function parseVitals(content: string): Vitals {
  const lines = content.split('\n').map((l) => l.trim());
  const vitals: Vitals = {};

  for (const line of lines) {
    if (!vitals.temperature) {
      const m = line.match(/体温[:：]?\s*([0-9.]+)\s*℃?/);
      if (m) vitals.temperature = `${m[1]}℃`;
    }
    if (!vitals.bloodPressure) {
      const m = line.match(/血圧[:：]?\s*([\d/]+(?:\s*mmHg)?)/i);
      if (m) vitals.bloodPressure = m[1];
    }
    if (!vitals.pulse) {
      const m = line.match(/(脈拍|pulse)[:：]?\s*([0-9]+)\s*(bpm)?/i);
      if (m) vitals.pulse = `${m[2]} bpm`;
    }
    if (!vitals.spo2) {
      const m = line.match(
        /(SpO2|酸素飽和度|血中酸素飽和度)[:：]?\s*([0-9]+)\s*%?/i
      );
      if (m) vitals.spo2 = `${m[2]}%`;
    }
    if (!vitals.note) {
      const m = line.match(/(状況|看護記録|メモ)[:：]\s*(.+)/);
      if (m) vitals.note = m[2];
    }
  }

  return vitals;
}

async function fetchVitalsFromApi(
  content: string
): Promise<{ vitals: Vitals | null; warning?: string; reply?: string } | null> {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

  try {
    const res = await fetch(`${base}/api/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Vitals API request failed', await res.text());
      return null;
    }

    const data = (await res.json()) as {
      vitals?: Vitals;
      warning?: string;
      reply?: string;
    };
    console.log('🚀 ~ fetchVitalsFromApi ~ data:', data);
    // reply 形式の文字列をパース
    if (!data.vitals && data.reply) {
      const replyVitals: Vitals = {
        temperature: data.reply.match(/体温[:：]?\s*([0-9.]+℃?)/)?.[1],
        bloodPressure: data.reply.match(/血圧[:：]?\s*([0-9/]+\s*mmHg?)/)?.[1],
        pulse: data.reply.match(
          /(脈拍|pulse)[:：]?\s*([0-9]+(?:\s*(回\/分|bpm))?)/i
        )?.[2],
        spo2: data.reply.match(
          /(血中酸素飽和度|SpO2)[:：]?\s*([0-9]+%?)/i
        )?.[2],
        note: data.reply.match(/(看護記録メモ|メモ|状況)[:：]\s*(.+)/)?.[2],
      };
      return { vitals: replyVitals, warning: data.warning, reply: data.reply };
    }
    return {
      vitals: data.vitals ?? null,
      warning: data.warning,
      reply: data.reply,
    };
  } catch (error) {
    console.error('Vitals API call failed', error);
    return null;
  }
}

export default async function RecordingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recording = await getRecording(slug);

  if (!recording) {
    notFound();
  }

  const apiResult = await fetchVitalsFromApi(recording.content);
  const vitals = apiResult?.vitals ?? parseVitals(recording.content);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/summary"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            一覧に戻る
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground break-all">
            {recording.filename}
          </h1>
          <p className="text-sm text-muted-foreground">
            録音ファイルの詳細を表示しています。
          </p>
        </div>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>バイタル・状況サマリー</CardTitle>
          <CardDescription>
            {vitals
              ? 'Azure OpenAI で抽出した結果を表示しています。'
              : 'ローカルパーサで抽出した結果を表示しています。'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-muted-foreground">体温</p>
              <CopyButton
                text={
                  vitals.temperature
                    ? `体温: ${vitals.temperature}`
                    : undefined
                }
              />
            </div>
            <p className="text-lg font-semibold">
              {vitals.temperature ?? '記録なし'}
            </p>
          </div>
          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-muted-foreground">血圧</p>
              <CopyButton
                text={
                  vitals.bloodPressure
                    ? `血圧: ${vitals.bloodPressure}`
                    : undefined
                }
              />
            </div>
            <p className="text-lg font-semibold">
              {vitals.bloodPressure ?? '記録なし'}
            </p>
          </div>
          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-muted-foreground">脈拍</p>
              <CopyButton
                text={vitals.pulse ? `脈拍: ${vitals.pulse}` : undefined}
              />
            </div>
            <p className="text-lg font-semibold">
              {vitals.pulse ?? '記録なし'}
            </p>
          </div>
          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-muted-foreground">血中酸素飽和度</p>
              <CopyButton
                text={vitals.spo2 ? `血中酸素飽和度: ${vitals.spo2}` : undefined}
              />
            </div>
            <p className="text-lg font-semibold">{vitals.spo2 ?? '記録なし'}</p>
          </div>
          <div className="md:col-span-2 space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-muted-foreground">患者の状況 / 看護記録</p>
              <CopyButton
                text={
                  vitals.note ? `患者の状況 / 看護記録: ${vitals.note}` : undefined
                }
              />
            </div>
            <p className="whitespace-pre-wrap leading-relaxed">
              {vitals.note ?? '記録なし'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>内容</CardTitle>
          <CardDescription>Markdown に保存された文字起こし</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-foreground">
            {recording.content}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
