import axios from 'axios';
import { DApp } from '@/types/dapp';
import { DeepResearchOutput } from './deep-research-service';

// テスト用のdAppデータ
const testDapp: DApp = {
  id: 'uniswap',
  name: 'Uniswap',
  category: 'DeFi',
  subcategory: 'DEX',
  description: 'Uniswapは、イーサリアム上で動作する分散型取引所（DEX）プロトコルです。自動マーケットメーカー（AMM）モデルを使用して、ユーザーが仲介者なしでトークンを交換できるようにします。',
  website: 'https://uniswap.org',
  image: 'https://uniswap.org/images/logo.png',
  chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism'],
  tags: ['DEX', 'AMM', 'Swap', 'Liquidity'],
  stats: {
    users: '1.2M',
    activity: 'High',
    volume: '$2.5B',
    balance: '$5.1B'
  }
};

// OpenRouterを使用したDeepResearch機能
async function testDeepResearchWithOpenRouter(
  dapp: DApp, 
  apiKey: string, 
  model: string = 'google/gemma-3-27b-it:free'
): Promise<DeepResearchOutput> {
  try {
    // OpenRouter APIのエンドポイント
    const apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
    
    // プロンプトの構築
    const prompt = `
あなたはdAppアナリストです。以下のdAppについて詳細な調査を行い、構造化されたレポートを作成してください。

dApp名: ${dapp.name}
カテゴリ: ${dapp.category}
${dapp.subcategory ? `サブカテゴリ: ${dapp.subcategory}` : ''}
説明: ${dapp.description}
対応チェーン: ${dapp.chains ? dapp.chains.join(', ') : '不明'}
${dapp.tags ? `タグ: ${dapp.tags.join(', ')}` : ''}

以下の情報を含む詳細なレポートを作成してください：

1. 概要 - このdAppの主な目的と機能の簡潔な説明
2. 主要機能 - 箇条書きで主な機能を5-8個リスト
3. 最近の開発状況 - 過去1年間の主な開発やアップデート（日付と説明）
4. コミュニティの評判 - ポジティブな評価の割合（%）と分析に使用したデータ量
5. 主な競合他社 - 同じ分野の主要な競合dAppを3-5個
6. 強み - 箇条書きで3-5個の強みをリスト
7. 弱み - 箇条書きで3-5個の弱みをリスト
8. 将来の展望 - 今後の成長や発展の可能性についての分析

レポートは客観的で事実に基づいたものにしてください。情報が不足している場合は、同様のdAppや一般的な業界知識に基づいて合理的な推測を行ってください。

レポートは以下のJSON形式で返してください：
{
  "overview": "概要テキスト",
  "features": ["機能1", "機能2", ...],
  "developments": [{"date": "2024年3月", "description": "説明テキスト"}, ...],
  "sentiment": {"positive": 75, "count": 500},
  "competitors": ["競合1", "競合2", ...],
  "strengths": ["強み1", "強み2", ...],
  "weaknesses": ["弱み1", "弱み2", ...],
  "futureOutlook": "将来の展望テキスト"
}
`;

    // APIリクエストの設定
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://dapp-explorer.example.com',
      'X-Title': 'DApp Explorer'
    };

    const data = {
      model: model,
      messages: [
        {
          role: "system",
          content: "あなたはブロックチェーンとdAppに関する専門知識を持つアナリストです。正確で詳細な情報を提供してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    };

    console.log('OpenRouter APIリクエストを送信中...');
    console.log('使用モデル:', model);
    
    // APIリクエストの実行
    const response = await axios.post(apiEndpoint, data, { headers });
    
    // レスポンスからJSONを抽出
    const content = response.data.choices[0].message.content;
    console.log('APIレスポンス:', content);
    
    try {
      const researchData = JSON.parse(content);
      return ensureValidResearchOutput(researchData);
    } catch (parseError) {
      console.error('JSONパースエラー:', parseError);
      throw new Error('APIレスポンスのJSONパースに失敗しました');
    }
  } catch (error) {
    console.error('DeepResearch error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.data);
    }
    
    // エラー時のフォールバックデータ
    return {
      overview: "データの取得中にエラーが発生しました。",
      features: ["データを取得できませんでした"],
      developments: [{ date: "不明", description: "データを取得できませんでした" }],
      sentiment: { positive: 0 },
      competitors: ["データを取得できませんでした"],
      strengths: ["データを取得できませんでした"],
      weaknesses: ["データを取得できませんでした"],
      futureOutlook: "データの取得中にエラーが発生しました。"
    };
  }
}

// 結果の検証と修正
function ensureValidResearchOutput(data: any): DeepResearchOutput {
  // デフォルト値
  const defaultOutput: DeepResearchOutput = {
    overview: "情報がありません",
    features: [],
    developments: [],
    sentiment: { positive: 0 },
    competitors: [],
    strengths: [],
    weaknesses: [],
    futureOutlook: "情報がありません"
  };

  // データの検証と修正
  const validatedOutput: DeepResearchOutput = {
    overview: typeof data.overview === 'string' ? data.overview : defaultOutput.overview,
    features: Array.isArray(data.features) ? data.features : defaultOutput.features,
    developments: Array.isArray(data.developments) ? data.developments : defaultOutput.developments,
    sentiment: data.sentiment && typeof data.sentiment.positive === 'number' 
      ? data.sentiment 
      : defaultOutput.sentiment,
    competitors: Array.isArray(data.competitors) ? data.competitors : defaultOutput.competitors,
    strengths: Array.isArray(data.strengths) ? data.strengths : defaultOutput.strengths,
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : defaultOutput.weaknesses,
    futureOutlook: typeof data.futureOutlook === 'string' ? data.futureOutlook : defaultOutput.futureOutlook
  };

  return validatedOutput;
}

// テスト実行関数
export async function runDeepResearchTest(apiKey: string, model: string = 'google/gemma-3-27b-it:free'): Promise<DeepResearchOutput> {
  console.log('DeepResearch機能のテストを開始します...');
  const result = await testDeepResearchWithOpenRouter(testDapp, apiKey, model);
  console.log('DeepResearch機能のテストが完了しました');
  return result;
}
