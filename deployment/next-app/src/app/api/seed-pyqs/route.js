import { handleGet_seedpyqs } from '@/backend/controllers/seedController';

export async function GET(req, ctx) { return handleGet_seedpyqs(req, ctx); }
