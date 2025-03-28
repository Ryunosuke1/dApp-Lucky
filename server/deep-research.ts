import { getApiKey, ApiProvider } from "./api-keys";

export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

export interface ResearchInput {
  dappName: string;
  dappDescription?: string;
  category?: string;
  chains?: string[];
}

export interface ResearchOutput {
  research: string;
}

/**
 * Creates a system prompt for deep research
 */
function createSystemPrompt(input: ResearchInput): string {
  const dappName = input.dappName;
  const dappDescription = input.dappDescription ? `\n- Description: ${input.dappDescription}` : '';
  const category = input.category ? `\n- Category: ${input.category}` : '';
  const chains = input.chains && input.chains.length > 0 
    ? `\n- Blockchains: ${input.chains.join(', ')}` 
    : '';

  return `You are an expert Web3 researcher providing detailed analysis on decentralized applications (dApps).
Your task is to provide comprehensive research on the dApp ${dappName}.${dappDescription}${category}${chains}

Include the following sections in your analysis:

1. Overview: A clear, concise explanation of what the dApp is and its main purpose
2. Key Features: Bullet points of the most important features
3. Technical Architecture: How the dApp works technically (blockchain, smart contracts, etc.)
4. Recent Developments: Major updates, milestones or news (with dates where possible)
5. Community Sentiment: Approximation of community reception (e.g., 75% Positive based on 500 social media mentions)
6. Competitors: Main competitors in the same category
7. Strengths & Weaknesses: Balanced analysis of advantages and potential concerns
8. Future Outlook: Potential future developments or challenges

FORMAT YOUR RESPONSE WITH CLEAR SECTION HEADERS AND USE BULLET POINTS WHERE APPROPRIATE.
ALWAYS PROVIDE THE MOST ACCURATE, UP-TO-DATE INFORMATION POSSIBLE.`;
}

/**
 * Perform research using OpenAI API directly
 */
async function performOpenAIResearch(input: ResearchInput, apiSettings: ApiSettings): Promise<string> {
  const systemPrompt = createSystemPrompt(input);
  
  const response = await fetch(apiSettings.baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiSettings.apiKey}`
    },
    body: JSON.stringify({
      model: apiSettings.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze the Web3 dApp ${input.dappName} as requested.` }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error (${response.status}): ${text}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Perform deep research on a dApp
 */
export async function performResearch(
  input: ResearchInput,
  apiSettings?: ApiSettings // Use server API key if not provided
): Promise<ResearchOutput> {
  try {
    // If API settings not provided, check for server-side API key
    if (!apiSettings) {
      const apiKey = getApiKey(ApiProvider.OPENAI) || getApiKey(ApiProvider.OPENROUTER);
      
      if (!apiKey) {
        throw new Error('No API key available for research');
      }
      
      // Use default settings with server API key
      apiSettings = {
        baseUrl: getApiKey(ApiProvider.OPENROUTER) 
          ? 'https://openrouter.ai/api/v1' 
          : 'https://api.openai.com/v1',
        apiKey,
        modelName: 'gpt-3.5-turbo',
      };
    }
    
    const research = await performOpenAIResearch(input, apiSettings);
    return { research };
  } catch (error) {
    console.error('Error performing research:', error);
    throw error;
  }
}