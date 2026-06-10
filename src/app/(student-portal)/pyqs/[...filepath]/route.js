import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    const { filepath } = await params;
    
    // Normalize path
    let relativePath = Array.isArray(filepath) ? filepath.join('/') : filepath;
    try {
        relativePath = decodeURIComponent(relativePath);
    } catch (e) {
        console.error("Error decoding path:", e);
    }
    
    const url = new URL(request.url);
    url.pathname = `/api/downloads/pyqs/${relativePath}`;
    
    return NextResponse.redirect(url, 301);
}
