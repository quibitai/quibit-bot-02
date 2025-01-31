import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/lib/auth';
import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const user = await auth();

  if (chat.visibility === 'private') {
    if (!user) {
      return notFound();
    }

    if (user.id !== chat.user_id) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    chatId: id,
  });

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={convertToUIMessages(messagesFromDb)}
        selectedModelId={selectedModelId}
        selectedVisibilityType={chat.visibility}
        isReadonly={user?.id !== chat.user_id}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
