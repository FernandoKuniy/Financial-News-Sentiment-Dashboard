# Financial News Sentiment Dashboard

A real-time financial news sentiment analysis dashboard. Enter a stock ticker (e.g., `AAPL`) or topic and see recent headlines analyzed with **FinBERT** sentiment, along with sentiment distribution and stock price trend.

---

## Features

* 🔎 **Search any ticker or topic** — e.g., `AAPL`, `TSLA`, `inflation`.
* 📰 **News fetching** — uses [NewsAPI](https://newsapi.org/) to pull 20–30 recent English headlines.
* 🤖 **Sentiment analysis** — headlines scored via [FinBERT](https://huggingface.co/ProsusAI/finbert) (positive, neutral, negative).
* 📊 **Dashboard UI** — summary cards, sentiment pie chart, labeled headlines.
* 💹 **Price integration** — Alpha Vantage 7/14/30 day stock closing prices with mini line chart.
* 🔄 **Auto-refresh** — refreshes every 2–3 minutes to mimic real-time updates.
* ⚡ **Optimizations** — caching, singleflight requests, rate limiting for Alpha Vantage.

---

## Tech Stack

* **Frontend**: [Next.js 13+](https://nextjs.org/) (React, TypeScript)
* **UI**: Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/), [lucide-react](https://lucide.dev/), [recharts](https://recharts.org/)
* **State/Data**: SWR (auto-refresh, caching)
* **NLP**: Hugging Face Inference API (FinBERT)
* **Data Sources**:
  * NewsAPI (financial news)
  * Alpha Vantage (stock prices)
* **Deployment**: Vercel (frontend + API routes)

---

## Getting Started

### 1. Clone Repo

```bash
git clone https://github.com/FernandoKuniy/Financial-News-Sentiment-Dashboard.git
cd Financial-News-Sentiment-Dashboard
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Variables

Create a `.env.local` file:

```bash
NEWSAPI_KEY=your_newsapi_key
ALPHAVANTAGE_KEY=your_alpha_vantage_key
HF_TOKEN=your_huggingface_api_token
NEXT_PUBLIC_APP_NAME="Financial News Sentiment"
```

### 4. Run Dev Server

```bash
pnpm dev
```

Visit: [http://localhost:3000](http://localhost:3000)

### 5. Build & Deploy

```bash
pnpm build
pnpm start
```

Deploy easily on **Vercel**:

* Connect repo
* Add env vars in project settings
* Deploy!

---

## API Routes

### `/api/news?q=AAPL&limit=30`

Fetch normalized news articles from NewsAPI.

### `/api/sentiment`

POST endpoint to run FinBERT sentiment on headlines.

### `/api/analyze?q=AAPL`

Full pipeline: fetch news → dedupe → sentiment → aggregate summary + top headlines.

### `/api/price?q=AAPL&range=7d`

Stock closing prices for last N trading days (7, 14, 30). Cached + rate-limited.

---

## Development Notes

* **Rate Limits**
  * NewsAPI free tier: 100 requests/day.
  * Alpha Vantage free tier: 5 requests/min, 500/day.
  * Hugging Face Inference API: ~30 calls/minute (depends on plan).
* **Caching**: In-memory cache + singleflight to dedupe concurrent calls.
* **Testing**: Jest/Playwright for unit + E2E smoke tests.

---

## License

MIT
