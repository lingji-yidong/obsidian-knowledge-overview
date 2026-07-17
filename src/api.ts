import { requestUrl } from "obsidian";
import {
  ApiError,
  ChatResponseError,
  ChatTransportError,
  CompletionTruncatedError,
  GenerationCancelledError,
  executeChatCompletion,
  isRetryableStatus,
  type ChatCompletionOptions,
  type ChatRequestEvent,
} from "./chatCompletion";
import { buildChatCompletionsUrl } from "./requestUrl";

export {
  ApiError,
  ChatResponseError,
  ChatTransportError,
  CompletionTruncatedError,
  GenerationCancelledError,
  buildChatCompletionsUrl,
  isRetryableStatus,
};
export type { ChatCompletionOptions, ChatRequestEvent };

export interface ChatCompletionControls {
  scheduleRequest?: <T>(request: () => Promise<T>) => Promise<T>;
  shouldCancel?: () => boolean;
  onEvent?: (event: ChatRequestEvent) => void;
}

export async function callChatCompletion(
  options: ChatCompletionOptions,
  controls: ChatCompletionControls = {},
): Promise<string> {
  const scheduleRequest =
    controls.scheduleRequest ??
    (<T>(request: () => Promise<T>): Promise<T> => request());

  return executeChatCompletion(options, {
    shouldCancel: controls.shouldCancel,
    onEvent: controls.onEvent,
    transport: async (request) => {
      const response = await scheduleRequest(() =>
        requestUrl({
          url: request.url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          throw: false,
        }),
      );

      return {
        status: response.status,
        headers: response.headers,
        text: response.text,
        json: response.json as unknown,
      };
    },
  });
}
