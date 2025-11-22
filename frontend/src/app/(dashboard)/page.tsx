import AuthButton from '@/components/auth/auth-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  BusFront,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Droplets,
  HeartPulse,
  MapPin,
  NotebookPen,
  PhoneCall,
  Stethoscope,
  Syringe,
  Thermometer,
} from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '訪問看護ダッシュボード | 本日の予定とケア',
  description: '訪問看護師の本日の予定や仕事内容をひと目で把握できるダッシュボード。',
  openGraph: {
    title: '訪問看護ダッシュボード',
    description: '訪問予定・処置・移動をまとめて管理する本日のルートボード。',
    type: 'website',
    locale: 'ja_JP',
  },
};

const visits = [
  {
    time: '08:30',
    patient: '鈴木 さくら さん',
    location: '杉並区阿佐ヶ谷 3-12-4',
    travel: '車 12 分',
    status: 'on-time',
    duration: '45分',
    memo: '夜間の息切れあり → 呼吸音と浮腫確認',
    tasks: ['バイタル測定', '内服確認', '清拭・スキンケア'],
    vitals: { bp: '118/72', spo2: '96%', temp: '36.6' },
  },
  {
    time: '10:15',
    patient: '田中 健介 さん',
    location: '中野区沼袋 1-8-2',
    travel: '自転車 9 分',
    status: 'attention',
    duration: '60分',
    memo: '褥瘡ポケット浅くなりつつあり。ドレッシング材変更候補。',
    tasks: ['創部観察', '陰圧交換', '体位変換指導'],
    vitals: { bp: '124/80', spo2: '98%', temp: '36.5' },
  },
  {
    time: '13:00',
    patient: '山田 純 さん',
    location: '練馬区向山 2-6-9',
    travel: '車 18 分',
    status: 'on-time',
    duration: '40分',
    memo: '昼食後の血糖フォローと歩行訓練。ポータブル酸素予備チェック。',
    tasks: ['血糖測定', 'インスリン注射', '歩行リハ 15分'],
    vitals: { bp: '130/78', spo2: '95%', temp: '36.8' },
  },
  {
    time: '15:30',
    patient: '佐々木 美帆 さん',
    location: '板橋区向原 5-2-2',
    travel: '車 22 分',
    status: 'flex',
    duration: '50分',
    memo: 'ご家族不在のため前後 15 分で調整可。浮腫増悪のモニタリング。',
    tasks: ['バイタル測定', '服薬リマインド', 'リンパドレナージュ'],
    vitals: { bp: '110/68', spo2: '97%', temp: '36.4' },
  },
];

const quickTasks = [
  { label: '訪問開始を記録', icon: CheckCircle2, tone: 'primary' },
  { label: '電話で到着連絡', icon: PhoneCall, tone: 'soft' },
  { label: 'マップで経路確認', icon: MapPin, tone: 'soft' },
  { label: '処置セット準備', icon: Syringe, tone: 'soft' },
];

const checklist = [
  { title: '午前の訪問記録送信', progress: 80 },
  { title: '陰圧管理の報告ドラフト', progress: 45 },
  { title: '物品補充オーダー（滅菌ガーゼ）', progress: 60 },
];

const handovers = [
  {
    title: '緊急連絡先',
    content: '主治医（佐伯先生）: 080-1234-5678 / 訪問薬剤師: 080-9876-5432',
  },
  {
    title: '本日注意',
    content:
      '田中さんの褥瘡は滲出液減。ドレッシング変更案を写真付きで共有予定。呼吸苦が出た場合は直近の病院へ搬送判断。',
  },
];

const supplyList = [
  '滅菌ガーゼ 10枚 + フィルムドレッシング 3枚',
  '18G 静脈留置針 2本 / アルコール綿 8枚',
  '血糖測定キット（チップ残 7枚）',
  'ポータブル酸素（残量 60%）',
];

export default function Home() {
  const today = new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());

  const completedRate = Math.round(
    checklist.reduce((acc, cur) => acc + cur.progress, 0) / checklist.length,
  );

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-500 dark:bg-slate-950 dark:text-slate-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-500/20" />
        <div className="absolute right-0 top-32 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-500/20" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/30 bg-white/80 backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Nursing Routeboard
          </Link>
          <AuthButton />
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 py-10 lg:py-14">
        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
          <Card className="relative overflow-hidden border-slate-200/70 bg-white/90 shadow-lg shadow-indigo-100/40 dark:border-white/10 dark:bg-slate-900">
            <div className="absolute inset-0 bg-linear-to-r from-cyan-50 via-white to-indigo-50 opacity-70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900" />
            <div className="absolute inset-y-0 right-10 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
            <CardHeader className="relative flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
                  本日のシフト
                </p>
                <CardTitle className="mt-1 text-3xl">訪問看護ダッシュボード</CardTitle>
                <CardDescription className="mt-1 text-base text-slate-600 dark:text-slate-300">
                  {today} / 日勤 08:00-17:00
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-white/60 bg-white/90 px-4 py-2 text-sm shadow-sm dark:border-white/10 dark:bg-slate-800">
                <CalendarClock className="h-4 w-4 text-indigo-500" />
                <span>訪問 {visits.length} 件 / ルート更新済み</span>
              </div>
            </CardHeader>
            <CardContent className="relative grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-800/80">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  予定訪問
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-3xl font-semibold">{visits.length}</p>
                  <span className="text-sm text-slate-500 dark:text-slate-400">件</span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  ルート確定・遅延なし
                </p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-800/80">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  医療処置
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <p className="text-3xl font-semibold">3</p>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    件（創処置 / 注射）
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-300">
                  <Syringe className="h-4 w-4" />
                  物品チェック完了
                </p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-slate-800/80">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  記録進捗
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={completedRate} className="h-2.5" />
                  <p className="text-lg font-semibold">{completedRate}%</p>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  午前の記録送信を優先
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white/90 shadow-lg shadow-cyan-100/40 dark:border-white/10 dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ClipboardCheck className="h-5 w-5 text-indigo-500" />
                クイックアクション
              </CardTitle>
              <CardDescription>移動前のワンタップ操作で手間を減らす。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {quickTasks.map(({ label, icon: Icon, tone }) => (
                <Button
                  key={label}
                  variant={tone === 'primary' ? 'default' : 'secondary'}
                  className="justify-start gap-2 rounded-xl border border-slate-200/70 bg-white text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-800 dark:text-slate-50"
                >
                  <Icon className="h-4 w-4 text-indigo-500" />
                  {label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <Card className="border-slate-200/70 bg-white shadow-md dark:border-white/10 dark:bg-slate-900">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <BusFront className="h-5 w-5 text-indigo-500" />
                本日のルートとタイムライン
              </CardTitle>
              <CardDescription>
                移動時間を含めた訪問スケジュール。ステータスで遅延リスクを即把握。
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="absolute left-[18px] top-8 h-[calc(100%-3rem)] w-px bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-8">
                {visits.map((visit, idx) => (
                  <div key={visit.patient} className="relative pl-10">
                    <div className="absolute left-0 top-1 h-3 w-3 rounded-full border-4 border-white bg-indigo-500 shadow ring-2 ring-indigo-200 dark:border-slate-900 dark:ring-indigo-600/30" />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-semibold">{visit.time}</p>
                        <Badge
                          variant={
                            visit.status === 'attention'
                              ? 'destructive'
                              : visit.status === 'flex'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="rounded-full"
                        >
                          {visit.status === 'attention'
                            ? '要注意'
                            : visit.status === 'flex'
                            ? '時間調整可'
                            : 'オンタイム'}
                        </Badge>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {visit.duration}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Clock3 className="h-4 w-4" />
                        {visit.travel}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-800/70">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-base font-semibold">{visit.patient}</p>
                          <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <MapPin className="h-4 w-4 text-indigo-500" />
                            {visit.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
                          <HeartPulse className="h-4 w-4 text-rose-500" />
                          <span>BP {visit.vitals.bp}</span>
                          <Droplets className="h-4 w-4 text-cyan-500" />
                          <span>SpO₂ {visit.vitals.spo2}</span>
                          <Thermometer className="h-4 w-4 text-amber-500" />
                          <span>{visit.vitals.temp}℃</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {visit.tasks.map((task) => (
                          <Badge
                            key={`${visit.patient}-${task}`}
                            variant="outline"
                            className="rounded-full border-slate-300/70 bg-white/60 px-3 py-1 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                          >
                            {task}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-2 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <NotebookPen className="mt-0.5 h-4 w-4 text-indigo-500" />
                        <p>{visit.memo}</p>
                      </div>
                    </div>
                    {idx !== visits.length - 1 && (
                      <div className="absolute left-[6px] top-[calc(100%+8px)] h-6 w-px bg-gradient-to-b from-indigo-200/80 via-slate-200 to-transparent dark:from-indigo-700/60 dark:via-slate-700" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-slate-200/70 bg-white shadow-md dark:border-white/10 dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5 text-indigo-500" />
                  今日の重点確認
                </CardTitle>
                <CardDescription>リスクと優先度を先に押さえて移動をスムーズに。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm shadow-sm dark:border-amber-500/40 dark:bg-amber-500/15">
                  <p className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-100">
                    <AlertTriangle className="h-4 w-4" />
                    要注意：褥瘡ドレッシング変更
                  </p>
                  <p className="mt-1 text-slate-700 dark:text-amber-50">
                    田中さんの陰圧療法は滲出液減。貼り替え後の疼痛評価と感染兆候を優先確認。
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-200/80 bg-cyan-50/90 px-4 py-3 text-sm shadow-sm dark:border-cyan-500/40 dark:bg-cyan-500/15">
                  <p className="flex items-center gap-2 font-semibold text-cyan-800 dark:text-cyan-50">
                    <Activity className="h-4 w-4" />
                    共有メモ
                  </p>
                  <p className="mt-1 text-slate-700 dark:text-cyan-50">
                    山田さんは昼食後の血糖測定を 13:00 前後で固定。歩行リハの前に SpO₂ を再チェック。
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-white shadow-md dark:border-white/10 dark:bg-slate-900">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-indigo-500" />
                  記録・タスクの進捗
                </CardTitle>
                <CardDescription>訪問の合間で処理するタスクをまとめて管理。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {checklist.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-800/70"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {item.title}
                      </p>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {item.progress}%
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Progress value={item.progress} className="h-2" />
                      <Badge variant="secondary" className="rounded-full">
                        {item.progress >= 80 ? 'あと少し' : '進行中'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 bg-white shadow-md dark:border-white/10 dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-indigo-500" />
                  持ち出し物品チェック
                </CardTitle>
                <CardDescription>出発前に足りない物を確認してください。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {supplyList.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 rounded-lg border border-slate-200/70 bg-slate-50/70 px-3 py-2 dark:border-white/10 dark:bg-slate-800"
                  >
                    <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-500" />
                    <p>{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200/70 bg-white shadow-md dark:border-white/10 dark:bg-slate-900">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <NotebookPen className="h-5 w-5 text-indigo-500" />
                申し送りメモ
              </CardTitle>
              <CardDescription>チーム全体で共有するショートメモ。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
              {handovers.map((handover) => (
                <div
                  key={handover.title}
                  className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-800/70"
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {handover.title}
                  </p>
                  <p className="mt-1 leading-relaxed">{handover.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white shadow-md dark:border-white/10 dark:bg-slate-900">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-indigo-500" />
                連絡・バックアップ
              </CardTitle>
              <CardDescription>トラブル時の連絡先とステップをまとめています。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
              <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-800/70">
                <p className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  緊急時のフロー
                </p>
                <p className="mt-1 leading-relaxed">
                  バイタル急変 → 主治医に直通連絡 → 家族へ共有 → 必要に応じて救急搬送。報告テンプレは記録タブに保存済み。
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-800/70">
                <p className="flex items-center gap-2 font-semibold">
                  <Stethoscope className="h-4 w-4 text-indigo-500" />
                  チームチャット
                </p>
                <p className="mt-1 leading-relaxed">
                  画像共有は 5MB まで即送信可。創部写真は「田中/2024-06-XX」フォルダにアップロード。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
