import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { auth } from '@/lib/auth';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'File size should be less than 5MB',
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
      message: 'File type should be JPEG or PNG',
    }),
});

export async function POST(request: Request) {
  const user = await auth();

  if (!user || !user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return new Response('No file found', { status: 400 });
  }

  const filename = file.name;
  const fileBuffer = await file.arrayBuffer();

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .storage
      .from('uploads')
      .upload(`${user.id}/${filename}`, fileBuffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return new Response('Error uploading file', { status: 500 });
  }
}
