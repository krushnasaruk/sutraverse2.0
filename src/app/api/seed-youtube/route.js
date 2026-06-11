import { handleGet_seedyoutube } from '@/backend/controllers/seedController';

export async function GET(req, ctx) { return handleGet_seedyoutube(req, ctx); }
