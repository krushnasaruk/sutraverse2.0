import { handlePost_copilot } from '@/backend/controllers/copilotController';

export async function POST(req, ctx) { return handlePost_copilot(req, ctx); }
