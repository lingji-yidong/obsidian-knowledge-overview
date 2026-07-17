import assert from "node:assert/strict";
import test from "node:test";
import {
  ApiError,
  ChatResponseError,
  CompletionTruncatedError,
  GenerationCancelledError,
  clearCapabilityCache,
  executeChatCompletion,
  type ChatCompletionOptions,
  type ChatHttpResponse,
} from "../src/chatCompletion";
import { DEFAULT_SETTINGS } from "../src/settings";

const OPTIONS: ChatCompletionOptions = {
  apiKey: "test-key",
  apiBaseUrl: "https://example.test/v1",
  model: "test-model",
  userPrompt: "user prompt",
  systemPrompt: "system prompt",
  maxCompletionTokens: 1000,
  temperature: 0.2,
  reasoningEffort: null,
  verbosity: "low",
};

function successResponse(
  content = "chapter",
  finishReason: string | null = "stop",
): ChatHttpResponse {
  return {
    status: 200,
    headers: {},
    text: "",
    json: {
      model: "provider-resolved-model",
      choices: [
        {
          message: { content },
          finish_reason: finishReason,
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    },
  };
}

function errorResponse(
  status: number,
  message: string,
  headers: Record<string, string> = {},
): ChatHttpResponse {
  return {
    status,
    headers,
    text: message,
    json: { error: { message } },
  };
}

void test("successful completion sends exactly one HTTP request", async () => {
  clearCapabilityCache();
  let requests = 0;
  let successfulModel: string | undefined;
  const content = await executeChatCompletion(OPTIONS, {
    transport: async (request) => {
      requests += 1;
      const body = JSON.parse(request.body) as {
        messages: Array<{ role: string }>;
        temperature?: number;
        verbosity?: string;
      };
      assert.deepEqual(
        body.messages.map((message) => message.role),
        ["system", "user"],
      );
      assert.equal(body.temperature, 0.2);
      assert.equal(body.verbosity, "low");
      return successResponse();
    },
    onEvent: (event) => {
      if (event.kind === "success") successfulModel = event.model;
    },
  });

  assert.equal(content, "chapter");
  assert.equal(requests, 1);
  assert.equal(successfulModel, "provider-resolved-model");
});

void test("default temperature is omitted from the provider request", async () => {
  clearCapabilityCache();
  let requestBody: Record<string, unknown> = {};

  await executeChatCompletion(
    { ...OPTIONS, temperature: DEFAULT_SETTINGS.temperature },
    {
      transport: async (request) => {
        requestBody = JSON.parse(request.body) as Record<string, unknown>;
        return successResponse();
      },
    },
  );

  assert.equal(DEFAULT_SETTINGS.temperature, null);
  assert.equal(
    Object.prototype.hasOwnProperty.call(requestBody, "temperature"),
    false,
  );
});

void test("authentication errors are not retried", async () => {
  clearCapabilityCache();
  let requests = 0;

  await assert.rejects(
    executeChatCompletion(OPTIONS, {
      transport: async () => {
        requests += 1;
        return errorResponse(401, "invalid API key");
      },
      delay: async () => undefined,
    }),
    (error: unknown) => error instanceof ApiError && error.status === 401,
  );
  assert.equal(requests, 1);
});

void test("cancelled logical calls never reach the transport", async () => {
  clearCapabilityCache();
  let requests = 0;

  await assert.rejects(
    executeChatCompletion(OPTIONS, {
      shouldCancel: () => true,
      transport: async () => {
        requests += 1;
        return successResponse();
      },
    }),
    GenerationCancelledError,
  );
  assert.equal(requests, 0);
});

void test("rate limits retry at most three physical attempts and honor Retry-After", async () => {
  clearCapabilityCache();
  let requests = 0;
  const delays: number[] = [];

  await assert.rejects(
    executeChatCompletion(OPTIONS, {
      transport: async () => {
        requests += 1;
        return errorResponse(429, "rate limited", { "Retry-After": "2" });
      },
      delay: async (milliseconds) => {
        delays.push(milliseconds);
      },
      random: () => 0.5,
    }),
    (error: unknown) => error instanceof ApiError && error.status === 429,
  );

  assert.equal(requests, 3);
  assert.deepEqual(delays, [2000, 2000]);
});

void test("truncated completions are not repeated", async () => {
  clearCapabilityCache();
  let requests = 0;

  await assert.rejects(
    executeChatCompletion(OPTIONS, {
      transport: async () => {
        requests += 1;
        return successResponse("partial", "length");
      },
      delay: async () => undefined,
    }),
    CompletionTruncatedError,
  );
  assert.equal(requests, 1);
});

void test("empty final content is rejected even when usage reports output tokens", async () => {
  clearCapabilityCache();
  let requests = 0;

  await assert.rejects(
    executeChatCompletion(OPTIONS, {
      transport: async () => {
        requests += 1;
        return successResponse("");
      },
    }),
    ChatResponseError,
  );
  assert.equal(requests, 1);
});

void test("DeepSeek uses max_tokens and an explicit thinking toggle", async () => {
  clearCapabilityCache();
  let requestBody: Record<string, unknown> = {};

  await executeChatCompletion(
    {
      ...OPTIONS,
      apiBaseUrl: "https://api.deepseek.com",
      thinkingMode: "disabled",
    },
    {
      transport: async (request) => {
        requestBody = JSON.parse(request.body) as Record<string, unknown>;
        return successResponse();
      },
    },
  );

  assert.equal(requestBody.max_tokens, 1000);
  assert.equal(requestBody.max_completion_tokens, undefined);
  assert.deepEqual(requestBody.thinking, { type: "disabled" });
});

void test("auto thinking mode omits the toggle and keeps only final content", async () => {
  clearCapabilityCache();
  let requestBody: Record<string, unknown> = {};
  let reasoningTokens: number | undefined;

  const content = await executeChatCompletion(
    { ...OPTIONS, thinkingMode: "auto" },
    {
      transport: async (request) => {
        requestBody = JSON.parse(request.body) as Record<string, unknown>;
        return {
          status: 200,
          headers: {},
          text: "",
          json: {
            model: "always-thinking-model",
            choices: [
              {
                message: {
                  reasoning_content: "private reasoning",
                  content: "final chapter",
                },
                finish_reason: "stop",
              },
            ],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 30,
              total_tokens: 40,
              completion_tokens_details: { reasoning_tokens: 12 },
            },
          },
        };
      },
      onEvent: (event) => {
        if (event.kind === "success") reasoningTokens = event.reasoningTokens;
      },
    },
  );

  assert.equal(requestBody.thinking, undefined);
  assert.equal(content, "final chapter");
  assert.equal(reasoningTokens, 12);
});

void test("targeted compatibility fallback is cached per endpoint and model", async () => {
  clearCapabilityCache();
  const requestBodies: Array<Record<string, unknown>> = [];
  let requests = 0;
  const compatibilityFields: string[][] = [];
  const transport = async (request: { body: string }): Promise<ChatHttpResponse> => {
    requests += 1;
    const body = JSON.parse(request.body) as Record<string, unknown>;
    requestBodies.push(body);
    if (requests === 1) {
      return errorResponse(400, "unsupported parameter: temperature");
    }
    return successResponse();
  };

  const options: ChatCompletionOptions = {
    ...OPTIONS,
    reasoningEffort: "high",
    thinkingMode: "enabled",
  };
  await executeChatCompletion(options, {
    transport,
    onEvent: (event) => {
      if (event.kind === "compatibility") {
        compatibilityFields.push(event.compatibilityFields ?? []);
      }
    },
  });
  await executeChatCompletion(options, { transport });

  assert.equal(requests, 3);
  assert.equal(requestBodies[0].temperature, 0.2);
  assert.equal(requestBodies[1].temperature, undefined);
  assert.equal(requestBodies[2].temperature, undefined);
  assert.equal(requestBodies[1].reasoning_effort, "high");
  assert.equal(requestBodies[2].reasoning_effort, "high");
  assert.equal(requestBodies[1].verbosity, "low");
  assert.deepEqual(requestBodies[1].thinking, { type: "enabled" });
  assert.deepEqual(compatibilityFields, [["temperature"]]);
});

void test("thinking fallback does not silently remove reasoning or verbosity", async () => {
  clearCapabilityCache();
  const requestBodies: Array<Record<string, unknown>> = [];
  let requests = 0;

  await executeChatCompletion(
    {
      ...OPTIONS,
      temperature: null,
      reasoningEffort: "xhigh",
      thinkingMode: "enabled",
    },
    {
      transport: async (request) => {
        requests += 1;
        const body = JSON.parse(request.body) as Record<string, unknown>;
        requestBodies.push(body);
        return requests === 1
          ? errorResponse(400, "unsupported parameter: thinking")
          : successResponse();
      },
    },
  );

  assert.equal(requests, 2);
  assert.deepEqual(requestBodies[0].thinking, { type: "enabled" });
  assert.equal(requestBodies[1].thinking, undefined);
  assert.equal(requestBodies[1].reasoning_effort, "xhigh");
  assert.equal(requestBodies[1].verbosity, "low");
});

void test("token-limit field falls back only when the provider names it", async () => {
  clearCapabilityCache();
  const requestBodies: Array<Record<string, unknown>> = [];
  let requests = 0;

  await executeChatCompletion(OPTIONS, {
    transport: async (request) => {
      requests += 1;
      const body = JSON.parse(request.body) as Record<string, unknown>;
      requestBodies.push(body);
      return requests === 1
        ? errorResponse(400, "unknown field max_completion_tokens")
        : successResponse();
    },
  });

  assert.equal(requests, 2);
  assert.equal(requestBodies[0].max_completion_tokens, 1000);
  assert.equal(requestBodies[1].max_completion_tokens, undefined);
  assert.equal(requestBodies[1].max_tokens, 1000);
});
