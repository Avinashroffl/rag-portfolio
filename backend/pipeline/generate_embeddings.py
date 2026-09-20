import json
import os
import logging
import sys
import glob
import uuid
from sentence_transformers import SentenceTransformer

# Configure extensive logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("generate_embeddings")

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def get_text_chunks(file_path):
    """
    Reads a file and splits it into chunks based on double newlines.
    This creates logical paragraphs.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Split by double newline (paragraphs) and strip whitespace
        chunks = [chunk.strip() for chunk in content.split("\n\n") if chunk.strip()]
        return chunks
    except Exception as e:
        logger.error(f"Failed to read or chunk file {file_path}: {e}", exc_info=True)
        return []

def main():
    logger.info("Starting dynamic embedding generation process...")
    vector_store = []
    
    try:
        # 1. Initialize the embedding model
        # This matches Transformers.js Xenova/all-MiniLM-L6-v2 exactly.
        model_name = "all-MiniLM-L6-v2"
        logger.info(f"Loading SentenceTransformer model: {model_name}")
        model = SentenceTransformer(model_name)
        
        # 2. Find all markdown and text files in the data directory
        logger.debug(f"Scanning for files in {DATA_DIR}")
        os.makedirs(DATA_DIR, exist_ok=True)
        
        files = glob.glob(os.path.join(DATA_DIR, "*.md")) + glob.glob(os.path.join(DATA_DIR, "*.txt"))
        
        if not files:
            logger.warning(f"No .md or .txt files found in {DATA_DIR}. The vector store will be empty.")
            
        # 3. Process each file
        for file_path in files:
            file_name = os.path.basename(file_path)
            logger.info(f"Processing file: {file_name}")
            
            chunks = get_text_chunks(file_path)
            if not chunks:
                logger.debug(f"No valid text chunks found in {file_name}")
                continue
                
            logger.info(f"Generating embeddings for {len(chunks)} chunks from {file_name}")
            
            # Generate embeddings for all chunks in the file at once
            embeddings = model.encode(chunks)
            
            # 4. Store in the vector store array
            for i, chunk in enumerate(chunks):
                # Convert the numpy array to a python list of floats
                embedding_list = [float(val) for val in embeddings[i]]
                
                vector_store.append({
                    "id": str(uuid.uuid4()),
                    "title": file_name,
                    "content": chunk,
                    "embedding": embedding_list
                })
            
        # Save to frontend public directory
        output_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "vector_store.json")
        logger.debug(f"Ensuring directory exists for output path: {output_path}")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        logger.info(f"Writing {len(vector_store)} total chunks to {output_path}")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(vector_store, f, indent=2)
            
        logger.info(f"Successfully saved vector store.")

    except Exception as e:
        logger.critical(f"Critical error during embedding generation pipeline: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
