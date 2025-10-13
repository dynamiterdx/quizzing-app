import { NextResponse } from 'next/server';

export async function GET() {
  const azureKey = process.env.AZURE_OPENAI_API_KEY || null;
  const perplexityKey = process.env.PERPLEXITY_API_KEY || null;
  return NextResponse.json({
    azureKey,
    perplexityKey,
    hasAzureKey: Boolean(azureKey),
    hasPerplexityKey: Boolean(perplexityKey),
  });
}

