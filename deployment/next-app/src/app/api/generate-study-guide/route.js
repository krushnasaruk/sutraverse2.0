import { handlePost_generatestudyguide } from '@/backend/controllers/aiController';

export async function POST(req, ctx) { return handlePost_generatestudyguide(req, ctx); }
