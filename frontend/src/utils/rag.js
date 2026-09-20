import { pipeline, env } from '@xenova/transformers';

// Skip local model check since we are running entirely in the browser
env.allowLocalModels = false;

class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      console.log(`[RAG Utility] Initializing pipeline model: ${this.model}`);
      try {
        this.instance = pipeline(this.task, this.model, { progress_callback });
      } catch (err) {
        console.error(`[RAG Utility] Failed to initialize pipeline:`, err);
        throw err;
      }
    }
    return this.instance;
  }
}

/**
 * Calculates the cosine similarity between two vectors.
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Perform a local vector search against the provided vector store.
 */
export async function searchVectorStore(query, vectorStore, topK = 2) {
  console.log(`[RAG Utility] Starting search for query: "${query}" against ${vectorStore.length} items`);
  
  try {
    const extractor = await PipelineSingleton.getInstance();
    
    // Generate embeddings for the query
    console.log(`[RAG Utility] Extracting embeddings for query...`);
    const output = await extractor(query, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(output.data);
    
    console.log(`[RAG Utility] Embeddings generated successfully, calculating similarities...`);
    
    // Calculate similarities
    const results = vectorStore.map(item => {
      const similarity = cosineSimilarity(queryEmbedding, item.embedding);
      return { ...item, similarity };
    });

    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);

    const topResults = results.slice(0, topK);
    console.log(`[RAG Utility] Top ${topK} results retrieved with max similarity: ${topResults[0]?.similarity?.toFixed(4) || 0}`);
    return topResults;
  } catch (error) {
    console.error(`[RAG Utility] Error during vector search:`, error);
    throw error;
  }
}
