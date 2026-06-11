import { handlePost_upload, maxDuration } from '@/backend/controllers/uploadController';

export { maxDuration };

export async function POST(req, ctx) { return handlePost_upload(req, ctx); }
