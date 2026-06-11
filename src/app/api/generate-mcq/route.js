import { handlePost_generatemcq } from '@/backend/controllers/aiController';

export async function POST(req, ctx) { return handlePost_generatemcq(req, ctx); }
