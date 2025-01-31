import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
  DataStreamWriter,
} from 'ai';

import { customModel } from '@/lib/ai';
import { models, Model } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';

import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';
import { auth } from '@/lib/auth';

export const maxDuration = 60;

type AllowedTools =
  | 'createDocument'
  | 'updateDocument'
  | 'requestSuggestions'
  | 'getWeather';

const blocksTools: AllowedTools[] = [
  'createDocument',
  'updateDocument',
  'requestSuggestions',
];

const weatherTools: AllowedTools[] = ['getWeather'];
const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];

interface SessionContext {
  user: Pick<User, 'id'>;
}

interface ToolContext {
  session: SessionContext;
  dataStream: any;
  model: any;
}

interface CreateDocumentProps {
  model: Model;
  session: User;
  dataStream: DataStreamWriter;
}

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
  }: { id: string; messages: Array<Message>; modelId: string } =
    await request.json();

  const user = await auth();

  if (!user || !user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const userMessage = getMostRecentUserMessage(messages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: user.id, title });
  }

  await saveMessages({
    messages: [{ 
      ...userMessage,
      role: userMessage.role as 'user' | 'assistant' | 'system',
      created_at: new Date().toISOString(), 
      chat_id: id,
      user_id: user.id,
      content: userMessage.content
    }],
  });

  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: customModel(model.apiIdentifier),
        system: systemPrompt,
        messages,
        maxSteps: 5,
        experimental_activeTools: allTools,
        experimental_transform: smoothStream({ chunking: 'word' }),
        experimental_generateMessageId: generateUUID,
        tools: {
          getWeather,
          createDocument: createDocument({ 
            model,
            session: user,
            dataStream
          }),
          updateDocument: updateDocument({ 
            model,
            session: user,
            dataStream
          }),
          requestSuggestions: requestSuggestions({
            documentId: id,
            userId: user.id,
            content: '',
            model,
            writer: dataStream
          }),
        },
        onFinish: async ({ response }) => {
          if (user.id) {
            try {
              const responseMessagesWithoutIncompleteToolCalls =
                sanitizeResponseMessages(response.messages);

              await saveMessages({
                messages: responseMessagesWithoutIncompleteToolCalls.map(
                  (message) => {
                    return {
                      id: message.id,
                      chat_id: id,
                      user_id: user.id,
                      role: message.role as 'user' | 'assistant' | 'system',
                      content: JSON.stringify(message.content),
                      created_at: new Date().toISOString(),
                    };
                  },
                ),
              });
            } catch (error) {
              console.error('Failed to save chat');
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
      });

      result.mergeIntoDataStream(dataStream);
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
