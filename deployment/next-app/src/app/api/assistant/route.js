import { handlePost_assistant } from '@/backend/controllers/assistantController';

export async function POST(req, ctx) { return handlePost_assistant(req, ctx); }
