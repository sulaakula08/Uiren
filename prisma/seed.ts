/**
 * Необязательные демо-данные для быстрого просмотра платформы: `npm run db:demo`.
 * Обычный путь — регистрация школы через сайт, база при этом пуста.
 * ВНИМАНИЕ: скрипт полностью очищает базу перед наполнением.
 */
import { PrismaClient, type ErrorNature } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const PASSWORD = "uiren2026";

async function main() {
  console.log("Очищаю базу…");
  await db.aiLog.deleteMany();
  await db.tutorMessage.deleteMany();
  await db.tutorSession.deleteMany();
  await db.parentMessage.deleteMany();
  await db.finding.deleteMany();
  await db.submission.deleteMany();
  await db.assignment.deleteMany();
  await db.lesson.deleteMany();
  await db.topic.deleteMany();
  await db.teacherAssignment.deleteMany();
  await db.enrollment.deleteMany();
  await db.parentLink.deleteMany();
  await db.classGroup.deleteMany();
  await db.subject.deleteMany();
  await db.user.deleteMany();
  await db.school.deleteMany();

  const hash = await bcrypt.hash(PASSWORD, 10);

  const school = await db.school.create({
    data: {
      name: "Школа-гимназия №25",
      city: "Алматы",
      journal: "KUNDELIK",
      joinCode: "DEMO25",
      setupStep: 4,
    },
  });

  // ── Пользователи

  const mkUser = (
    email: string,
    fullName: string,
    role: "ADMIN" | "DIRECTOR" | "TEACHER" | "STUDENT" | "PARENT",
    locale = "ru",
  ) =>
    db.user.create({
      data: { email, fullName, role, locale, passwordHash: hash, schoolId: school.id },
    });

  const admin = await mkUser("admin@uiren.kz", "Асель Нурланова", "ADMIN");
  const director = await mkUser("director@uiren.kz", "Марат Жумабеков", "DIRECTOR");

  const teacherMath = await mkUser("teacher@uiren.kz", "Гульнара Сейтова", "TEACHER");
  const teacherPhys = await mkUser("physics@uiren.kz", "Ерлан Кайратов", "TEACHER", "kk");
  const teacherHist = await mkUser("history@uiren.kz", "Динара Оспанова", "TEACHER");

  const studentNames = [
    "Айгерим Ахметова",
    "Данияр Смагулов",
    "Алия Бекова",
    "Нурлан Тулегенов",
    "Камила Ержанова",
    "Тимур Абдрахманов",
    "Сабина Мукашева",
    "Арман Досжанов",
    "Диана Каримова",
    "Ерасыл Нургалиев",
    "Аружан Сериккызы",
    "Бекзат Жанибеков",
  ];

  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    students.push(
      await mkUser(`student${i + 1}@uiren.kz`, studentNames[i], "STUDENT"),
    );
  }

  const parent = await mkUser("parent@uiren.kz", "Сауле Ахметова", "PARENT");
  await db.parentLink.create({
    data: { parentId: parent.id, studentId: students[0].id, relation: "мать" },
  });
  await db.parentLink.create({
    data: { parentId: parent.id, studentId: students[3].id, relation: "мать" },
  });

  // ── Предметы и классы

  const math = await db.subject.create({
    data: { schoolId: school.id, name: "Математика", nameKk: "Математика", code: "MATH" },
  });
  const physics = await db.subject.create({
    data: { schoolId: school.id, name: "Физика", nameKk: "Физика", code: "PHYS" },
  });
  const history = await db.subject.create({
    data: {
      schoolId: school.id,
      name: "История Казахстана",
      nameKk: "Қазақстан тарихы",
      code: "HIST",
    },
  });

  const class9A = await db.classGroup.create({
    data: { schoolId: school.id, name: "9А", grade: 9 },
  });
  const class9B = await db.classGroup.create({
    data: { schoolId: school.id, name: "9Б", grade: 9 },
  });
  const class11A = await db.classGroup.create({
    data: { schoolId: school.id, name: "11А", grade: 11 },
  });

  // 9А — первые 8 учеников, 9Б — остальные
  for (let i = 0; i < students.length; i++) {
    await db.enrollment.create({
      data: {
        studentId: students[i].id,
        classId: i < 8 ? class9A.id : class9B.id,
      },
    });
  }

  const assign = (teacherId: string, subjectId: string, classId: string) =>
    db.teacherAssignment.create({ data: { teacherId, subjectId, classId } });

  await assign(teacherMath.id, math.id, class9A.id);
  await assign(teacherMath.id, math.id, class9B.id);
  await assign(teacherMath.id, math.id, class11A.id);
  await assign(teacherPhys.id, physics.id, class9A.id);
  await assign(teacherHist.id, history.id, class9A.id);

  // ── Темы программы

  const topicQuadratic = await db.topic.create({
    data: {
      subjectId: math.id,
      grade: 9,
      code: "9.2.1",
      title: "Квадратные уравнения",
      titleKk: "Квадрат теңдеулер",
    },
  });
  await db.topic.create({
    data: {
      subjectId: math.id,
      grade: 9,
      code: "9.2.2",
      title: "Теорема Виета",
      titleKk: "Виет теоремасы",
    },
  });
  const topicProgression = await db.topic.create({
    data: {
      subjectId: math.id,
      grade: 9,
      code: "9.3.1",
      title: "Арифметическая прогрессия",
      titleKk: "Арифметикалық прогрессия",
    },
  });
  await db.topic.create({
    data: {
      subjectId: physics.id,
      grade: 9,
      code: "9.1.4",
      title: "Законы Ньютона",
      titleKk: "Ньютон заңдары",
    },
  });

  // ── План урока

  await db.lesson.create({
    data: {
      authorId: teacherMath.id,
      subjectId: math.id,
      classId: class9A.id,
      topicId: topicQuadratic.id,
      title: "Решение квадратных уравнений через дискриминант",
      aiGenerated: true,
      planJson: JSON.stringify({
        title: "Решение квадратных уравнений через дискриминант",
        objectives: [
          "Применять формулу дискриминанта для решения квадратных уравнений",
          "Определять количество корней по знаку дискриминанта",
        ],
        successCriteria: [
          "Вычисляю дискриминант без ошибок в знаках",
          "Определяю число корней по знаку D",
          "Нахожу корни и проверяю их подстановкой",
        ],
        stages: [
          {
            name: "Актуализация",
            minutes: 7,
            activity: "Устный счёт: определить a, b, c в пяти уравнениях",
            assessment: "Светофор: зелёный/жёлтый/красный",
          },
          {
            name: "Изучение нового",
            minutes: 15,
            activity: "Вывод формулы дискриминанта, разбор трёх случаев",
            assessment: "Вопросы на понимание по ходу вывода",
          },
          {
            name: "Практика в парах",
            minutes: 15,
            activity: "Каждая пара решает 4 уравнения и обменивается проверкой",
            assessment: "Взаимооценивание по критериям",
          },
          {
            name: "Рефлексия",
            minutes: 8,
            activity: "Выходной билет: одно уравнение самостоятельно",
            assessment: "Формативная оценка по выходному билету",
          },
        ],
        differentiation:
          "Сильным — уравнения с параметром. Отстающим — карточка с алгоритмом и уравнения только с целыми корнями.",
        resources: ["Учебник §12", "Карточки с алгоритмом", "Выходные билеты"],
      }),
    },
  });

  // ── Задание, уже проверенное: даёт данные для аналитики

  const tasks = [
    {
      id: "t1",
      prompt: "Решите уравнение: x² − 5x + 6 = 0",
      expected: "x₁ = 2, x₂ = 3. Засчитывается при верном D = 1 и обоих корнях.",
      points: 3,
    },
    {
      id: "t2",
      prompt: "Решите уравнение: 2x² + 7x − 4 = 0",
      expected: "x₁ = 0,5, x₂ = −4. D = 81.",
      points: 3,
    },
    {
      id: "t3",
      prompt: "При каком значении k уравнение x² + kx + 9 = 0 имеет один корень?",
      expected: "k = ±6, так как D = k² − 36 = 0.",
      points: 4,
    },
  ];

  const homework = await db.assignment.create({
    data: {
      authorId: teacherMath.id,
      subjectId: math.id,
      classId: class9A.id,
      topicId: topicQuadratic.id,
      kind: "HOMEWORK",
      title: "Квадратные уравнения: дискриминант",
      description:
        "Решите три уравнения. Записывайте ход решения — оценивается не только ответ.",
      tasksJson: JSON.stringify(tasks),
      maxScore: 10,
      dueAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    },
  });

  // Незакрытое задание — чтобы у учителя было что проверять руками
  await db.assignment.create({
    data: {
      authorId: teacherMath.id,
      subjectId: math.id,
      classId: class9A.id,
      topicId: topicProgression.id,
      kind: "FORMATIVE",
      title: "Арифметическая прогрессия: формула n-го члена",
      description: "Три задачи на нахождение члена и суммы прогрессии.",
      tasksJson: JSON.stringify([
        {
          id: "p1",
          prompt: "Найдите a₁₀, если a₁ = 4, d = 3",
          expected: "a₁₀ = 31",
          points: 3,
        },
        {
          id: "p2",
          prompt: "Найдите сумму первых 20 членов, если a₁ = 2, d = 5",
          expected: "S₂₀ = 990",
          points: 4,
        },
      ]),
      maxScore: 7,
      dueAt: new Date(Date.now() + 6 * 24 * 3600 * 1000),
    },
  });

  // Профили ошибок: у большинства класса — CONCEPT_GAP на задании с параметром.
  // Это и есть инсайт «проблема не в учениках, а в подаче».
  const profiles: {
    score: number;
    findings: { taskId: string; nature: ErrorNature; points: number; concept: string; comment: string }[];
  }[] = [
    {
      score: 10,
      findings: [
        { taskId: "t1", nature: "CORRECT", points: 3, concept: "дискриминант", comment: "Верно, ход решения записан полностью." },
        { taskId: "t2", nature: "CORRECT", points: 3, concept: "дискриминант", comment: "Верно." },
        { taskId: "t3", nature: "CORRECT", points: 4, concept: "уравнение с параметром", comment: "Оба значения k найдены." },
      ],
    },
    {
      score: 7,
      findings: [
        { taskId: "t1", nature: "CORRECT", points: 3, concept: "дискриминант", comment: "Верно." },
        { taskId: "t2", nature: "CALCULATION", points: 2, concept: "дискриминант", comment: "Метод верный, но D посчитан как 49 вместо 81 — потерян знак при −4·2·(−4)." },
        { taskId: "t3", nature: "CONCEPT_GAP", points: 2, concept: "уравнение с параметром", comment: "Найдено только k = 6. Условие D = 0 даёт два значения." },
      ],
    },
    {
      score: 5,
      findings: [
        { taskId: "t1", nature: "CORRECT", points: 3, concept: "дискриминант", comment: "Верно." },
        { taskId: "t2", nature: "CARELESS", points: 2, concept: "дискриминант", comment: "Корни верные, но перепутаны местами знаки в ответе." },
        { taskId: "t3", nature: "CONCEPT_GAP", points: 0, concept: "уравнение с параметром", comment: "Дискриминант не использован: подставлены случайные k." },
      ],
    },
    {
      score: 4,
      findings: [
        { taskId: "t1", nature: "CORRECT", points: 3, concept: "дискриминант", comment: "Верно." },
        { taskId: "t2", nature: "CALCULATION", points: 1, concept: "дискриминант", comment: "Ошибка при делении на 2a." },
        { taskId: "t3", nature: "NOT_ATTEMPTED", points: 0, concept: "уравнение с параметром", comment: "Задание не выполнено." },
      ],
    },
    {
      score: 8,
      findings: [
        { taskId: "t1", nature: "CORRECT", points: 3, concept: "дискриминант", comment: "Верно." },
        { taskId: "t2", nature: "CORRECT", points: 3, concept: "дискриминант", comment: "Верно." },
        { taskId: "t3", nature: "INCOMPLETE", points: 2, concept: "уравнение с параметром", comment: "Условие D = 0 записано верно, но уравнение k² = 36 не дорешено." },
      ],
    },
    {
      score: 3,
      findings: [
        { taskId: "t1", nature: "CALCULATION", points: 2, concept: "дискриминант", comment: "D = 1 найден, но корни вычислены неверно." },
        { taskId: "t2", nature: "CONCEPT_GAP", points: 1, concept: "дискриминант", comment: "Формула применена к уравнению без приведения — a принято за 1." },
        { taskId: "t3", nature: "NOT_ATTEMPTED", points: 0, concept: "уравнение с параметром", comment: "Задание не выполнено." },
      ],
    },
    {
      score: 9,
      findings: [
        { taskId: "t1", nature: "CORRECT", points: 3, concept: "дискриминант", comment: "Верно." },
        { taskId: "t2", nature: "CORRECT", points: 3, concept: "дискриминант", comment: "Верно." },
        { taskId: "t3", nature: "CONCEPT_GAP", points: 3, concept: "уравнение с параметром", comment: "Ответ верный, но обоснование через D = 0 не записано." },
      ],
    },
    {
      score: 2,
      findings: [
        { taskId: "t1", nature: "CONCEPT_GAP", points: 1, concept: "дискриминант", comment: "Попытка разложить на множители вместо формулы, разложение неверное." },
        { taskId: "t2", nature: "NOT_ATTEMPTED", points: 0, concept: "дискриминант", comment: "Задание не выполнено." },
        { taskId: "t3", nature: "NOT_ATTEMPTED", points: 1, concept: "уравнение с параметром", comment: "Записано только условие." },
      ],
    },
  ];

  for (let i = 0; i < 8; i++) {
    const profile = profiles[i];
    const submission = await db.submission.create({
      data: {
        assignmentId: homework.id,
        studentId: students[i].id,
        answersJson: JSON.stringify({
          t1: "D = 25 − 24 = 1; x₁ = 2, x₂ = 3",
          t2: "D = 49 + 32 = 81; x = (−7 ± 9)/4",
          t3: "D = k² − 36",
        }),
        status: "TEACHER_APPROVED",
        submittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        aiScore: profile.score,
        teacherScore: profile.score,
        reviewedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
        aiSummary:
          profile.score >= 8
            ? "Тема освоена, разбор параметра требует закрепления."
            : "Формула дискриминанта применяется, но задача с параметром не понята.",
        aiFeedback:
          "Формулу дискриминанта вы применяете. Слабое место — уравнение с параметром: условие «один корень» означает D = 0, и это уравнение относительно k нужно дорешать до конца.",
      },
    });

    for (const f of profile.findings) {
      const task = tasks.find((t) => t.id === f.taskId);
      await db.finding.create({
        data: {
          submissionId: submission.id,
          taskId: f.taskId,
          nature: f.nature,
          points: f.points,
          maxPoints: task?.points ?? 1,
          comment: f.comment,
          concept: f.concept,
        },
      });
    }
  }

  // ── Сообщение родителю

  await db.parentMessage.create({
    data: {
      authorId: teacherMath.id,
      recipientId: parent.id,
      studentId: students[0].id,
      subjectLine: "Айгерим — математика, тема «Квадратные уравнения»",
      body: "Здравствуйте! Айгерим уверенно решает квадратные уравнения через дискриминант — последнюю работу написала на 10 из 10. На следующей неделе переходим к задачам с параметром, там класс в целом просел. Дома достаточно 15 минут: попросите её объяснить вам, почему при D = 0 корень один. Если объяснит своими словами — тема закрыта.",
      status: "SENT",
      aiGenerated: true,
      sentAt: new Date(Date.now() - 12 * 3600 * 1000),
    },
  });

  // ── История AI-использования: наполняет метрику «часов сэкономлено»

  const features = [
    { feature: "grade", minutes: 6, count: 24 },
    { feature: "lesson_plan", minutes: 40, count: 4 },
    { feature: "assignment_gen", minutes: 25, count: 6 },
    { feature: "class_insight", minutes: 45, count: 3 },
    { feature: "parent_message", minutes: 10, count: 5 },
  ];

  for (const f of features) {
    for (let i = 0; i < f.count; i++) {
      await db.aiLog.create({
        data: {
          userId: teacherMath.id,
          feature: f.feature,
          model: "claude-sonnet-5",
          inputTokens: 1200 + i * 40,
          outputTokens: 600 + i * 20,
          minutesSaved: f.minutes,
          ok: true,
          createdAt: new Date(Date.now() - i * 26 * 3600 * 1000),
        },
      });
    }
  }

  console.log(`
Готово. Демо-доступы (пароль у всех: ${PASSWORD})

  Учитель      teacher@uiren.kz     Гульнара Сейтова, математика
  Ученик       student1@uiren.kz    Айгерим Ахметова, 9А
  Директор     director@uiren.kz    Марат Жумабеков
  Родитель     parent@uiren.kz      Сауле Ахметова
  Администратор admin@uiren.kz      Асель Нурланова
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
