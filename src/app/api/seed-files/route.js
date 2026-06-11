import { handleGet_seedfiles } from '@/backend/controllers/seedController';

export async function GET(req, ctx) { return handleGet_seedfiles(req, ctx); }
