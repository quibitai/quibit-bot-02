import {
  CoreAssistantMessage,
  CoreMessage,
  CoreToolMessage,
  Message,
  ToolInvocation,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Message as DBMessage, Document } from '../lib/db/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: message.toolInvocations.map((toolInvocation) => {
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === toolInvocation.toolCallId,
          );

          if (toolResult) {
            return {
              ...toolInvocation,
              state: 'result',
              result: toolResult.result,
            };
          }

          return toolInvocation;
        }),
      };
    }

    return message;
  });
}

export function convertToolMessagesToChat(
  messages: Array<DBMessage | CoreToolMessage>,
): Array<DBMessage> {
  const result: Array<DBMessage> = [];
  
  for (const message of messages) {
    if ('role' in message && (message as CoreToolMessage).role === 'tool') {
      const toolMessages = addToolMessageToChat({
        toolMessage: message as CoreToolMessage,
        messages: result.map(msg => ({
          ...msg,
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        })),
      });
      result.push(...toolMessages.map(msg => ({
        id: msg.id,
        chat_id: 'default',  // You'll need to provide the actual chat_id
        user_id: 'system',   // Tool messages are from the system
        role: msg.role as "user" | "system" | "assistant",
        content: msg.content,
        created_at: new Date().toISOString()
      })));
    } else {
      result.push(message as DBMessage);
    }
  }
  
  return result;
}

export function convertToUIMessages(
  messages: Array<DBMessage>,
): Array<Message> {
  return messages.reduce((chatMessages: Array<Message>, message) => {
    if ('role' in message && (message as any).role === 'tool') {
      return addToolMessageToChat({
        toolMessage: message as unknown as CoreToolMessage,
        messages: chatMessages,
      });
    }

    let textContent = '';
    const toolInvocations: Array<ToolInvocation> = [];

    if (typeof message.content === 'string') {
      textContent = message.content;
    } else if (Array.isArray(message.content)) {
      for (const content of message.content) {
        if (typeof content === 'string') {
          textContent += content;
          continue;
        }
        const typedContent = content as { type: string; text?: string; toolCallId?: string; toolName?: string; args?: any };
        if (typedContent && typedContent.type === 'text' && typedContent.text) {
          textContent += typedContent.text;
        } else if (typedContent && typedContent.type === 'tool-call' && typedContent.toolCallId && typedContent.toolName) {
          toolInvocations.push({
            state: 'call',
            toolCallId: typedContent.toolCallId,
            toolName: typedContent.toolName,
            args: typedContent.args || {},
          });
        }
      }
    } else if (message.content && typeof message.content === 'object') {
      const content = message.content as { text?: string; toolCallId?: string; toolName?: string; args?: any };
      if (content.text) {
        textContent = content.text;
      }
      if (content.toolCallId && content.toolName) {
        toolInvocations.push({
          state: 'call',
          toolCallId: content.toolCallId,
          toolName: content.toolName,
          args: content.args || {},
        });
      }
    }

    chatMessages.push({
      id: message.id,
      role: message.role as Message['role'],
      content: textContent,
      toolInvocations: toolInvocations.length > 0 ? toolInvocations : undefined,
    });

    return chatMessages;
  }, []);
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function sanitizeResponseMessages(
  messages: Array<ResponseMessage>,
): Array<ResponseMessage> {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text'
          ? content.text.length > 0
          : true,
    );

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function sanitizeUIMessages(messages: Array<Message>): Array<Message> {
  const messagesBySanitizedToolInvocations = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (!message.toolInvocations) return message;

    const toolResultIds: Array<string> = [];

    for (const toolInvocation of message.toolInvocations) {
      if (toolInvocation.state === 'result') {
        toolResultIds.push(toolInvocation.toolCallId);
      }
    }

    const sanitizedToolInvocations = message.toolInvocations.filter(
      (toolInvocation) =>
        toolInvocation.state === 'result' ||
        toolResultIds.includes(toolInvocation.toolCallId),
    );

    return {
      ...message,
      toolInvocations: sanitizedToolInvocations,
    };
  });

  return messagesBySanitizedToolInvocations.filter(
    (message) =>
      message.content.length > 0 ||
      (message.toolInvocations && message.toolInvocations.length > 0),
  );
}

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
): string {
  if (!documents[index]) return new Date().toISOString();
  return documents[index].created_at;
}
