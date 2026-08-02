/**
 * Выгрузка оценок для электронного журнала.
 *
 * Открытых API у казахстанских журналов нет, а неофициальные обёртки требуют
 * от учителя отдать свой пароль от госсистемы — в школе это неприемлемо. Зато
 * импорт из файла умеют все: учитель проверяет работы здесь, скачивает файл и
 * загружает его в журнал. Ни паролей, ни зависимости от чужого API.
 *
 * ВАЖНО про раскладки колонок ниже: они собраны по общей логике журналов, а не
 * по официальной спецификации — её у нас нет. Перед первым боевым импортом
 * сверьте с пустым шаблоном из своего журнала и поправьте здесь: всё описание
 * формата собрано в этом файле, трогать больше ничего не нужно.
 */

export const JOURNALS = [
  "KUNDELIK",
  "BILIMCLASS",
  "EDUMARK",
  "EDUPAGE",
  "NONE",
] as const;

export type Journal = (typeof JOURNALS)[number];

/** Журналы, для которых есть формат выгрузки. */
export type ExportTarget = Exclude<Journal, "NONE">;

export const JOURNAL_LABELS: Record<Journal, string> = {
  KUNDELIK: "Kundelik",
  BILIMCLASS: "BilimClass",
  EDUMARK: "EduMark.kz",
  EDUPAGE: "EduPage",
  NONE: "Без интеграции",
};

export function isJournal(value: unknown): value is Journal {
  return (
    typeof value === "string" && (JOURNALS as readonly string[]).includes(value)
  );
}

export function isExportTarget(value: unknown): value is ExportTarget {
  return isJournal(value) && value !== "NONE";
}

export type ExportRow = {
  studentName: string;
  studentEmail: string;
  className: string;
  subject: string;
  assignment: string;
  kind: string;
  /** null — работа не проверена. */
  score: number | null;
  maxScore: number;
  date: Date;
};

/**
 * Перевод в пятибалльную шкалу.
 *
 * Казахстанские журналы принимают оценку по пятибалльной, а не проценты.
 * Пороги — привычные 85/65/40; если у школы своя шкала, менять здесь.
 */
export function toFivePoint(score: number, max: number): number {
  if (max <= 0) return 2;
  const percent = (score / max) * 100;
  if (percent >= 85) return 5;
  if (percent >= 65) return 4;
  if (percent >= 40) return 3;
  return 2;
}

function percentOf(row: ExportRow): string {
  if (row.score === null || row.maxScore <= 0) return "";
  return String(Math.round((row.score / row.maxScore) * 100));
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function localDate(date: Date): string {
  return date.toLocaleDateString("ru-RU");
}

type Column = { header: string; value: (row: ExportRow) => string };

type Format = {
  /** Что написать учителю рядом с кнопкой. */
  hint: string;
  /** Excel в русской локали делит строку по точке с запятой, а не по запятой. */
  delimiter: string;
  columns: Column[];
};

const mark = (row: ExportRow) =>
  row.score === null ? "" : String(toFivePoint(row.score, row.maxScore));

const raw = (row: ExportRow) => (row.score === null ? "" : String(row.score));

export const FORMATS: Record<ExportTarget, Format> = {
  KUNDELIK: {
    hint: "Оценка по пятибалльной шкале, дата в формате дд.мм.гггг.",
    delimiter: ";",
    columns: [
      { header: "Ученик", value: (r) => r.studentName },
      { header: "Класс", value: (r) => r.className },
      { header: "Предмет", value: (r) => r.subject },
      { header: "Дата", value: (r) => localDate(r.date) },
      { header: "Вид работы", value: (r) => r.kind },
      { header: "Оценка", value: mark },
      { header: "Баллы", value: raw },
      { header: "Максимум", value: (r) => String(r.maxScore) },
    ],
  },

  BILIMCLASS: {
    hint: "Оценка по пятибалльной шкале, ученик определяется по почте.",
    delimiter: ";",
    columns: [
      { header: "Email", value: (r) => r.studentEmail },
      { header: "ФИО", value: (r) => r.studentName },
      { header: "Класс", value: (r) => r.className },
      { header: "Предмет", value: (r) => r.subject },
      { header: "Работа", value: (r) => r.assignment },
      { header: "Дата", value: (r) => localDate(r.date) },
      { header: "Оценка", value: mark },
    ],
  },

  EDUMARK: {
    hint: "Проценты и сырые баллы — шкалу журнал считает сам.",
    delimiter: ";",
    columns: [
      { header: "ФИО", value: (r) => r.studentName },
      { header: "Класс", value: (r) => r.className },
      { header: "Предмет", value: (r) => r.subject },
      { header: "Работа", value: (r) => r.assignment },
      { header: "Дата", value: (r) => isoDate(r.date) },
      { header: "Балл", value: raw },
      { header: "Макс", value: (r) => String(r.maxScore) },
      { header: "Процент", value: percentOf },
    ],
  },

  EDUPAGE: {
    // EduPage — международная система, её импорт работает с латиницей.
    hint: "Латинские заголовки и дата ISO — как принимает EduPage.",
    delimiter: ";",
    columns: [
      { header: "Student", value: (r) => r.studentName },
      { header: "Email", value: (r) => r.studentEmail },
      { header: "Class", value: (r) => r.className },
      { header: "Subject", value: (r) => r.subject },
      { header: "Event", value: (r) => r.assignment },
      { header: "Date", value: (r) => isoDate(r.date) },
      { header: "Points", value: raw },
      { header: "MaxPoints", value: (r) => String(r.maxScore) },
    ],
  },
};

/** Экранирование по RFC 4180: кавычки удваиваются, спорное поле берётся в кавычки. */
function escape(value: string, delimiter: string): string {
  if (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/**
 * CSV для выбранного журнала.
 *
 * BOM в начале обязателен: без него Excel читает файл как windows-1251 и
 * вместо фамилий показывает кракозябры — а файл этот открывают именно в Excel.
 */
export function toCsv(rows: ExportRow[], target: ExportTarget): string {
  const format = FORMATS[target];
  const line = (cells: string[]) =>
    cells.map((c) => escape(c, format.delimiter)).join(format.delimiter);

  const body = [
    line(format.columns.map((c) => c.header)),
    ...rows.map((row) => line(format.columns.map((c) => c.value(row)))),
  ].join("\r\n");

  return `﻿${body}\r\n`;
}

/** Имя файла: журнал, работа и дата — чтобы в «Загрузках» не искать. */
export function exportFileName(target: ExportTarget, assignment: string) {
  const safe = assignment
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${target.toLowerCase()}-${safe || "ocenki"}-${isoDate(new Date())}.csv`;
}

/**
 * Значение заголовка Content-Disposition.
 *
 * Заголовки HTTP — байтовые строки latin-1, и кириллица в них не помещается:
 * попытка положить название работы в `filename` роняет весь ответ с 500, ещё
 * до того, как браузер увидит хоть байт файла. По RFC 5987 имя идёт дважды —
 * ASCII-запаска в `filename` и настоящее имя в `filename*`.
 */
export function contentDisposition(fileName: string): string {
  // Нелатинское из запаски выбрасываем целиком, а не заменяем подчёркиваниями:
  // «kundelik-n-2026-08-02.csv» человек прочтёт, ряд подчёркиваний — нет.
  const ascii =
    fileName
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/["\\]/g, "")
      .replace(/-{2,}/g, "-")
      .replace(/-+\./g, ".")
      .replace(/^-+/, "") || "export.csv";

  return [
    "attachment",
    `filename="${ascii}"`,
    `filename*=UTF-8''${encodeURIComponent(fileName)}`,
  ].join("; ");
}
