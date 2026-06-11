import { handlePost_notificationsgenerateandsend } from '@/backend/controllers/aiController';

export async function POST(req, ctx) { return handlePost_notificationsgenerateandsend(req, ctx); }
