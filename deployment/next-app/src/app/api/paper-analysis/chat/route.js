import { handlePost_paperanalysischat } from '@/backend/controllers/paperanalysischatController';

export async function POST(req, ctx) { return handlePost_paperanalysischat(req, ctx); }
