import { AutoModel, AutoTokenizer, matmul } from "@huggingface/transformers";


const retryWithBackoff = async (fn: () => Promise<any>, maxRetries: number = 3, baseDelay: number = 1000): Promise<any> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      console.error(`Attempt ${i + 1}/${maxRetries} failed:`, error.message);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

const loadModelWithFallback = async (modelId: string) => {
  const options = [
    { dtype: "q8" as const, device: "wasm" as const },
    { dtype: "q4" as const, device: "wasm" as const }, 
    { dtype: "fp32" as const, device: "wasm" as const },
    { dtype: "q8" as const, device: "webgpu" as const },
    { dtype: "q4" as const, device: "webgpu" as const }, 
    { dtype: "fp32" as const, device: "webgpu" as const },
  ];
  
  for (const option of options) {
    try {
      console.log(`Loading model: ${modelId} (${JSON.stringify(option)})`);
      
      const tokenizer = await retryWithBackoff(() => 
        AutoTokenizer.from_pretrained(modelId)
      );
      
      const model = await retryWithBackoff(() => 
        AutoModel.from_pretrained(modelId, option)
      );
      
      console.log(`Model loaded successfully: ${JSON.stringify(option)}`);
      return { tokenizer, model };
      
    } catch (error: any) {
      console.error(`${JSON.stringify(option)} option failed:`, error.message);
      continue;
    }
  }
  
  throw new Error("No model configuration worked");
};



export interface EmbeddingResult {
  similarities: number[];
  ranking: Array<{ index: number; score: number; text: string; }>;
  query: string;
}

export interface EmbeddingServiceState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}


let serviceState: EmbeddingServiceState = {
  isLoading: false,
  isInitialized: false,
  error: null
};

let tokenizer: any = null;
let model: any = null;

const MODEL_ID = "onnx-community/embeddinggemma-300m-ONNX";


export const initializeEmbeddingModel = async (): Promise<void> => {
  if (serviceState.isInitialized) {
    return;
  }

  serviceState.isLoading = true;
  serviceState.error = null;

  try {
    const result = await loadModelWithFallback(MODEL_ID);
    tokenizer = result.tokenizer;
    model = result.model;
    
    serviceState.isInitialized = true;
    serviceState.isLoading = false;
    console.log("Embedding model loaded successfully!");
    
  } catch (error: any) {
    serviceState.error = error.message;
    serviceState.isLoading = false;
    console.error("Model loading error:", error);
    throw error;
  }
};


export const runEmbedding = async (
  query: string, 
  documents: string[]
): Promise<EmbeddingResult> => {
  
  if (!serviceState.isInitialized) {
    throw new Error("Model not loaded yet. Call initializeEmbeddingModel() first.");
  }

  try {
    console.log("Starting embedding process...");
    
    const prefixes = {
      query: "task: search result | query: ",
      document: "title: none | text: ",
    };
    
    const formattedQuery = prefixes.query + query;
    const formattedDocuments = documents.map((doc) => prefixes.document + doc);

    console.log("Tokenizing...");
    const inputs = await retryWithBackoff(() => 
      tokenizer([formattedQuery, ...formattedDocuments], { padding: true })
    );

    console.log("Running model inference...");
    const { sentence_embedding } = await retryWithBackoff(() => 
      model(inputs)
    );

    console.log("Calculating similarity scores...");
    
    const scores = await matmul(sentence_embedding, sentence_embedding.transpose(1, 0));
    const similarities = scores.tolist()[0].slice(1);
    
    console.log("Similarity scores:", similarities);

    const ranking = similarities
      .map((score: number, index: number) => ({ 
        index, 
        score, 
        text: documents[index] 
      }))
      .sort((a: any, b: any) => b.score - a.score);
    
    console.log("Ranking results:", ranking);
    
    return {
      similarities,
      ranking,
      query
    };
    
  } catch (error: any) {
    console.error("Embedding error:", error);
    throw error;
  }
};


export const getServiceState = (): EmbeddingServiceState => {
  return { ...serviceState };
};

export const resetEmbeddingService = (): void => {
  serviceState = {
    isLoading: false,
    isInitialized: false,
    error: null
  };
  tokenizer = null;
  model = null;
};
