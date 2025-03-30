import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "langchain/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { RunnableSequence } from "langchain/schema/runnable";
import { DApp } from '@/types/dapp';
import axios from 'axios';

export interface DeepResearchOutput {
  overview: string;
  features: string[];
  developments: { date: string; description: string }[];
  sentiment: { positive: number; count?: number };
  competitors: string[];
  strengths: string[];
  weaknesses: string[];
  futureOutlook: string;
  securityAudit?: {
    status: 'audited' | 'not_audited' | 'unknown';
    details: string;
  };
  communityInsights?: string[];
  technicalAnalysis?: string;
  investmentPotential?: {
    rating: 'high' | 'medium' | 'low';
    reasoning: string;
  };
  riskFactors?: string[];
  additionalResources?: { title: string; url: string }[];
}

export interface DeepResearchSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class DeepResearchService {
  private settings: DeepResearchSettings;
  private parser: StructuredOutputParser<DeepResearchOutput>;

  constructor(settings: DeepResearchSettings) {
    this.settings = settings;
    
    // Create a structured output parser for the DeepResearch output
    this.parser = StructuredOutputParser.fromZodSchema({
      overview: z.string().describe("Detailed overview of the dApp"),
      features: z.array(z.string()).describe("List of features with explanations"),
      developments: z.array(z.object({
        date: z.string().describe("Date of the development"),
        description: z.string().describe("Description of the development")
      })).describe("Recent developments with dates"),
      sentiment: z.object({
        positive: z.number().describe("Percentage of positive sentiment"),
        count: z.number().optional().describe("Number of sources analyzed")
      }).describe("Community sentiment analysis"),
      competitors: z.array(z.string()).describe("List of competitors with comparisons"),
      strengths: z.array(z.string()).describe("List of strengths with explanations"),
      weaknesses: z.array(z.string()).describe("List of weaknesses with explanations"),
      futureOutlook: z.string().describe("Detailed future outlook"),
      securityAudit: z.object({
        status: z.enum(["audited", "not_audited", "unknown"]).describe("Audit status"),
        details: z.string().describe("Audit details")
      }).optional().describe("Security audit information"),
      communityInsights: z.array(z.string()).optional().describe("Community insights"),
      technicalAnalysis: z.string().optional().describe("Technical analysis"),
      investmentPotential: z.object({
        rating: z.enum(["high", "medium", "low"]).describe("Investment rating"),
        reasoning: z.string().describe("Investment reasoning")
      }).optional().describe("Investment potential analysis"),
      riskFactors: z.array(z.string()).optional().describe("Risk factors"),
      additionalResources: z.array(z.object({
        title: z.string().describe("Resource title"),
        url: z.string().describe("Resource URL")
      })).optional().describe("Additional resources")
    });
  }

  async researchDapp(dapp: DApp): Promise<DeepResearchOutput> {
    try {
      console.log('Starting DeepResearch for:', dapp.name);
      console.log('Using model:', this.settings.model || 'default');
      
      // Create LangChain model
      const model = this.createLangChainModel();
      
      // Get web search results about the dApp
      const searchResults = await this.searchDappInfo(dapp);
      
      // Create the research chain
      const researchChain = this.createResearchChain(model);
      
      // Run the research chain
      const result = await researchChain.invoke({
        dappName: dapp.name,
        dappCategory: dapp.category || 'Unknown',
        dappSubcategory: dapp.subcategory || '',
        dappDescription: dapp.description || 'No description available',
        dappChains: dapp.chains ? dapp.chains.join(', ') : 'Unknown',
        dappTags: dapp.tags ? dapp.tags.join(', ') : '',
        dappWebsite: dapp.website || '',
        searchResults: searchResults
      });
      
      return result;
    } catch (error) {
      console.error('DeepResearch error:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', error.response?.data);
      }
      
      // Return fallback data in case of error
      return this.getFallbackData();
    }
  }

  private createLangChainModel() {
    const isOpenRouter = this.settings.baseUrl.includes('openrouter.ai');
    
    // Configure model options
    const modelOptions = {
      openAIApiKey: this.settings.apiKey,
      modelName: this.settings.model || (isOpenRouter ? 'google/gemma-3-27b-it:free' : 'gpt-3.5-turbo'),
      temperature: 0.3,
      maxTokens: 4000
    };
    
    // If using OpenRouter, add custom base URL
    if (isOpenRouter) {
      modelOptions.configuration = {
        baseURL: this.settings.baseUrl,
        defaultHeaders: {
          'HTTP-Referer': 'https://dapp-explorer.example.com',
          'X-Title': 'DApp Explorer'
        }
      };
    } else if (this.settings.baseUrl) {
      // For other custom endpoints
      modelOptions.configuration = {
        baseURL: this.settings.baseUrl
      };
    }
    
    return new ChatOpenAI(modelOptions);
  }

  private async searchDappInfo(dapp: DApp): Promise<string> {
    try {
      // Simulate web search by combining multiple search terms
      const searchTerms = [
        `${dapp.name} blockchain dapp review`,
        `${dapp.name} crypto features`,
        `${dapp.name} security audit`,
        `${dapp.name} ${dapp.category} competitors`,
        `${dapp.name} latest developments news`
      ];
      
      // In a real implementation, this would call a search API
      // For now, we'll return a placeholder
      return `Web search results for ${dapp.name} (This would be actual search results in production)`;
    } catch (error) {
      console.error('Error searching for dApp info:', error);
      return '';
    }
  }

  private createResearchChain(model: ChatOpenAI) {
    // Create the prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
You are a blockchain and dApp analyst with expertise in Web3 technologies. Conduct a comprehensive research on the following dApp and provide a detailed, accurate report with factual information.

dApp Name: {dappName}
Category: {dappCategory}
{dappSubcategory ? \`Subcategory: \${dappSubcategory}\` : ''}
Description: {dappDescription}
Supported Chains: {dappChains}
{dappTags ? \`Tags: \${dappTags}\` : ''}
{dappWebsite ? \`Website: \${dappWebsite}\` : ''}

Additional information from web searches:
{searchResults}

Please create a comprehensive report including:

1. Overview - A detailed explanation of this dApp's purpose, functionality, and position in the market
2. Key Features - List 5-8 main features with brief explanations
3. Recent Developments - Major developments or updates in the past year (with dates and descriptions)
4. Community Sentiment - Percentage of positive reviews (%) and amount of data analyzed
5. Main Competitors - List 3-5 major competing dApps with brief comparisons
6. Strengths - List 3-5 strengths with explanations
7. Weaknesses - List 3-5 weaknesses with explanations
8. Future Outlook - Detailed analysis of potential growth, challenges, and development roadmap
9. Security Audit Status - Whether the dApp has been audited, by whom, and key findings
10. Community Insights - Notable feedback or concerns from the user community
11. Technical Analysis - Assessment of the technical implementation, architecture, and code quality
12. Investment Potential - Analysis of the dApp as an investment opportunity (if applicable)
13. Risk Factors - Potential risks associated with using or investing in the dApp
14. Additional Resources - Links to relevant documentation, communities, or analysis

Your report should be objective, fact-based, and comprehensive. If information is limited, make reasonable inferences based on similar dApps, industry knowledge, and available data. Prioritize accuracy over speculation.

${this.parser.getFormatInstructions()}
`);

    // Create the chain
    return RunnableSequence.from([
      promptTemplate,
      model,
      this.parser
    ]);
  }

  private getFallbackData(): DeepResearchOutput {
    return {
      overview: "We couldn't retrieve comprehensive data at this time. Please try again later.",
      features: ["Data retrieval failed"],
      developments: [{ date: "Unknown", description: "Data retrieval failed" }],
      sentiment: { positive: 0 },
      competitors: ["Data retrieval failed"],
      strengths: ["Data retrieval failed"],
      weaknesses: ["Data retrieval failed"],
      futureOutlook: "We couldn't retrieve data at this time. Please try again later."
    };
  }
}

// Helper function to create a DeepResearchService instance
export function createDeepResearchService(settings: DeepResearchSettings): DeepResearchService {
  return new DeepResearchService(settings);
}

// Import zod for schema validation
import { z } from "zod";
