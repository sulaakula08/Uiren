import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";

/** Ошибка AI-слоя, которую UI показывает пользователю дословно. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly code: "NO_KEY" | "REFUSAL" | "BAD_OUTPUT" | "UPSTREAM",
  ) {
    super(message);
    this.name = "AiError";
  }
}

export const MODEL_HEAVY = process.env.UIREN_MODEL_HEAVY || "claude-opus-5";
export const MODEL_FAST = process.env.UIREN_MODEL_FAST || "claude-sonnet-5";

let cached: Anthropic | null = null;

export function anthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AiError(
      "ANTHROPIC_API_KEY не задан. Добавьте ключ в .env и перезапустите сервер.",
      "NO_KEY",
    );
  }
  if (!cached) cached = new Anthropic({ apiKey, maxRetries: 2 });
  return cached;
}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

type JsonSchema = Record<string, unknown>;

export type StructuredCall<T> = {
  /** Какая функция продукта вызывает модель — попадает в AiLog и в метрику часов. */
  feature: string;
  userId: string;
  minutesSaved?: number;
  model?: string;
  system: string;
  prompt: string;
  /** Имя инструмента, через который модель возвращает строгий JSON. */
  toolName: string;
  toolDescription: string;
  schema: JsonSchema;
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens?: number;
  validate: (raw: unknown) => T;
};

/**
 * Строгий JSON через tool use: модель обязана вызвать единственный инструмент,
 * схема которого и есть контракт ответа. `strict: true` гарантирует,
 * что `input` валидируется по схеме на стороне API.
 */
export async function runStructured<T>(call: StructuredCall<T>): Promise<T> {
  const model = call.model ?? MODEL_FAST;
  const started = Date.now();

  try {
    const client = anthropic();
    const response = await client.messages.create({
      model,
      max_tokens: call.maxTokens ?? 8000,
      system: call.system,
      output_config: { effort: call.effort ?? "medium" },
      tools: [
        {
          name: call.toolName,
          description: call.toolDescription,
          strict: true,
          input_schema: call.schema as never,
        },
      ],
      tool_choice: { type: "tool", name: call.toolName },
      messages: [{ role: "user", content: call.prompt }],
    });

    if (response.stop_reason === "refusal") {
      throw new AiError(
        "Модель отклонила запрос по соображениям безопасности.",
        "REFUSAL",
      );
    }

    const raw = extractToolInput(response, call.toolName);
    const parsed = call.validate(raw);

    await logAi({
      userId: call.userId,
      feature: call.feature,
      model,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      minutesSaved: call.minutesSaved ?? 0,
      ok: true,
    });

    return parsed;
  } catch (error) {
    const message =
      error instanceof AiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Неизвестная ошибка";

    await logAi({
      userId: call.userId,
      feature: call.feature,
      model,
      inputTokens: 0,
      outputTokens: 0,
      minutesSaved: 0,
      ok: false,
      error: message.slice(0, 500),
    });

    if (error instanceof AiError) throw error;
    throw new AiError(
      `AI-запрос не удался (${Math.round((Date.now() - started) / 1000)}с): ${message}`,
      "UPSTREAM",
    );
  }
}

/**
 * Достаём вход инструмента. Если по какой-то причине модель ответила текстом,
 * пробуем вытащить JSON — так одна аномалия не роняет весь экран.
 */
function extractToolInput(
  response: Anthropic.Message,
  toolName: string,
): unknown {
  for (const block of response.content) {
    if (block.type === "tool_use" && block.name === toolName) return block.input;
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* падаем в ошибку ниже */
    }
  }

  throw new AiError(
    "Модель вернула ответ в неожиданном формате. Попробуйте ещё раз.",
    "BAD_OUTPUT",
  );
}

async function logAi(entry: {
  userId: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  minutesSaved: number;
  ok: boolean;
  error?: string;
}) {
  try {
    await db.aiLog.create({ data: entry });
  } catch {
    // Аудит не должен ронять пользовательскую операцию.
  }
}

export { logAi };
