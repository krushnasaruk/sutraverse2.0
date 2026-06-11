import { handlePost_whatsapp } from '@/backend/controllers/whatsappController';

export async function POST(req, ctx) { return handlePost_whatsapp(req, ctx); }
