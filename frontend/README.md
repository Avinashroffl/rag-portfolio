# Frontend Architecture: Premium React UI

This folder contains the React-based frontend for your serverless RAG portfolio, built with Vite.

## Features

- **Premium Glassmorphism Design:** A highly interactive, floating frosted-glass UI built with dynamic CSS variables and an animated gradient mesh background.
- **100% Client-Side Vectors:** Uses `@xenova/transformers` (WASM) to run the embedding model directly inside the user's browser, guaranteeing zero latency vector lookups.
- **Rich Markdown Rendering:** Uses `react-markdown` to format the AI's responses perfectly with bolding, lists, and code blocks.
- **Lucide Icons:** Premium, crisp vector icons for UI elements.
- **Interactive Architecture Modal:** A beautiful animated modal explaining the underlying tech stack to recruiters.

## Local Development

To run the frontend UI locally on your laptop:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173/` in your browser. *(Make sure your Cloudflare Worker is also running locally on port 8787!)*

## Production Deployment

Because this application relies entirely on client-side compute and static files (including the `vector_store.json`), it can be hosted **100% for free** on GitHub Pages, Cloudflare Pages, or Vercel.

1. **Update Proxy URL:** In `src/App.jsx`, update the `workerUrl` constant to point to your deployed Cloudflare Worker URL instead of the local `127.0.0.1` proxy.
2. **Build the Application:**
   ```bash
   npm run build
   ```
3. **Deploy:** Upload the contents of the generated `dist/` folder to your static hosting provider of choice.

---
## ?? AI Context & Repository Navigation
*This section provides unified context for AI agents (like Claude, Copilot, Cursor) and developers to seamlessly navigate the codebase.*
- **[Main Project Overview](/README.md)**: Entry point, feature list, and quick start.
- **[Beginner Architecture Guide](/ARCHITECTURE.md)**: Visual Mermaid flowchart of the $0 Serverless RAG pipeline.
- **[Technical Architecture Diagram](/serverless_rag_architecture.md)**: Deep dive into the Cloudflare/WASM stack.
- **[Frontend Documentation](/frontend/README.md)**: React, Vite, and Client-Side Vector search setup.
- **[Backend Documentation](/backend/README.md)**: Cloudflare Worker Edge Proxy and Python CI/CD pipeline.
- **[Resume Knowledge Base](/backend/pipeline/data/avinash_data.md)**: The Markdown source-of-truth containing the portfolio data.
