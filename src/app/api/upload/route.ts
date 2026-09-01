import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadImage } from '@/lib/cloudinary';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateImage(base64Data: string): { valid: boolean; error?: string } {
  if (!base64Data || typeof base64Data !== 'string') {
    return { valid: false, error: 'No image data provided' };
  }

  // Check for valid base64 format with MIME type prefix
  const match = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return { valid: false, error: 'Invalid image format. Expected data:image/{type};base64,...' };
  }

  const mimeType = match[1];
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: `Invalid image type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` };
  }

  // Calculate actual file size from base64 string
  const base64Str = match[2];
  const fileSize = Math.ceil((base64Str.length * 3) / 4);
  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, error: `Image too large (${(fileSize / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { image, folder } = body;

    const validation = validateImage(image);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const url = await uploadImage(image, folder || 'products');

    return NextResponse.json({ success: true, url });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
