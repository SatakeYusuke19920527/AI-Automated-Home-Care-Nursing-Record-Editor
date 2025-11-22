import fs from 'fs/promises';
import path from 'path';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// 動的に都度ファイルを読むため静的プリレンダーを避ける
export const dynamic = 'force-dynamic';

const RECORDING_DIR = path.join(process.cwd(), 'src', 'recording');

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
          <p className="text-sm text-muted-foreground">録音ファイルの詳細を表示しています。</p>
        </div>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>内容</CardTitle>
          <CardDescription>Markdown に保存された文字起こし</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
            {recording.content}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
