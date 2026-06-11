import { handleGet_listpapers } from '@/backend/controllers/listpapersController';

export async function GET(req, ctx) { return handleGet_listpapers(req, ctx); }
