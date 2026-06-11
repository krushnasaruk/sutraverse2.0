import { handlePost_notificationssend } from '@/backend/controllers/notificationssendController';

export async function POST(req, ctx) { return handlePost_notificationssend(req, ctx); }
