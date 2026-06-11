import { handlePost_summarizepdf } from '@/backend/controllers/aiController';

export async function POST(req, ctx) { return handlePost_summarizepdf(req, ctx); }
