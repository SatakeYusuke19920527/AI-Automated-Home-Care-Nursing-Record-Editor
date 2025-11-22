import fs from 'fs/promises';
import path from 'path';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type RecordingEntry = {
  filename: string;
  slug: string;
  content: string;
  createdAtLabel: string;
};

const RECORDING_DIR = path.join(process.cwd(), 'src', 'recording');

async function getRecordings(): Promise<RecordingEntry[]> {
  try {
    const files = await fs.readdir(RECORDING_DIR);
    const mdFiles = files.filter(
      (file) => file.startsWith('recording-') && file.endsWith('.md')
    );

    const entries = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = path.join(RECORDING_DIR, file);
        const stat = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf8');
        const slug = file.replace(/\.md$/, '');
        return {
          filename: file,
          slug,
          content,
          createdAtLabel: stat.birthtime.toLocaleString('ja-JP'),
        };
      })
    );

    // 新しい順に並べる
    return entries.sort((a, b) => (a.slug > b.slug ? -1 : 1));
  } catch (error) {
    console.error('Failed to read recordings', error);
    return [];
  }
}

export default async function Summary() {
  const recordings = await getRecordings();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          録音まとめ
        </h1>
        <p className="text-sm text-muted-foreground">
          recording ディレクトリにある録音 Markdown
          をカードで一覧します。カードを開くと詳細が表示されます。
        </p>
      </div>

      {recordings.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardDescription>
              録音ページで収録を行うとここに一覧されます。
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recordings.map((item, idx) => (
            <Link key={item.slug} href={`/dashboard/summary/${item.slug}`} className="group">
              <Card className="h-full overflow-hidden border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">No.{recordings.length - idx}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.createdAtLabel}
                    </span>
                  </div>
                  <CardTitle className="text-base font-semibold break-words">
                    {item.filename}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground line-clamp-2">
                    {item.content.split('\n').slice(0, 2).join(' ') || '（プレビューなし）'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-primary opacity-80 transition group-hover:opacity-100">
                    詳細ページへ →
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
