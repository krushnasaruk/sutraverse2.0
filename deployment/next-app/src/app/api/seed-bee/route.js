import { handleGet_seedbee } from '@/backend/controllers/seedController';

export async function GET(req, ctx) { return handleGet_seedbee(req, ctx); }
