export const LOCALES = ["ru", "kk"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "uiren_locale";
export const DEFAULT_LOCALE: Locale = "ru";

export function isLocale(v: string | undefined): v is Locale {
  return v === "ru" || v === "kk";
}

/**
 * Плоский словарь. i18n заложен с первого дня намеренно: без казахского
 * платформа не заходит в госшколы, а ретрофит по сотням строк — худшая работа.
 */
const ru = {
  "app.name": "Uiren",
  "app.tagline": "Школьная платформа",

  "nav.overview": "Обзор",
  "nav.classes": "Классы",
  "nav.assignments": "Задания",
  "nav.lessons": "Планы уроков",
  "nav.insights": "Аналитика",
  "nav.messages": "Сообщения",
  "nav.tutor": "Uiren AI",
  "nav.school": "Школа",
  "nav.people": "Пользователи",
  "nav.children": "Мои дети",
  "nav.students": "Ученики",
  "nav.grades": "Оценки",
  "nav.chat": "Переписка",
  "nav.logout": "Выйти",
  "nav.collapse": "Свернуть меню",
  "nav.expand": "Развернуть меню",

  "role.ADMIN": "Администратор",
  "role.DIRECTOR": "Директор",
  "role.TEACHER": "Учитель",
  "role.STUDENT": "Ученик",
  "role.PARENT": "Родитель",

  "auth.title": "Вход в систему",
  "auth.subtitle": "Интеллектуальный слой поверх школьной инфраструктуры",
  "auth.email": "Электронная почта",
  "auth.password": "Пароль",
  "auth.submit": "Войти",
  "auth.error": "Неверная почта или пароль",
  "auth.demo": "Демо-доступы",

  "common.save": "Сохранить",
  "common.cancel": "Отмена",
  "common.create": "Создать",
  "common.open": "Открыть",
  "common.back": "Назад",
  "common.loading": "Загрузка…",
  "common.empty": "Пока пусто",
  "common.generate": "Сгенерировать через AI",
  "common.generating": "Генерирую…",
  "common.send": "Отправить",
  "common.subject": "Предмет",
  "common.class": "Класс",
  "common.topic": "Тема",
  "common.title": "Название",
  "common.date": "Дата",
  "common.score": "Балл",
  "common.status": "Статус",
  "common.student": "Ученик",
  "common.actions": "Действия",
  "common.of": "из",

  "teacher.hoursSaved": "Часов сэкономлено",
  "teacher.hoursSavedHint": "за последние 30 дней",
  "teacher.pendingReview": "Работ ждут проверки",
  "teacher.activeClasses": "Классов веду",
  "teacher.myAssignments": "Мои задания",
  "teacher.newAssignment": "Новое задание",
  "teacher.newLesson": "Новый план урока",
  "teacher.reviewAll": "Проверить все AI",
  "teacher.reviewOne": "Проверить AI",
  "teacher.approve": "Утвердить",

  "assign.description": "Описание для учеников",
  "assign.tasks": "Задания",
  "assign.taskPrompt": "Условие",
  "assign.taskExpected": "Ожидаемый ответ / критерий",
  "assign.points": "Баллы",
  "assign.addTask": "Добавить задание",
  "assign.dueAt": "Срок сдачи",
  "assign.kind": "Тип работы",
  "assign.kind.HOMEWORK": "Домашняя работа",
  "assign.kind.QUIZ": "Тест",
  "assign.kind.FORMATIVE": "Формативное оценивание",
  "assign.kind.SUMMATIVE": "Суммативное оценивание",
  "assign.aiHint": "Опишите тему — AI составит задания под казахстанскую программу",

  "sub.status.DRAFT": "Черновик",
  "sub.status.SUBMITTED": "Сдано",
  "sub.status.AI_REVIEWED": "Проверено AI",
  "sub.status.TEACHER_APPROVED": "Утверждено учителем",

  "nature.CORRECT": "Верно",
  "nature.CONCEPT_GAP": "Не понял концепт",
  "nature.CALCULATION": "Ошибка в вычислении",
  "nature.CARELESS": "Невнимательность",
  "nature.INCOMPLETE": "Не доделано",
  "nature.NOT_ATTEMPTED": "Не приступал",
  "nature.SUSPECTED_COPY": "Подозрение на списывание",

  "insight.title": "Аналитика класса",
  "insight.subtitle": "Где класс просел и что сделать на следующем уроке",
  "insight.generate": "Построить разбор класса",
  "insight.mastery": "Усвоение темы",
  "insight.errorMix": "Структура ошибок",
  "insight.atRisk": "Требуют внимания",
  "insight.diagnosis": "Диагноз",
  "insight.actions": "Что сделать",
  "insight.needData": "Недостаточно проверенных работ. Проверьте хотя бы одну.",

  "student.myWork": "Мои задания",
  "student.gaps": "Мои пробелы",
  "student.submit": "Сдать работу",
  "student.submitted": "Работа сдана",
  "student.feedback": "Обратная связь",
  "student.tutorHint":
    "Uiren AI знает, что проходили на уроке и где вы ошибались в последних работах.",
  "student.askTutor": "Спросить Uiren AI",

  "director.title": "Панель директора",
  "director.subject": "Динамика по предметам",
  "director.teachers": "Учителя",
  "director.entForecast": "Прогноз ЕНТ",
  "director.entHint": "Оценка по накопленной динамике; уточняется каждую неделю",
  "director.report": "Отчёт для управления образования",
  "director.buildReport": "Собрать отчёт",
  "director.schoolMastery": "Средний уровень усвоения",
  "director.aiAdoption": "Учителей активно пользуются",

  "parent.title": "Успеваемость ребёнка",
  "parent.noChildren": "К вашему аккаунту не привязан ни один ученик",
  "parent.recent": "Последние работы",
  "parent.fromTeacher": "Сообщения от учителей",

  "admin.title": "Управление школой",
  "admin.addUser": "Добавить пользователя",
  "admin.fullName": "ФИО",
  "admin.role": "Роль",
  "admin.journal": "Электронный журнал",
  "admin.journalHint": "Журнал, который использует школа",

  "tour.replay": "Показать подсказки",

  "ai.noKey":
    "ANTHROPIC_API_KEY не задан. Добавьте ключ в .env и перезапустите сервер.",
  "ai.failed": "AI-запрос не удался",
} satisfies Record<string, string>;

export type MessageKey = keyof typeof ru;

const kk: Record<MessageKey, string> = {
  "app.name": "Uiren",
  "app.tagline": "Мектеп платформасы",

  "nav.overview": "Шолу",
  "nav.classes": "Сыныптар",
  "nav.assignments": "Тапсырмалар",
  "nav.lessons": "Сабақ жоспарлары",
  "nav.insights": "Талдау",
  "nav.messages": "Хабарламалар",
  "nav.tutor": "Uiren AI",
  "nav.school": "Мектеп",
  "nav.people": "Пайдаланушылар",
  "nav.children": "Менің балаларым",
  "nav.students": "Оқушылар",
  "nav.grades": "Бағалар",
  "nav.chat": "Хат алмасу",
  "nav.logout": "Шығу",
  "nav.collapse": "Мәзірді жию",
  "nav.expand": "Мәзірді жаю",

  "role.ADMIN": "Әкімші",
  "role.DIRECTOR": "Директор",
  "role.TEACHER": "Мұғалім",
  "role.STUDENT": "Оқушы",
  "role.PARENT": "Ата-ана",

  "auth.title": "Жүйеге кіру",
  "auth.subtitle": "Мектеп инфрақұрылымы үстіндегі интеллектуалдық қабат",
  "auth.email": "Электрондық пошта",
  "auth.password": "Құпиясөз",
  "auth.submit": "Кіру",
  "auth.error": "Пошта немесе құпиясөз қате",
  "auth.demo": "Демо-қолжетімділік",

  "common.save": "Сақтау",
  "common.cancel": "Бас тарту",
  "common.create": "Құру",
  "common.open": "Ашу",
  "common.back": "Артқа",
  "common.loading": "Жүктелуде…",
  "common.empty": "Әзірге бос",
  "common.generate": "AI арқылы жасау",
  "common.generating": "Жасалуда…",
  "common.send": "Жіберу",
  "common.subject": "Пән",
  "common.class": "Сынып",
  "common.topic": "Тақырып",
  "common.title": "Атауы",
  "common.date": "Күні",
  "common.score": "Балл",
  "common.status": "Күйі",
  "common.student": "Оқушы",
  "common.actions": "Әрекеттер",
  "common.of": "ішінен",

  "teacher.hoursSaved": "Үнемделген сағат",
  "teacher.hoursSavedHint": "соңғы 30 күнде",
  "teacher.pendingReview": "Тексеруді күтуде",
  "teacher.activeClasses": "Жүргізетін сыныптар",
  "teacher.myAssignments": "Менің тапсырмаларым",
  "teacher.newAssignment": "Жаңа тапсырма",
  "teacher.newLesson": "Жаңа сабақ жоспары",
  "teacher.reviewAll": "Барлығын AI тексерсін",
  "teacher.reviewOne": "AI тексеруі",
  "teacher.approve": "Бекіту",

  "assign.description": "Оқушыларға арналған сипаттама",
  "assign.tasks": "Тапсырмалар",
  "assign.taskPrompt": "Шарты",
  "assign.taskExpected": "Күтілетін жауап / критерий",
  "assign.points": "Балдар",
  "assign.addTask": "Тапсырма қосу",
  "assign.dueAt": "Тапсыру мерзімі",
  "assign.kind": "Жұмыс түрі",
  "assign.kind.HOMEWORK": "Үй жұмысы",
  "assign.kind.QUIZ": "Тест",
  "assign.kind.FORMATIVE": "Қалыптастырушы бағалау",
  "assign.kind.SUMMATIVE": "Жиынтық бағалау",
  "assign.aiHint":
    "Тақырыпты сипаттаңыз — AI қазақстандық бағдарлама бойынша тапсырма құрады",

  "sub.status.DRAFT": "Жоба",
  "sub.status.SUBMITTED": "Тапсырылды",
  "sub.status.AI_REVIEWED": "AI тексерді",
  "sub.status.TEACHER_APPROVED": "Мұғалім бекітті",

  "nature.CORRECT": "Дұрыс",
  "nature.CONCEPT_GAP": "Ұғымды түсінбеген",
  "nature.CALCULATION": "Есептеу қатесі",
  "nature.CARELESS": "Абайсыздық",
  "nature.INCOMPLETE": "Аяқталмаған",
  "nature.NOT_ATTEMPTED": "Кіріспеген",
  "nature.SUSPECTED_COPY": "Көшіру күдігі",

  "insight.title": "Сынып талдауы",
  "insight.subtitle": "Сынып қай жерде әлсіз және келесі сабақта не істеу керек",
  "insight.generate": "Сынып талдауын құру",
  "insight.mastery": "Тақырыпты меңгеру",
  "insight.errorMix": "Қателер құрылымы",
  "insight.atRisk": "Назар аударуды қажет етеді",
  "insight.diagnosis": "Диагноз",
  "insight.actions": "Не істеу керек",
  "insight.needData":
    "Тексерілген жұмыстар жеткіліксіз. Кемінде біреуін тексеріңіз.",

  "student.myWork": "Менің тапсырмаларым",
  "student.gaps": "Менің олқылықтарым",
  "student.submit": "Жұмысты тапсыру",
  "student.submitted": "Жұмыс тапсырылды",
  "student.feedback": "Кері байланыс",
  "student.tutorHint":
    "Uiren AI сабақта не өткенін және соңғы жұмыстарда қай жерде қателескеніңізді біледі.",
  "student.askTutor": "Uiren AI-дан сұрау",

  "director.title": "Директор панелі",
  "director.subject": "Пәндер бойынша динамика",
  "director.teachers": "Мұғалімдер",
  "director.entForecast": "ҰБТ болжамы",
  "director.entHint":
    "Жинақталған динамика бойынша бағалау; апта сайын нақтыланады",
  "director.report": "Білім басқармасына есеп",
  "director.buildReport": "Есеп жинау",
  "director.schoolMastery": "Орташа меңгеру деңгейі",
  "director.aiAdoption": "Белсенді пайдаланатын мұғалімдер",

  "parent.title": "Баланың үлгерімі",
  "parent.noChildren": "Аккаунтыңызға бірде-бір оқушы байланбаған",
  "parent.recent": "Соңғы жұмыстар",
  "parent.fromTeacher": "Мұғалімдерден хабарламалар",

  "admin.title": "Мектепті басқару",
  "admin.addUser": "Пайдаланушы қосу",
  "admin.fullName": "Аты-жөні",
  "admin.role": "Рөлі",
  "admin.journal": "Электрондық журнал",
  "admin.journalHint": "Мектеп пайдаланатын журнал",

  "tour.replay": "Кеңестерді көрсету",

  "ai.noKey":
    "ANTHROPIC_API_KEY берілмеген. Кілтті .env файлына қосып, серверді қайта іске қосыңыз.",
  "ai.failed": "AI сұрауы орындалмады",
};

const dictionaries: Record<Locale, Record<MessageKey, string>> = { ru, kk };

export type Translator = (key: MessageKey) => string;

export function translator(locale: Locale): Translator {
  const table = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  return (key) => table[key] ?? ru[key] ?? key;
}
