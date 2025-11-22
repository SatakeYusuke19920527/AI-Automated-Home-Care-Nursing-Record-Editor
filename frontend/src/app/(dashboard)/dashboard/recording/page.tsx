/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';

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
import { Activity, Mic, Square, Waves } from 'lucide-react';

type SaveResponse = {
  filename: string;
  path: string; // markdown path (relative)
};

type RecordingStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'saving'
  | 'saved'
  | 'error';

export default function RecordingPage() {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [message, setMessage] = useState('ボタンを押して録音を開始');
  const [savedMdPath, setSavedMdPath] = useState<string | null>(null);
  const [savingProgress, setSavingProgress] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const finalTranscriptRef = useRef<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const Speech =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    if (Speech) setSpeechSupported(true);
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setMessage('HTTPS または http://localhost でアクセスしてください（マイク権限が必要です）');
    }

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current?.stop();
      recognitionRef.current?.stop?.();
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  const startSavingProgress = () => {
    setSavingProgress(10);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setSavingProgress((prev) => Math.min(prev + 10, 90));
    }, 300);
  };

  const finishSavingProgress = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setSavingProgress(100);
    setTimeout(() => setSavingProgress(0), 600);
  };

  const startRecording = async () => {
    try {
      setStatus('requesting');
      setMessage('マイクを初期化しています...');
      setSavedMdPath(null);
      setTranscript('');
      finalTranscriptRef.current = '';
      setPermissionError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      setStatus('recording');
      setMessage('録音中... もう一度押すと停止します');

      recorder.onstop = async () => {
        if (!startTimeRef.current) return;
        const durationMs = Date.now() - startTimeRef.current;
        setStatus('saving');
        setMessage('録音を保存しています...');
        recognitionRef.current?.stop?.();
        const finalTranscript = finalTranscriptRef.current || transcript || '（文字起こしなし）';
        await saveRecording(durationMs, finalTranscript);
      };

      recorder.start();

      const Speech =
        typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

      if (Speech) {
        const recognition = new Speech();
        recognition.lang = 'ja-JP';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          const finals: string[] = [];
          let interim = '';
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results.item(i);
            if (result && result[0]) {
              const text = result[0].transcript.trim();
              if (result.isFinal) {
                finals.push(text);
              } else {
                interim = text;
              }
            }
          }
          finalTranscriptRef.current = finals.join(' ').trim();
          const display = [finalTranscriptRef.current, interim].filter(Boolean).join(' ').trim();
          setTranscript(display);
        };
        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error', event);
        };
        recognitionRef.current = recognition;
        recognition.start();
      } else {
        setSpeechSupported(false);
      }
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
        setPermissionError(
          'マイクへのアクセスが拒否されています。ブラウザのURLバーからマイク許可を有効にしてください。',
        );
        setMessage('マイクのアクセスが拒否されました。権限を許可した後に再試行してください。');
      } else {
        setMessage('マイクの初期化に失敗しました。設定を確認してください。');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;
      recognitionRef.current?.stop?.();
      startSavingProgress();
    }
  };

  const saveRecording = async (durationMs: number, finalTranscript: string) => {
    try {
      const res = await fetch('/api/recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationMs,
          transcript: finalTranscript,
        }),
      });

      if (!res.ok) {
        throw new Error('保存に失敗しました');
      }

      const data = (await res.json()) as SaveResponse;
      finishSavingProgress();
      setStatus('saved');
      setSavedMdPath(data.path);
      setMessage(`録音を保存しました: ${data.path}`);
    } catch (error) {
      console.error(error);
      finishSavingProgress();
      setStatus('error');
      setMessage('保存中にエラーが発生しました。もう一度お試しください。');
    }
  };

  const retryPermission = async () => {
    try {
      setPermissionError(null);
      setMessage('マイク権限を確認しています...');
      const tmpStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tmpStream.getTracks().forEach((t) => t.stop());
      setMessage('権限が確認できました。録音を開始できます。');
    } catch (error) {
      console.error(error);
      setPermissionError(
        'マイク権限を取得できませんでした。ブラウザのサイト設定でマイクを許可してください。',
      );
      setMessage('マイク権限の取得に失敗しました。');
    }
  };

  const handleButtonClick = () => {
    if (status === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const isRecording = status === 'recording';
  const isSaving = status === 'saving';

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-10">
      <Card className="relative overflow-hidden border-slate-200/70 bg-white shadow-lg shadow-indigo-100/40 dark:border-white/10 dark:bg-slate-900">
        <div className="absolute inset-0 bg-linear-to-r from-indigo-50 via-white to-cyan-50 opacity-70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900" />
        <div className="absolute -left-10 top-12 h-44 w-44 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-500/30" />
        <div className="absolute bottom-6 right-6 h-28 w-28 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-500/30" />
        <CardHeader className="relative text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-white/10">
            <Waves className="h-7 w-7 text-indigo-500" />
          </div>
          <CardTitle className="mt-4 text-2xl">音声レコーディング</CardTitle>
          <CardDescription className="text-base text-slate-600 dark:text-slate-300">
            真ん中のボタンで録音開始 / 停止。保存先は recording/recording-YYYYMMDD-時刻.md
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <Badge
                variant={isRecording ? 'destructive' : status === 'saved' ? 'outline' : 'secondary'}
                className="rounded-full px-3 py-1 text-sm"
              >
                {isRecording ? '録音中' : status === 'saved' ? '保存済み' : '待機中'}
              </Badge>
              {isSaving && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Activity className="h-3.5 w-3.5 animate-pulse text-indigo-500" />
                  保存中...
                </div>
              )}
            </div>

            <Button
              size="lg"
              onClick={handleButtonClick}
              disabled={isSaving || status === 'requesting'}
              className="group relative h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-2xl transition hover:-translate-y-1 hover:shadow-indigo-200 focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-60 dark:shadow-indigo-900/40"
            >
              <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 transition group-hover:opacity-100" />
              {isRecording ? <Square className="h-8 w-8" aria-hidden /> : <Mic className="h-8 w-8" aria-hidden />}
              <span className="sr-only">{isRecording ? '録音停止' : '録音開始'}</span>
            </Button>

            <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>

            {permissionError && (
              <div className="w-full max-w-xl space-y-2 text-xs text-amber-700 dark:text-amber-200">
                <p className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10">
                  {permissionError}
                </p>
                <Button size="sm" variant="outline" className="rounded-full" onClick={retryPermission}>
                  マイク権限を再確認
                </Button>
              </div>
            )}

            {!speechSupported && (
              <p className="text-xs text-amber-600 dark:text-amber-300">
                ブラウザの音声認識が利用できません。対応ブラウザで開くと文字起こしできます。
              </p>
            )}

            {transcript && (
              <div className="w-full max-w-2xl rounded-xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  文字起こし（リアルタイム）
                </p>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">{transcript}</p>
              </div>
            )}

            {savingProgress > 0 && (
              <div className="w-full max-w-sm space-y-2">
                <Progress value={savingProgress} className="h-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">保存進行中...</p>
              </div>
            )}

            {savedMdPath && (
              <div className="w-full max-w-2xl space-y-2 text-xs text-slate-700 dark:text-slate-200">
                <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-slate-800">
                  <p className="font-semibold">Markdown (文字起こし):</p>
                  <p className="mt-1 break-words">{savedMdPath}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
