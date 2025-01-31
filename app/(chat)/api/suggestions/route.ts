import { auth } from '@/lib/auth';
import { getSuggestionsByDocumentId, updateSuggestionStatus } from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return new Response('Missing documentId', { status: 400 });
  }

  const user = await auth();

  if (!user || !user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const suggestions = await getSuggestionsByDocumentId({ documentId });

  return Response.json(suggestions, { status: 200 });
}

export async function PATCH(request: Request) {
  const { id, status }: { id: string; status: 'accepted' | 'rejected' } =
    await request.json();

  if (!id || !status) {
    return new Response('Missing id or status', { status: 400 });
  }

  const user = await auth();

  if (!user || !user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const suggestion = await updateSuggestionStatus({ id, status });

  return Response.json(suggestion, { status: 200 });
}
