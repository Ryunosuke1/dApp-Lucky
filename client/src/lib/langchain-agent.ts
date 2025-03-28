import { ChatOpenAI } from "@langchain/openai";
import {
  AgentStep,
  AgentActionOutputParser,
  AgentAction,
  AgentFinish,
} from "langchain/agents";
import { DynamicTool } from "@langchain/core/tools";
import { formatToOpenAIFunctionMessages } from "langchain/agents/format_utils";
import { RunnableSequence } from "@langchain/core/runnables";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { Tool } from "@langchain/core/tools";
import { renderTextDescription } from "langchain/tools/render";
import { DApp } from "@shared/schema";
import { ApiSettings } from "@shared/schema";

// Custom output parser for the agent's responses
class ChainOfThoughtOutputParser implements AgentActionOutputParser {
  async parse(text: string): Promise<AgentAction | AgentFinish> {
    try {
      // If the text includes a specific indicator that the agent is done
      if (text.includes("Final Answer:")) {
        const finalAnswerMatch = text.match(/Final Answer:(.*)/s);
        const finalAnswer = finalAnswerMatch 
          ? finalAnswerMatch[1].trim() 
          : text;
        
        return { returnValues: { output: finalAnswer }, log: text };
      }
      
      // If the text includes a tool call format
      const actionMatch = text.match(/Action:(.*?)\nAction Input:(.*)/s);
      if (actionMatch) {
        const action = actionMatch[1].trim();
        const actionInput = actionMatch[2].trim();
        
        return {
          tool: action,
          toolInput: actionInput,
          log: text,
        };
      }
      
      // If no structured format is detected, treat it as a final answer
      return { returnValues: { output: text }, log: text };
    } catch (error) {
      console.error("Error parsing output:", error);
      return { returnValues: { output: text }, log: text };
    }
  }
  
  getFormatInstructions(): string {
    return `Thought, Action, Action Input, Observation format:
Thought: (your reasoning)
Action: (the tool to use - one of: [search, analyze, synthesize])
Action Input: (the input to the tool)
Observation: (the result of the action)
... (repeat Thought/Action/Action Input/Observation as needed)
Thought: I've completed my research and gathered all the information I need.
Final Answer: (your comprehensive answer)`;
  }
}

/**
 * Research tool for dApp analysis that searches for basic information
 */
function createSearchTool(): Tool {
  return new DynamicTool({
    name: "search",
    description: `Searches for basic factual information about the dApp. 
Input should be a specific question about the dApp like "What is the main purpose of Uniswap?"`,
    func: async (input: string) => {
      // This is a simulated search function
      return `Finding information about: ${input}\n\nBased on the available data, here's what I found:\n- The query is relevant to dApp research\n- Additional web research would be needed for complete information\n- I'll use the provided dApp description and details to formulate a response`;
    },
  });
}

/**
 * Analysis tool that evaluates specific aspects of the dApp
 */
function createAnalyzeTool(): Tool {
  return new DynamicTool({
    name: "analyze",
    description: `Analyzes a specific aspect of the dApp in depth. 
Input should be a specific aspect to analyze like "Analyze the tokenomics of Uniswap" or "Analyze the security features of Compound"`,
    func: async (input: string) => {
      // This is a simulated analysis tool
      return `Performing in-depth analysis of: ${input}\n\nAnalysis results:\n- This is a key aspect to understand for this dApp\n- This requires critical thinking based on the available information\n- I will structure this analysis using the provided dApp context`;
    },
  });
}

/**
 * Synthesis tool that combines information for final insights
 */
function createSynthesizeTool(): Tool {
  return new DynamicTool({
    name: "synthesize",
    description: `Combines multiple pieces of information to create insights about the dApp. 
Input should be a request to combine knowledge like "Synthesize the user experience, market position, and future potential of Uniswap"`,
    func: async (input: string) => {
      // This is a simulated synthesis tool
      return `Synthesizing information about: ${input}\n\nSynthesis results:\n- This combines multiple perspectives from the research\n- This presents a cohesive view of the dApp\n- The synthesis will be used to form comprehensive conclusions`;
    },
  });
}

/**
 * Create a system prompt for the research agent
 */
function createSystemPrompt(dapp: DApp): string {
  return `You are an expert Web3 research agent specializing in dApp analysis. You're researching "${dapp.name}".

Available context:
${dapp.description ? `Description: ${dapp.description}` : 'No description available'}
${dapp.category ? `Category: ${dapp.category}` : ''}
${dapp.chains ? `Blockchains: ${dapp.chains.join(', ')}` : ''}

Your task is to conduct comprehensive research and provide a detailed analysis. Think step by step, using the available tools strategically. Start by searching for basic information, then analyze specific aspects, and finally synthesize your findings.

Your final answer should be structured as a comprehensive research report with these sections:
1. Overview - A concise summary of the dApp's purpose and significance
2. Key Features - Main functionalities and unique aspects
3. Technical Analysis - Blockchain implementation, security considerations
4. Market Position - Competitors, market share, and community sentiment
5. Future Outlook - Growth potential, upcoming developments
6. Strengths & Weaknesses - Key advantages and potential concerns

Remember to think step by step and use the tools in a logical sequence to build comprehensive understanding.`;
}

/**
 * Perform dApp research using a Chain of Thought agent
 */
export async function performAgentResearch(
  dapp: DApp,
  apiSettings: ApiSettings
): Promise<string> {
  try {
    // Determine which model name to use
    let modelName = apiSettings.modelName;
    if (apiSettings.modelName === "custom" && apiSettings.customModelValue) {
      modelName = apiSettings.customModelValue;
    }
    
    console.log(`Starting LangChain Agent research with model: ${modelName}`);
    
    // Create tools for the agent
    const tools = [
      createSearchTool(),
      createAnalyzeTool(),
      createSynthesizeTool()
    ];
    
    // Create LangChain chat model with the appropriate settings
    const llm = new ChatOpenAI({
      openAIApiKey: apiSettings.apiKey,
      modelName: modelName,
      temperature: 0.7,
      timeout: 120000, // 120 seconds
      configuration: {
        baseURL: apiSettings.baseUrl.endsWith('/') 
          ? apiSettings.baseUrl.slice(0, -1) 
          : apiSettings.baseUrl,
      }
    });
    
    // Create the prompt template for the agent
    const systemPrompt = createSystemPrompt(dapp);
    
    // Format the prompt with the system message and agent scratchpad
    const prompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(systemPrompt),
      new MessagesPlaceholder("chat_history"),
      new HumanMessage(`I need comprehensive research on the dApp "${dapp.name}". ${dapp.description || ""}`),
      new MessagesPlaceholder("agent_scratchpad"),
    ]);
    
    // Create the agent parser
    const outputParser = new ChainOfThoughtOutputParser();
    
    // Create the tool calling agent
    const agent = RunnableSequence.from([
      {
        chat_history: () => [],
        agent_scratchpad: (input: { agent_scratchpad: AgentStep[] }) => {
          if (!input.agent_scratchpad) {
            return "";
          }
          
          return input.agent_scratchpad.map((step) => {
            return [
              new AIMessage(step.action.log),
              new HumanMessage(`Observation: ${step.observation}`),
            ];
          }).flat();
        }
      },
      prompt,
      llm,
      new StringOutputParser(),
      outputParser,
    ]);

    // Define the tools the agent can use
    const toolExecutor = async (
      toolName: string, toolInput: string
    ): Promise<string> => {
      const tool = tools.find((t) => t.name === toolName);
      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }
      
      console.log(`Executing tool "${toolName}" with input "${toolInput}"`);
      const result = await tool.invoke(toolInput);
      console.log(`Tool "${toolName}" result: ${result}`);
      
      return result;
    };

    // Execute the agent
    const agentState = {
      agent_scratchpad: [] as AgentStep[],
    };

    // Maximum iterations to prevent infinite loops
    const maxIterations = 10;
    let iterations = 0;
    
    console.log("Starting agent research process...");
    
    // Loop to execute the agent with the tools
    while (iterations < maxIterations) {
      iterations += 1;
      console.log(`Agent research iteration ${iterations}...`);
      
      const output = await agent.invoke(agentState);
      
      // If this is a final answer, return it
      if ("returnValues" in output) {
        console.log("Agent research completed successfully");
        return output.returnValues.output;
      }
      
      // Otherwise, execute the tool and update the state
      const toolName = output.tool;
      const toolInput = output.toolInput;
      
      try {
        const observation = await toolExecutor(toolName, toolInput);
        agentState.agent_scratchpad = [
          ...agentState.agent_scratchpad,
          { action: output, observation } as AgentStep,
        ];
      } catch (error) {
        console.error(`Error executing tool ${toolName}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        agentState.agent_scratchpad = [
          ...agentState.agent_scratchpad,
          {
            action: output,
            observation: `Error executing tool ${toolName}: ${errorMessage}`,
          } as AgentStep,
        ];
      }
    }
    
    console.log(`Agent research reached maximum iterations (${maxIterations})`);
    
    // If we reach here, we've hit the maximum number of iterations
    const finalOutput = "Research process reached maximum number of iterations. Here is the partial analysis based on the research conducted so far:\n\n" + 
      agentState.agent_scratchpad.map(step => 
        `${step.action.log}\nObservation: ${step.observation}\n`
      ).join("\n");
    
    return finalOutput;
  } catch (error) {
    console.error("Error in agent research:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return `Error performing research: ${errorMessage}. Please try again or use a different model.`;
  }
}