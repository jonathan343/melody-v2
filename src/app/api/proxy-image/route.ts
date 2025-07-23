import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const format = searchParams.get('format') || 'binary'; // 'binary' or 'base64'

  if (!imageUrl) {
    return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
  }

  // Only allow Spotify CDN images for security
  if (!imageUrl.includes('i.scdn.co')) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Melody/1.0)',
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    if (format === 'base64') {
      // Return as base64 data URL for Canvas usage
      // Convert ArrayBuffer to base64 using btoa and Uint8Array
      const bytes = new Uint8Array(imageBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const dataUrl = `data:${contentType};base64,${base64}`;
      
      return NextResponse.json({ 
        dataUrl,
        contentType,
        size: imageBuffer.byteLength 
      }, {
        headers: {
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      });
    } else {
      // Return binary image data
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        },
      });
    }
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}