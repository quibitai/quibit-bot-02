import { auth } from '@/lib/auth';
import { getVotesByChatId, voteMessage } from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId is required', { status: 400 });
  }

  const user = await auth();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const votes = await getVotesByChatId({ chatId });

  return Response.json(votes, { status: 200 });
}

export async function PATCH(request: Request) {
  const {
    chatId,
    messageId,
    type,
  }: { chatId: string; messageId: string; type: 'up' | 'down' } =
    await request.json();

  if (!chatId || !messageId || !type) {
    return new Response('messageId and type are required', { status: 400 });
  }

  const user = await auth();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  await voteMessage({
    messageId,
    userId: user.id,
    value: type === 'up' ? 1 : -1
  });

  return new Response('Message voted', { status: 200 });
}
