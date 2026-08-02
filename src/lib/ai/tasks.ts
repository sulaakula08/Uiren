import "server-only";
import { z } from "zod";
import { MODEL_FAST, MODEL_HEAVY, runStructured } from "./client";

const NATURES = [
  "CORRECT",
  "CONCEPT_GAP",
  "CALCULATION",
  "CARELESS",
  "INCOMPLETE",
  "NOT_ATTEMPTED",
  "SUSPECTED_COPY",
] as const;

/** Общая рамка: модель работает в казахстанском методическом контексте. */
const KZ_CONTEXT = `Ты работаешь внутри платформы Uiren для школ Казахстана.
Методический контекст: ГОСО РК, критериальное оценивание, краткосрочные (КСП)
и среднесрочные (ССП) планы, формат ЕНТ. Формулировки — как у опытного
методиста, без канцелярита и без воды.
Отвечай на языке, указанном в запросе (ru — русский, kk — казахский).`;

const str = (description: string) => ({ type: "string", description });

// ─────────────────────────────────────── 1. Проверка работы

const findingSchema = z.object({
  taskId: z.string(),
  nature: z.enum(NATURES),
  points: z.number().int().min(0),
  comment: z.string(),
  concept: z.string(),
});

const gradeSchema = z.object({
  totalScore: z.number().int().min(0),
  studentFeedback: z.string(),
  teacherSummary: z.string(),
  findings: z.array(findingSchema),
});

export type GradeResult = z.infer<typeof gradeSchema>;

export async function gradeSubmission(input: {
  userId: string;
  locale: string;
  subject: string;
  grade: number;
  topic: string | null;
  maxScore: number;
  tasks: { id: string; prompt: string; expected: string; points: number }[];
  answers: Record<string, string>;
  /** История ошибок ученика по этому предмету, см. ./history.ts. */
  history?: string;
}): Promise<GradeResult> {
  const body = input.tasks
    .map(
      (task) => `--- Задание ${task.id} (макс. ${task.points} б.)
Условие: ${task.prompt}
Ожидаемый ответ / критерий: ${task.expected}
Ответ ученика: ${input.answers[task.id]?.trim() || "(пусто)"}`,
    )
    .join("\n\n");

  return runStructured({
    feature: "grade",
    userId: input.userId,
    minutesSaved: 6,
    model: MODEL_FAST,
    effort: "medium",
    system: `${KZ_CONTEXT}

Ты проверяешь работу ученика. Главное — не поставить балл, а определить ПРИРОДУ ошибки:
- CORRECT — верно;
- CONCEPT_GAP — не понял сам концепт, метод выбран неверно;
- CALCULATION — метод верный, ошибка в вычислении или преобразовании;
- CARELESS — понимает, но описка/потерянный знак/невнимательность;
- INCOMPLETE — начал верно, но не довёл до ответа;
- NOT_ATTEMPTED — не приступал;
- SUSPECTED_COPY — ответ не соответствует уровню работы: готовая формулировка
  без следов решения. Ставь только при явных признаках и пиши об этом осторожно.

В поле concept укажи короткое название понятия, которое просело
(например «дискриминант», «приведение подобных»). Для CORRECT — понятие,
которое ученик продемонстрировал.

Если ниже дана история этого ученика — опирайся на неё, это главное отличие
проверки от разового взгляда на листок:
- Ошибка, которая встречается у него не впервые, — это не невнимательность.
  Даже если внешне похожа на описку, ставь CONCEPT_GAP: человек стабильно
  спотыкается на одном месте.
- Наоборот, единичный сбой в понятии, которым он обычно владеет, — скорее
  CARELESS, чем пробел в понимании.
- В studentFeedback скажи об этом прямо и без упрёка: «здесь ты ошибаешься
  третий раз, давай разберём сам механизм, а не пример».
- Если понятие из списка трудностей в этой работе выполнено верно — отметь
  это отдельно, человеку важно видеть, что усилие дало результат.

studentFeedback — обращение к ученику: что получилось, где ошибка и что
конкретно повторить. Без осуждения, 3–6 предложений.
teacherSummary — одно-два предложения для учителя: суть проблемы этой работы.
Если проблема повторяется — так и напиши, учителю это важнее балла.`,
    prompt: `Язык ответа: ${input.locale}
Предмет: ${input.subject}, ${input.grade} класс
Тема: ${input.topic ?? "не указана"}
Максимальный балл за работу: ${input.maxScore}
${input.history ? `\n=== История этого ученика по предмету ===\n${input.history}\n` : ""}
${body}`,
    toolName: "record_review",
    toolDescription: "Записать результат проверки работы ученика",
    schema: {
      type: "object",
      properties: {
        totalScore: {
          type: "integer",
          description: "Итоговый балл за всю работу",
        },
        studentFeedback: str("Обратная связь ученику"),
        teacherSummary: str("Краткий вывод для учителя"),
        findings: {
          type: "array",
          description: "Разбор каждого задания",
          items: {
            type: "object",
            properties: {
              taskId: str("Идентификатор задания из условия"),
              nature: {
                type: "string",
                enum: [...NATURES],
                description: "Природа ответа",
              },
              points: { type: "integer", description: "Начисленные баллы" },
              comment: str("Комментарий по этому заданию"),
              concept: str("Понятие, которое просело или подтвердилось"),
            },
            required: ["taskId", "nature", "points", "comment", "concept"],
            additionalProperties: false,
          },
        },
      },
      required: ["totalScore", "studentFeedback", "teacherSummary", "findings"],
      additionalProperties: false,
    },
    validate: (raw) => gradeSchema.parse(raw),
  });
}

// ─────────────────────────────────────── 2. Генерация заданий

const generatedTasksSchema = z.object({
  title: z.string(),
  description: z.string(),
  tasks: z.array(
    z.object({
      prompt: z.string(),
      expected: z.string(),
      points: z.number().int().min(1),
    }),
  ),
});

export type GeneratedTasks = z.infer<typeof generatedTasksSchema>;

export async function generateAssignment(input: {
  userId: string;
  locale: string;
  subject: string;
  grade: number;
  topic: string;
  kind: string;
  count: number;
  notes?: string;
}): Promise<GeneratedTasks> {
  return runStructured({
    feature: "assignment_gen",
    userId: input.userId,
    minutesSaved: 25,
    model: MODEL_FAST,
    effort: "medium",
    system: `${KZ_CONTEXT}

Составь работу под тему и класс. Требования:
- задания разной глубины: от воспроизведения до применения в новой ситуации;
- формулировки под уровень класса, контекст по возможности местный;
- в expected — не только ответ, но и критерий, по которому его засчитывают,
  чтобы автопроверка могла отличить ошибку метода от ошибки вычисления.`,
    prompt: `Язык: ${input.locale}
Предмет: ${input.subject}, ${input.grade} класс
Тема: ${input.topic}
Тип работы: ${input.kind}
Количество заданий: ${input.count}
${input.notes ? `Пожелания учителя: ${input.notes}` : ""}`,
    toolName: "create_assignment",
    toolDescription: "Создать работу с набором заданий",
    schema: {
      type: "object",
      properties: {
        title: str("Название работы"),
        description: str("Описание для учеников: что делать и как оценивается"),
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              prompt: str("Условие задания"),
              expected: str("Ожидаемый ответ и критерий засчитывания"),
              points: { type: "integer", description: "Баллы за задание" },
            },
            required: ["prompt", "expected", "points"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "description", "tasks"],
      additionalProperties: false,
    },
    validate: (raw) => generatedTasksSchema.parse(raw),
  });
}

// ─────────────────────────────────────── 3. КСП

const lessonPlanSchema = z.object({
  title: z.string(),
  objectives: z.array(z.string()),
  successCriteria: z.array(z.string()),
  stages: z.array(
    z.object({
      name: z.string(),
      minutes: z.number().int().min(1),
      activity: z.string(),
      assessment: z.string(),
    }),
  ),
  differentiation: z.string(),
  resources: z.array(z.string()),
});

export type LessonPlan = z.infer<typeof lessonPlanSchema>;

export async function generateLessonPlan(input: {
  userId: string;
  locale: string;
  subject: string;
  grade: number;
  topic: string;
  minutes: number;
  notes?: string;
}): Promise<LessonPlan> {
  return runStructured({
    feature: "lesson_plan",
    userId: input.userId,
    minutesSaved: 40,
    model: MODEL_FAST,
    effort: "medium",
    system: `${KZ_CONTEXT}

Составь краткосрочный план урока (КСП) в логике РК: цели обучения,
критерии успеха, этапы с хронометражем, формативное оценивание на каждом этапе,
дифференциация для сильных и отстающих. Сумма минут этапов = длительности урока.`,
    prompt: `Язык: ${input.locale}
Предмет: ${input.subject}, ${input.grade} класс
Тема урока: ${input.topic}
Длительность: ${input.minutes} минут
${input.notes ? `Пожелания: ${input.notes}` : ""}`,
    toolName: "create_lesson_plan",
    toolDescription: "Создать краткосрочный план урока",
    schema: {
      type: "object",
      properties: {
        title: str("Название урока"),
        objectives: {
          type: "array",
          description: "Цели обучения",
          items: { type: "string" },
        },
        successCriteria: {
          type: "array",
          description: "Критерии успеха — что ученик сможет делать",
          items: { type: "string" },
        },
        stages: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: str("Название этапа"),
              minutes: { type: "integer", description: "Длительность в минутах" },
              activity: str("Что делают учитель и ученики"),
              assessment: str("Формативное оценивание на этом этапе"),
            },
            required: ["name", "minutes", "activity", "assessment"],
            additionalProperties: false,
          },
        },
        differentiation: str("Дифференциация: сильные и отстающие"),
        resources: {
          type: "array",
          description: "Ресурсы и материалы",
          items: { type: "string" },
        },
      },
      required: [
        "title",
        "objectives",
        "successCriteria",
        "stages",
        "differentiation",
        "resources",
      ],
      additionalProperties: false,
    },
    validate: (raw) => lessonPlanSchema.parse(raw),
  });
}

// ─────────────────────────────────────── 4. Разбор класса (слой 2 + 3)

const classInsightSchema = z.object({
  masteryPercent: z.number().int().min(0).max(100),
  diagnosis: z.string(),
  rootCause: z.enum(["TEACHING", "PREREQUISITE", "INDIVIDUAL", "MIXED"]),
  weakConcepts: z.array(
    z.object({
      concept: z.string(),
      affectedStudents: z.number().int().min(0),
      dominantNature: z.enum(NATURES),
    }),
  ),
  atRisk: z.array(
    z.object({
      studentName: z.string(),
      reason: z.string(),
      personalTask: z.string(),
    }),
  ),
  classActions: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
      minutes: z.number().int().min(1),
    }),
  ),
});

export type ClassInsight = z.infer<typeof classInsightSchema>;

export async function analyzeClass(input: {
  userId: string;
  locale: string;
  subject: string;
  className: string;
  topic: string | null;
  findings: {
    student: string;
    task: string;
    nature: string;
    concept: string | null;
    points: number;
    maxPoints: number;
  }[];
}): Promise<ClassInsight> {
  const table = input.findings
    .map(
      (f) =>
        `${f.student} | ${f.task} | ${f.nature} | ${f.concept ?? "—"} | ${f.points}/${f.maxPoints}`,
    )
    .join("\n");

  return runStructured({
    feature: "class_insight",
    userId: input.userId,
    minutesSaved: 45,
    model: MODEL_HEAVY,
    effort: "high",
    maxTokens: 12000,
    system: `${KZ_CONTEXT}

Ты анализируешь класс по разобранным работам. Дай учителю то, чего не даёт
ни один электронный журнал: не «средний балл 3.4», а причину.

Ключевое различение в rootCause:
- TEACHING — ошибки однотипны у большой доли класса ⇒ проблема в подаче темы;
- PREREQUISITE — сыпется на материале прошлых классов, а не на новой теме;
- INDIVIDUAL — общий уровень нормальный, проседают отдельные ученики;
- MIXED — сочетание.

classActions — конкретные действия на следующий урок с хронометражем
(например «10-минутный блок повторения»), а не общие советы.
personalTask — формулировка персонального задания для конкретного ученика,
которую учитель может выдать как есть.`,
    prompt: `Язык: ${input.locale}
Предмет: ${input.subject}, класс: ${input.className}
Тема: ${input.topic ?? "не указана"}

Разбор заданий (ученик | задание | природа ошибки | понятие | баллы):
${table}`,
    toolName: "record_class_insight",
    toolDescription: "Записать разбор класса и предложенные действия",
    schema: {
      type: "object",
      properties: {
        masteryPercent: {
          type: "integer",
          description: "Доля класса, усвоившая тему, в процентах",
        },
        diagnosis: str("Диагноз в 2–4 предложениях: что именно не сработало"),
        rootCause: {
          type: "string",
          enum: ["TEACHING", "PREREQUISITE", "INDIVIDUAL", "MIXED"],
          description: "Где корень проблемы",
        },
        weakConcepts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              concept: str("Просевшее понятие"),
              affectedStudents: {
                type: "integer",
                description: "Сколько учеников затронуто",
              },
              dominantNature: {
                type: "string",
                enum: [...NATURES],
                description: "Преобладающая природа ошибки",
              },
            },
            required: ["concept", "affectedStudents", "dominantNature"],
            additionalProperties: false,
          },
        },
        atRisk: {
          type: "array",
          items: {
            type: "object",
            properties: {
              studentName: str("Имя ученика как в данных"),
              reason: str("Почему требует внимания"),
              personalTask: str("Готовое персональное задание"),
            },
            required: ["studentName", "reason", "personalTask"],
            additionalProperties: false,
          },
        },
        classActions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: str("Что сделать"),
              detail: str("Как именно провести"),
              minutes: { type: "integer", description: "Сколько минут займёт" },
            },
            required: ["title", "detail", "minutes"],
            additionalProperties: false,
          },
        },
      },
      required: [
        "masteryPercent",
        "diagnosis",
        "rootCause",
        "weakConcepts",
        "atRisk",
        "classActions",
      ],
      additionalProperties: false,
    },
    validate: (raw) => classInsightSchema.parse(raw),
  });
}

// ─────────────────────────────────────── 5. Сообщение родителю

const parentDraftSchema = z.object({
  subjectLine: z.string(),
  body: z.string(),
});

export type ParentDraft = z.infer<typeof parentDraftSchema>;

export async function draftParentMessage(input: {
  userId: string;
  locale: string;
  teacherName: string;
  studentName: string;
  subject: string;
  situation: string;
  tone: "concern" | "praise" | "neutral";
}): Promise<ParentDraft> {
  return runStructured({
    feature: "parent_message",
    userId: input.userId,
    minutesSaved: 10,
    model: MODEL_FAST,
    effort: "low",
    maxTokens: 2000,
    system: `${KZ_CONTEXT}

Составь сообщение родителю от учителя. Требования:
- уважительно, конкретно, без педагогического жаргона;
- сначала факт, затем что уже делает школа, затем одна понятная просьба к родителю;
- 4–7 предложений, без эмодзи;
- не ставь диагнозов ребёнку и не сравнивай его с другими учениками.`,
    prompt: `Язык: ${input.locale}
Учитель: ${input.teacherName}
Ученик: ${input.studentName}
Предмет: ${input.subject}
Тональность: ${input.tone}
Ситуация: ${input.situation}`,
    toolName: "draft_message",
    toolDescription: "Составить черновик сообщения родителю",
    schema: {
      type: "object",
      properties: {
        subjectLine: str("Тема сообщения"),
        body: str("Текст сообщения"),
      },
      required: ["subjectLine", "body"],
      additionalProperties: false,
    },
    validate: (raw) => parentDraftSchema.parse(raw),
  });
}

// ─────────────────────────────────────── 6. Прогноз ЕНТ (слой 4)

const forecastSchema = z.object({
  predictedScore: z.number().int().min(0).max(140),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  trend: z.enum(["UP", "FLAT", "DOWN"]),
  drivers: z.array(z.string()),
  risks: z.array(z.string()),
  recommendation: z.string(),
});

export type EntForecast = z.infer<typeof forecastSchema>;

export async function forecastEnt(input: {
  userId: string;
  locale: string;
  className: string;
  studentCount: number;
  subjectStats: { subject: string; mastery: number; reviewed: number }[];
  weakConcepts: string[];
}): Promise<EntForecast> {
  return runStructured({
    feature: "ent_forecast",
    userId: input.userId,
    minutesSaved: 30,
    model: MODEL_HEAVY,
    effort: "high",
    system: `${KZ_CONTEXT}

Ты оцениваешь ожидаемый результат ЕНТ по параллели на основе накопленной
динамики усвоения тем. Максимум ЕНТ — 140 баллов.

Будь честен насчёт неопределённости: если проверенных работ мало,
ставь confidence LOW и скажи об этом прямо в recommendation.
Не выдавай прогноз за факт — это оценка тренда, а не предсказание.`,
    prompt: `Язык: ${input.locale}
Класс: ${input.className}, учеников: ${input.studentCount}

Усвоение по предметам (предмет | % усвоения | проверенных работ):
${input.subjectStats.map((s) => `${s.subject} | ${s.mastery}% | ${s.reviewed}`).join("\n")}

Системно просевшие понятия: ${input.weakConcepts.join(", ") || "нет данных"}`,
    toolName: "record_forecast",
    toolDescription: "Записать прогноз результата ЕНТ",
    schema: {
      type: "object",
      properties: {
        predictedScore: {
          type: "integer",
          description: "Ожидаемый средний балл ЕНТ (из 140)",
        },
        confidence: {
          type: "string",
          enum: ["LOW", "MEDIUM", "HIGH"],
          description: "Уверенность в оценке",
        },
        trend: {
          type: "string",
          enum: ["UP", "FLAT", "DOWN"],
          description: "Направление динамики",
        },
        drivers: {
          type: "array",
          description: "Что тянет результат вверх",
          items: { type: "string" },
        },
        risks: {
          type: "array",
          description: "Что тянет вниз",
          items: { type: "string" },
        },
        recommendation: str("Что предпринять директору в ближайший месяц"),
      },
      required: [
        "predictedScore",
        "confidence",
        "trend",
        "drivers",
        "risks",
        "recommendation",
      ],
      additionalProperties: false,
    },
    validate: (raw) => forecastSchema.parse(raw),
  });
}
