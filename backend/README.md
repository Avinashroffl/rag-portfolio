# Backend Architecture: Serverless RAG Proxy

This folder contains the offline data ingestion pipeline and the Cloudflare edge proxy required to securely communicate with the AI models.

## High-Availability Fallback System
The Cloudflare Worker acts as a secure proxy to hide your API keys. It employs a **High-Availability Fallback Mechanism**:
1. It attempts to query **Groq** (`openai/gpt-oss-20b`) first for lightning-fast speeds.
2. If Groq is unavailable, it instantly catches the error and falls back to **Google Gemini** (`gemini-flash-latest`).

## Local Development

To run the proxy locally, you need to set up your environment variables.

1. Create a `.dev.vars` file in `backend/worker/`.
2. Add your API keys:
   ```env
   LLM_API_KEY="your_google_gemini_key"
   GROQ_API_KEY="your_groq_api_key"
   ```
3. Start the local Wrangler server:
   ```bash
   cd worker
   npm install
   npx wrangler dev
   ```
   The proxy will start on `http://127.0.0.1:8787`.

## Generating Embeddings (Data Pipeline)

Whenever you add new markdown files to `pipeline/data/`, regenerate your vector store:

```bash
cd pipeline
pip install -r requirements.txt
python generate_embeddings.py
```
This automatically chunks the text, calculates the vectors using `sentence-transformers`, and injects the output `vector_store.json` directly into the frontend.

## Production Deployment

Deploying the Cloudflare Worker to the edge ensures zero server costs and infinite scalability.

1. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```
2. Upload your API keys securely to the edge:
   ```bash
   npx wrangler secret put LLM_API_KEY
   npx wrangler secret put GROQ_API_KEY
   ```
3. Deploy the worker:
   ```bash
   npx wrangler deploy
   ```
   *(Be sure to update `workerUrl` in `frontend/src/App.jsx` with your new production worker URL!)*
