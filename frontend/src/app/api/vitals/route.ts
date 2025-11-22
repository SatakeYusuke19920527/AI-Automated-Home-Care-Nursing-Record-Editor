/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { AzureOpenAI } from 'openai';

type Vitals = {
  temperature?: string;
  bloodPressure?: string;
  pulse?: string;
  spo2?: string;
  note?: string;
};

const parseVitalsFromReply = (reply: string): Vitals => ({
  temperature: reply.match(/体温[:：]?\s*([0-9.]+℃?)/)?.[1],
  bloodPressure: reply.match(/血圧[:：]?\s*([0-9/]+\s*mmHg?)/)?.[1],
  pulse: reply.match(/脈拍[:：]?\s*([0-9]+(?:\s*(回\/分|bpm))?)/)?.[1],
  spo2: reply.match(/(血中酸素飽和度|SpO2)[:：]?\s*([0-9]+%?)/i)?.[2],
  note: reply.match(/(看護記録メモ|メモ|状況)[:：]\s*(.+)/)?.[2],
});

export async function POST(req: Request) {
  try {
    const { content } = (await req.json()) as { content?: string };
    console.log('🚀 ~ POST ~ content:', content);
    if (!content) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      );
    }

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = 'gpt-5-mini';
    const apiVersion = '2024-04-01-preview';

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: 'Azure OpenAI not configured' },
        { status: 500 }
      );
    }

    const client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion,
      deployment,
    });

    console.log('--- before AOAI call ---');

    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: 'system',
          content:
            'ユーザーの看護記録テキストから「体温」「血圧」「脈拍」「血中酸素飽和度」「看護記録メモ」を日本語で1行ずつ抽出して返してください。' +
            'フォーマットは必ず次のとおりにしてください: ' +
            '体温: ...\\n血圧: ...\\n脈拍: ...\\n血中酸素飽和度: ...\\n看護記録メモ: ...。' +
            '項目が不明な場合は「記録なし」と記載してください。',
        },
        {
          role: 'user',
          // ★ ここが重要：固定 "hello world" ではなく、録音テキストを渡す
          content,
        },
      ],
    });

    console.log('--- after AOAI call ---');
    console.log('FULL RESPONSE:', JSON.stringify(response, null, 2));

    const rawContent: any = response.choices[0]?.message?.content;
    let reply = '';
    if (typeof rawContent === 'string') {
      reply = rawContent;
    } else if (Array.isArray(rawContent)) {
      reply = rawContent
        .map((part: any) => {
          if (typeof part === 'string') return part;
          if (part?.text) return part.text;
          if (part?.content) return part.content;
          return '';
        })
        .join('\n')
        .trim();
    }

    console.log('🚀 ~ POST ~ reply:', reply);

    if (!reply) {
      return NextResponse.json({ error: 'no-reply' }, { status: 500 });
    }

    const vitals = parseVitalsFromReply(reply);
    console.log('✅ parsed vitals:', vitals);

    return NextResponse.json({ reply, vitals });
  } catch (err) {
    console.error('Vitals API error', err);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
