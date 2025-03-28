import { getApiKey, ApiProvider, getModelSettings } from "./api-keys";
import { performLangChainResearch } from "./langchain-research";

export interface ApiSettings {
  baseUrl: string;
  apiKey: string;
  modelName: string;
  customModelValue?: string; // Optional field for storing custom model value
}

export interface ResearchInput {
  dappName: string;
  dappDescription?: string;
  category?: string;
  chains?: string[];
}

export interface ResearchOutput {
  research: string;
  structured?: any;
}

/**
 * Creates a system prompt for deep research (fallback method)
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
 * Perform research using OpenAI API directly (fallback method)
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
      model: apiSettings.modelName === "custom" && apiSettings.customModelValue 
        ? apiSettings.customModelValue 
        : apiSettings.modelName,
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
 * Perform deep research on a dApp using LangChain (primary method)
 */
export async function performResearch(
  input: ResearchInput,
  apiSettings?: ApiSettings // Use server API key if not provided
): Promise<ResearchOutput> {
  try {
    console.log("Starting research with LangChain for dApp:", input.dappName);
    
    // If API settings not provided, check for server-side API key
    if (!apiSettings) {
      // Try OpenRouter first, then fall back to OpenAI
      let modelSettings = getModelSettings(ApiProvider.OPENROUTER);
      
      // If no OpenRouter settings, try OpenAI
      if (!modelSettings?.apiKey) {
        modelSettings = getModelSettings(ApiProvider.OPENAI);
      }
      
      if (!modelSettings?.apiKey) {
        throw new Error('No API key available for research');
      }
      
      // Use server-side settings
      apiSettings = {
        baseUrl: modelSettings.baseUrl,
        apiKey: modelSettings.apiKey,
        modelName: modelSettings.modelName,
      };
      
      console.log("Using server-side API settings with model:", modelSettings.modelName);
    } else {
      console.log("Using client-provided API key with model:", 
        apiSettings.modelName === "custom" ? apiSettings.customModelValue : apiSettings.modelName);
    }
    
    try {
      // Use the LangChain implementation for better research
      const research = await performLangChainResearch(input, apiSettings);
      return { research };
    } catch (langChainError) {
      console.error("LangChain research failed, falling back to direct API call:", langChainError);
      
      // Fallback to direct API call
      const fallbackResearch = await performOpenAIResearch(input, apiSettings);
      return { research: fallbackResearch };
    }
  } catch (error) {
    console.error('Error performing research:', error);
    throw error;
  }
}