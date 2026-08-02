import "server-only";
import { db } from "@/lib/db";

/**
 * Кто кому вправе писать.
 *
 * Разрешено ровно две пары:
 *   учитель ↔ ученик, которого он учит;
 *   учитель ↔ родитель этого ученика.
 *
 * Чего нет намеренно:
 * - ученик ↔ ученик. Личная переписка школьников — это площадка для травли,
 *   и отвечать за неё пришлось бы школе. Инструментов модерации у нас нет,
 *   поэтому и возможности такой быть не должно.
 * - родитель ↔ родитель, и любые пары из разных школ.
 * - доступ родителя к переписке учителя с его ребёнком. Подросток имеет право
 *   на разговор с учителем без пересказа домой; иначе он просто не напишет.
 *   Технически это обеспечено само: ветка — это пара участников, а родителя
 *   в этой паре нет.
 */
export type Contact = {
  id: string;
  fullName: string;
  role: string;
  /** Чем человек связан со мной: «9А, алгебра» или «мама Айгерим». */
  relation: string;
  unread: number;
  lastAt: Date | null;
};

/** Ученики учителя + родители этих учеников. */
async function teacherContacts(teacherId: string) {
  const teaching = await db.teacherAssignment.findMany({
    where: { teacherId },
    select: { classId: true, subject: { select: { name: true } } },
  });
  if (teaching.length === 0) return [];

  const classIds = [...new Set(teaching.map((t) => t.classId))];

  const students = await db.user.findMany({
    where: { role: "STUDENT", enrollments: { some: { classId: { in: classIds } } } },
    select: {
      id: true,
      fullName: true,
      enrollments: {
        where: { classId: { in: classIds } },
        select: { class: { select: { name: true } } },
      },
      // Только подтверждённые связи: заявка доступа не даёт.
      childLinks: {
        where: { status: "ACCEPTED" },
        select: { parent: { select: { id: true, fullName: true } } },
      },
    },
  });

  const out: { id: string; fullName: string; role: string; relation: string }[] = [];

  for (const s of students) {
    const klass = s.enrollments[0]?.class.name ?? "";
    out.push({ id: s.id, fullName: s.fullName, role: "STUDENT", relation: klass });
    for (const link of s.childLinks) {
      out.push({
        id: link.parent.id,
        fullName: link.parent.fullName,
        role: "PARENT",
        relation: `родитель · ${s.fullName}`,
      });
    }
  }

  // Родитель нескольких учеников не должен появиться в списке дважды.
  return [...new Map(out.map((c) => [c.id, c])).values()];
}

/** Учителя, которые ведут классы этого ученика. */
async function studentContacts(studentId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { studentId },
    select: { classId: true },
  });
  const classIds = enrollments.map((e) => e.classId);
  if (classIds.length === 0) return [];

  const links = await db.teacherAssignment.findMany({
    where: { classId: { in: classIds } },
    select: {
      teacher: { select: { id: true, fullName: true } },
      subject: { select: { name: true } },
    },
  });

  const byTeacher = new Map<string, { id: string; fullName: string; role: string; relation: string }>();
  for (const l of links) {
    const existing = byTeacher.get(l.teacher.id);
    if (existing) {
      if (!existing.relation.includes(l.subject.name)) {
        existing.relation += `, ${l.subject.name}`;
      }
    } else {
      byTeacher.set(l.teacher.id, {
        id: l.teacher.id,
        fullName: l.teacher.fullName,
        role: "TEACHER",
        relation: l.subject.name,
      });
    }
  }
  return [...byTeacher.values()];
}

/** Учителя детей этого родителя — но не сами дети и не другие родители. */
async function parentContacts(parentId: string) {
  const links = await db.parentLink.findMany({
    where: { parentId, status: "ACCEPTED" },
    select: { studentId: true, student: { select: { fullName: true } } },
  });
  if (links.length === 0) return [];

  const nameByStudent = new Map(
    links.map((l) => [l.studentId, l.student.fullName]),
  );

  // Раньше здесь был цикл с двумя запросами на каждого ребёнка. У родителя
  // троих детей это шесть обращений к базе подряд — на задержке до Сингапура
  // страница переставала укладываться в лимит времени.
  const enrollments = await db.enrollment.findMany({
    where: { studentId: { in: [...nameByStudent.keys()] } },
    select: { studentId: true, classId: true },
  });
  if (enrollments.length === 0) return [];

  const teachers = await db.teacherAssignment.findMany({
    where: { classId: { in: enrollments.map((e) => e.classId) } },
    select: {
      classId: true,
      teacher: { select: { id: true, fullName: true } },
      subject: { select: { name: true } },
    },
  });

  const studentsByClass = new Map<string, string[]>();
  for (const e of enrollments) {
    studentsByClass.set(e.classId, [
      ...(studentsByClass.get(e.classId) ?? []),
      e.studentId,
    ]);
  }

  const out = new Map<
    string,
    { id: string; fullName: string; role: string; relation: string }
  >();

  for (const t of teachers) {
    for (const studentId of studentsByClass.get(t.classId) ?? []) {
      const relation = `${t.subject.name} · ${nameByStudent.get(studentId)}`;
      const existing = out.get(t.teacher.id);
      if (existing) {
        if (!existing.relation.includes(relation)) {
          existing.relation += `; ${relation}`;
        }
      } else {
        out.set(t.teacher.id, {
          id: t.teacher.id,
          fullName: t.teacher.fullName,
          role: "TEACHER",
          relation,
        });
      }
    }
  }
  return [...out.values()];
}

/** Список собеседников с непрочитанными и временем последнего сообщения. */
export async function listContacts(
  userId: string,
  role: string,
): Promise<Contact[]> {
  // Оба запроса не зависят друг от друга. При задержке до базы в сотни
  // миллисекунд последовательный вызов удваивал время отрисовки страницы.
  const [base, messages] = await Promise.all([
    role === "TEACHER"
      ? teacherContacts(userId)
      : role === "STUDENT"
        ? studentContacts(userId)
        : role === "PARENT"
          ? parentContacts(userId)
          : Promise.resolve([]),
    db.chatMessage.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      select: {
        senderId: true,
        recipientId: true,
        createdAt: true,
        readAt: true,
      },
    }),
  ]);

  if (base.length === 0) return [];

  return base
    .map((c) => {
      const mine = messages.filter(
        (m) => m.senderId === c.id || m.recipientId === c.id,
      );
      const unread = mine.filter(
        (m) => m.senderId === c.id && m.readAt === null,
      ).length;
      const lastAt = mine.reduce<Date | null>(
        (max, m) => (!max || m.createdAt > max ? m.createdAt : max),
        null,
      );
      return { ...c, unread, lastAt };
    })
    .sort((a, b) => {
      if (a.unread !== b.unread) return b.unread - a.unread;
      if (a.lastAt && b.lastAt) return b.lastAt.getTime() - a.lastAt.getTime();
      if (a.lastAt) return -1;
      if (b.lastAt) return 1;
      return a.fullName.localeCompare(b.fullName);
    });
}

/**
 * Проверка права переписки — точечным запросом, а не построением всего списка.
 *
 * Раньше здесь вызывался listContacts(), то есть ради одного «да/нет»
 * выгружались все ученики учителя с их родителями. При отправке каждого
 * сообщения это давало лишние обращения к базе, а с задержкой до Сингапура
 * отправка переставала укладываться в лимит времени серверной функции.
 */
export async function canMessage(
  userId: string,
  role: string,
  otherId: string,
): Promise<boolean> {
  if (!otherId || userId === otherId) return false;

  const other = await db.user.findUnique({
    where: { id: otherId },
    select: { id: true, role: true },
  });
  if (!other) return false;

  // Приводим пару к виду «учитель — второй участник»: разрешённые сочетания
  // всегда включают учителя, поэтому остальные отсекаются сразу.
  const teacherId =
    role === "TEACHER" ? userId : other.role === "TEACHER" ? other.id : null;
  const otherRole = role === "TEACHER" ? other.role : role;
  const counterpartId = role === "TEACHER" ? other.id : userId;
  if (!teacherId) return false;

  if (otherRole === "STUDENT") {
    const found = await db.teacherAssignment.findFirst({
      where: {
        teacherId,
        class: { enrollments: { some: { studentId: counterpartId } } },
      },
      select: { id: true },
    });
    return Boolean(found);
  }

  if (otherRole === "PARENT") {
    const found = await db.teacherAssignment.findFirst({
      where: {
        teacherId,
        class: {
          enrollments: {
            some: {
              // Только подтверждённая связь родителя с этим учеником.
              student: {
                childLinks: {
                  some: { parentId: counterpartId, status: "ACCEPTED" },
                },
              },
            },
          },
        },
      },
      select: { id: true },
    });
    return Boolean(found);
  }

  return false;
}

/** Переписка с одним человеком. Помечает входящие прочитанными. */
export async function openThread(userId: string, otherId: string) {
  // Отметка о прочтении не влияет на то, что мы покажем, поэтому идёт
  // одновременно с чтением, а не после него.
  const [messages] = await Promise.all([
    db.chatMessage.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: otherId },
          { senderId: otherId, recipientId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
    db.chatMessage.updateMany({
      where: { senderId: otherId, recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    }),
  ]);

  return messages;
}
