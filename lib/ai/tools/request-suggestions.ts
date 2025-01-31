import { z } from 'zod';
import { Model } from '../models';
import { User } from '@supabase/supabase-js';
import { DataStreamWriter, streamObject, tool } from 'ai';
import { getDocumentById, saveSuggestion } from '@/lib/db/queries';
import { Suggestion } from '@/lib/db/schema';
import { customModel } from '..';
import { generateUUID } from '@/lib/utils';

interface RequestSuggestionsProps {
  documentId: string;
  userId: string;
  content: string;
  model: Model;
  writer?: DataStreamWriter;
}

export const requestSuggestions = ({
  documentId,
  userId,
  content,
  model,
  writer,
}: RequestSuggestionsProps) =>
  tool({
    description: 'Request suggestions for improving a piece of text.',
    parameters: z.object({
      text: z.string().describe('The text to get suggestions for'),
    }),
    execute: async ({ text }) => {
      const document = await getDocumentById({ id: documentId });
      if (!document) {
        console.warn(`Document not found for ID: ${documentId}`);
        return { suggestions: [] };
      }

      const { elementStream } = streamObject({
        model: customModel(model.apiIdentifier),
        output: 'array',
        schema: z.object({
          original_text: z.string().describe('The original sentence'),
          suggested_text: z.string().describe('The suggested sentence'),
          description: z.string().describe('The description of the suggestion'),
        }),
        system: 'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
        prompt: text,
      });

      const suggestions: Array<Partial<Suggestion>> = [];
      
      for await (const element of elementStream) {
        const suggestion = {
          document_id: documentId,
          user_id: userId,
          original_text: element.original_text,
          suggested_text: element.suggested_text,
          description: element.description,
          status: 'pending' as const
        };

        if (writer) {
          writer.writeData({
            type: 'suggestion',
            data: suggestion
          });
        }

        suggestions.push(suggestion);
      }

      if (suggestions.length > 0) {
        await saveSuggestion(suggestions);
      }

      return { suggestions };
    },
  });
