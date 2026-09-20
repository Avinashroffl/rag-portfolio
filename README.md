# Zero-Cost Serverless RAG Portfolio

Welcome to the ultimate, highly scalable, zero-downtime Retrieval-Augmented Generation (RAG) portfolio. This repository is built to be hosted **entirely for free**, while presenting a premium, glassmorphism UI.

By shifting vector math to the user's browser (WebAssembly) and AI requests to a secure edge proxy (Cloudflare Workers), you get a highly resilient AI-powered portfolio that scales infinitely and costs $0.

## Repository Architecture

- **`backend/`**: Contains the Python embedding pipeline and the Cloudflare Worker proxy.
  - Features a **High-Availability Fallback Mechanism**: The worker attempts to use Groq (OpenAI GPT-OSS) first for speed, and instantly falls back to Google Gemini if any errors occur.
- **`frontend/`**: Contains a static React/Vite web application.
  - Features a stunning animated glassmorphism UI, Markdown rendering, and Client-Side vector search via `Transformers.js`.

---

## 📚 How to Update the Knowledge Base (RAG Data)

This project features a **100% Automated CI/CD RAG Pipeline**. You never have to manually run Python or recalculate vectors yourself!

Whenever you want to add new facts, resume details, or change how the AI answers questions about you:

1. **Add Content:** Add or edit Markdown (`.md`) files inside the `backend/pipeline/data/` folder directly on GitHub or on your local machine.
2. **Push to GitHub:** Simply commit and push your changes to the `main` branch.
   ```bash
   git add .
   git commit -m "Added new skills to knowledge base"
   git push origin main
   ```
3. **Automated Magic:** GitHub Actions will instantly detect the push, boot up a Python ML environment, download the ML models, recalculate the vector embeddings for your AI, build the React app, and deploy it to the internet—all completely in the background for free!

---

## 💻 Running Locally in Development

You must run two separate terminals to test the full stack locally on your laptop.

### Terminal 1: Start the Edge Proxy
```bash
cd backend/worker
npm install
```
Create a file named `.dev.vars` inside `backend/worker/` and add your API keys:
```env
LLM_API_KEY="your_google_gemini_key"
GROQ_API_KEY="your_groq_api_key"
```
Start the local proxy:
```bash
npx wrangler dev
```

### Terminal 2: Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/` in your browser to chat with your portfolio!



---

## 🚀 Deploying to Production

This entire stack is designed to be deployed for free.

### 1. Deploy the Backend Proxy
Navigate to `backend/worker`. You need to securely upload your API keys to Cloudflare and deploy the worker.
```bash
npx wrangler secret put LLM_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler deploy
```

### 2. Deploy the Frontend
1. Open `frontend/src/App.jsx` and change the `workerUrl` to the live URL Cloudflare just gave you (e.g., `https://rag-portfolio-worker.<your-username>.workers.dev/`).
2. Build the frontend application:
```bash
cd frontend
npm run build
```
3. Host the resulting `dist/` folder for free on **GitHub Pages**, **Vercel**, or **Cloudflare Pages**. 

Traditional RAG pipelines require a running server (EC2 instance) and a paid vector database (Pinecone). This setup relies entirely on **static files, browser compute, and edge proxies**, making it immune to traditional server crashes and completely free.
