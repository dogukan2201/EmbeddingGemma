import { useState, useEffect, useCallback } from 'react';
import { 
  initializeEmbeddingModel, 
  runEmbedding, 
  getServiceState
} from '../services/embeddingService';
import type { EmbeddingResult, EmbeddingServiceState } from '../services/embeddingService';

export const useEmbedding = () => {
  const [serviceState, setServiceState] = useState<EmbeddingServiceState>(getServiceState());
  const [results, setResults] = useState<EmbeddingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize model when hook is first used
  useEffect(() => {
    const initModel = async () => {
      if (!serviceState.isInitialized && !serviceState.isLoading) {
        console.log('Starting model initialization...');
        setServiceState(getServiceState()); // Update loading state
        
        try {
          await initializeEmbeddingModel();
          setServiceState(getServiceState());
          console.log('Model initialization completed');
        } catch (error) {
          console.error('Model initialization failed:', error);
          setServiceState(getServiceState());
        }
      }
    };

    initModel();
  }, []); // Run only once on mount

  // Update service state when it changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentState = getServiceState();
      if (
        currentState.isLoading !== serviceState.isLoading ||
        currentState.isInitialized !== serviceState.isInitialized ||
        currentState.error !== serviceState.error
      ) {
        setServiceState(currentState);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [serviceState]);

  // Function to run embedding
  const runEmbeddingQuery = useCallback(async (query: string, documents: string[]) => {
    if (!serviceState.isInitialized) {
      throw new Error('Model not loaded yet');
    }

    setIsProcessing(true);
    try {
      const result = await runEmbedding(query, documents);
      setResults(result);
      return result;
    } catch (error) {
      console.error('Embedding query failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [serviceState.isInitialized]);

  // Function to clear results
  const clearResults = useCallback(() => {
    setResults(null);
  }, []);

  return {
    // Service state
    isModelLoading: serviceState.isLoading,
    isModelReady: serviceState.isInitialized,
    modelError: serviceState.error,
    
    // Processing state
    isProcessing,
    
    // Results
    results,
    
    // Actions
    runEmbeddingQuery,
    clearResults
  };
};
