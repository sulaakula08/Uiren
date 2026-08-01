# Перенос базы на Supabase

Локально проект работает на SQLite (`prisma/dev.db`). Supabase — это обычный
PostgreSQL, поэтому переносить руками ничего не нужно: Prisma создаст все
таблицы сама из `prisma/schema.prisma`. Ниже — что поменять и в каком порядке.

> **Важно про регион.** В README зафиксировано требование держать данные
> школьников на серверах в РК. У Supabase нет региона в Казахстане — ближайшие
> это `eu-central-1` (Франкфурт) и `ap-southeast-1`. Для пилота это приемлемо,
> для боевого запуска с реальными школами — нет. Решите это до того, как в базу
> попадут настоящие ученики.

---

## 1. Что появится в базе

16 таблиц и 5 enum-типов. Prisma создаст их одной командой — список нужен, чтобы
понимать структуру, а не чтобы писать SQL вручную.

### Организация и люди

| Таблица | Что хранит | Ключевые связи |
| --- | --- | --- |
| `School` | Школа: название, город, внешний журнал, код приглашения, шаг мастера настройки | корень всего |
| `User` | Все роли в одной таблице: админ, директор, учитель, ученик, родитель | `schoolId → School` |
| `ParentLink` | Связь «родитель ↔ ребёнок» | `parentId`, `studentId → User` |

### Учебная структура

| Таблица | Что хранит | Ключевые связи |
| --- | --- | --- |
| `Subject` | Предмет школы, названия на двух языках, код | `schoolId → School` |
| `ClassGroup` | Класс («9А») и параллель | `schoolId → School` |
| `Enrollment` | Кто в каком классе учится | `studentId`, `classId` |
| `TeacherAssignment` | Учитель ведёт предмет в классе | `teacherId`, `subjectId`, `classId` |
| `Topic` | Тема программы ГОСО — единица продольной аналитики | `subjectId → Subject` |

### Работа: задания и проверка

| Таблица | Что хранит | Ключевые связи |
| --- | --- | --- |
| `Lesson` | КСП/ССП — план урока, JSON в поле `planJson` | автор, предмет, класс, тема |
| `Assignment` | Задание: список задач в `tasksJson`, срок, максимум баллов | автор, предмет, класс, тема |
| `Submission` | Работа ученика: ответы, статус, баллы AI и учителя | `assignmentId`, `studentId` |
| `Finding` | Разбор одной задачи внутри работы: природа ошибки и просевшее понятие | `submissionId → Submission` |

### Коммуникация, тьютор, аудит

| Таблица | Что хранит | Ключевые связи |
| --- | --- | --- |
| `ParentMessage` | Сообщение учителя родителю про конкретного ученика | автор, получатель, ученик |
| `TutorSession` | Диалог ученика с тьютором | `studentId → User` |
| `TutorMessage` | Реплика в диалоге | `sessionId → TutorSession` |
| `AiLog` | Каждый вызов модели: токены, стоимость, «часов сэкономлено», ошибки | `userId → User` |

### Enum-типы

`Role` (ADMIN, DIRECTOR, TEACHER, STUDENT, PARENT) · `AssignmentKind` (HOMEWORK,
QUIZ, FORMATIVE, SUMMATIVE) · `ErrorNature` (CORRECT, CONCEPT_GAP, CALCULATION,
CARELESS, INCOMPLETE, NOT_ATTEMPTED, SUSPECTED_COPY) · `SubmissionStatus` (DRAFT,
SUBMITTED, AI_REVIEWED, TEACHER_APPROVED) · `MessageStatus` (DRAFT, SENT).

В SQLite это были обычные строки, в Postgres станут настоящими типами — база
сама перестанет принимать значение вне списка.

---

## 2. Создать проект в Supabase

1. Создайте проект, регион выберите ближайший к пользователям.
2. Задайте пароль базы и сохраните его в менеджере паролей — Supabase покажет
   его один раз.
3. Скопируйте строки подключения: **Project Settings → Database → Connection
   string**. Нужны обе.

Две строки нужны потому, что у Supabase перед базой стоит пулер соединений:

- **порт 6543** (`...pooler.supabase.com:6543`, режим transaction) — для
  приложения. Serverless-функции создают много коротких соединений, напрямую
  Postgres от этого задыхается.
- **порт 5432** (прямое подключение) — для миграций. Prisma при миграции
  выполняет DDL и advisory-локи, а через пулер в transaction-режиме это не
  работает.

---

## 3. Переключить Prisma на Postgres

В `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

В `.env` (файл в `.gitignore`, в репозиторий не попадёт):

```bash
DATABASE_URL="postgresql://postgres.PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

`pgbouncer=true` обязателен — без него Prisma использует prepared statements,
которых пулер в transaction-режиме не поддерживает, и запросы начнут падать с
`prepared statement "s0" already exists`.

Пароль с спецсимволами нужно URL-кодировать (`@` → `%40`, `#` → `%23`).

---

## 4. Создать таблицы

```bash
npx prisma migrate dev --name init
```

Команда создаст папку `prisma/migrations` с SQL, применит его к Supabase и
перегенерирует клиент. Эту папку нужно закоммитить — на проде разворачивать
командой `npx prisma migrate deploy`.

Если хочется просто накатить схему без истории миграций:

```bash
npx prisma db push
```

Для пилота этого хватит, но для продакшена лучше миграции: `db push` не умеет
откатываться и не оставляет следа, что именно менялось.

---

## 5. Закрыть таблицы от публичного доступа

**Это обязательный шаг, а не рекомендация.** Supabase автоматически публикует
всю схему `public` через PostgREST. Пока на таблице не включён RLS, любой, кто
знает URL проекта и anon-ключ (а он лежит в браузере на клиенте), может прочитать
её целиком — включая `User` с `passwordHash` и всеми почтами учеников.

Приложение ходит в базу через Prisma под ролью `postgres`, которая RLS
игнорирует. Значит, можно включить RLS **без единой политики**: приложение
продолжит работать, а анонимный доступ закроется полностью.

В SQL Editor:

```sql
alter table "School"            enable row level security;
alter table "User"              enable row level security;
alter table "ParentLink"        enable row level security;
alter table "Subject"           enable row level security;
alter table "ClassGroup"        enable row level security;
alter table "Enrollment"        enable row level security;
alter table "TeacherAssignment" enable row level security;
alter table "Topic"             enable row level security;
alter table "Lesson"            enable row level security;
alter table "Assignment"        enable row level security;
alter table "Submission"        enable row level security;
alter table "Finding"           enable row level security;
alter table "ParentMessage"     enable row level security;
alter table "TutorSession"      enable row level security;
alter table "TutorMessage"      enable row level security;
alter table "AiLog"             enable row level security;
```

Проверить, что не осталось открытых таблиц:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by rowsecurity, tablename;
```

Все строки должны быть с `rowsecurity = true`.

---

## 6. Демо-данные

```bash
npm run db:demo
```

Скрипт `prisma/seed.ts` работает через того же Prisma-клиента, поэтому после
смены `DATABASE_URL` он наполнит уже Supabase. На боевой базе его запускать не
нужно.

---

## Что стоит сделать после переезда

Это не блокирует запуск, но стоит в очереди:

- **JSON-поля.** `planJson`, `tasksJson`, `answersJson` сейчас `String` —
  наследство SQLite, который не умеет JSON. В Postgres их можно перевести в тип
  `Json` и получить индексы и запросы по содержимому. Потребует правок в коде:
  сейчас значения читаются через `JSON.parse`.
- **Поле `journal`** в `School` — строка с четырьмя допустимыми значениями.
  Просится в enum, как остальные.
- **Бэкапы.** На бесплатном тарифе Supabase их нет. До первой реальной школы
  нужен платный тариф либо свой `pg_dump` по расписанию.
- **Пул соединений.** `connection_limit=1` в строке подключения — безопасный
  старт для serverless. Если приложение поедет на постоянный сервер, лимит нужно
  поднять, иначе запросы выстроятся в очередь.
