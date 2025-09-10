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


  useEffect(() => {
    const initModel = async () => {
      if (!serviceState.isInitialized && !serviceState.isLoading) {
        console.log('Starting model initialization...');
        setServiceState(getServiceState()); 
        
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
  }, []); 


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


  const clearResults = useCallback(() => {
    setResults(null);
  }, []);

  return {

    isModelLoading: serviceState.isLoading,
    isModelReady: serviceState.isInitialized,
    modelError: serviceState.error,
    

    isProcessing,
    

    results,
    

    runEmbeddingQuery,
    clearResults
  };
};
