import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    NEWSAPI_KEY: !!process.env.NEWSAPI_KEY,
    ALPHAVANTAGE_KEY: !!process.env.ALPHAVANTAGE_KEY,
    HUGGING_FACE_API_KEY: !!process.env.HUGGING_FACE_API_KEY,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? null,
    node_env: process.env.NODE_ENV,
  });
}
