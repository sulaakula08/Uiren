-- Закрываем таблицы от анонимного доступа.
--
-- Supabase публикует всю схему `public` через PostgREST. Пока на таблице не
-- включён RLS, её читает любой, у кого есть URL проекта и анонимный ключ —
-- а он лежит в браузере на клиенте. Это означало бы утечку `User` вместе с
-- хешами паролей и почтами учеников.
--
-- Приложение ходит в базу через Prisma под ролью-владельцем, которая RLS
-- игнорирует, поэтому политики не нужны: включаем RLS без единой политики,
-- и анонимный доступ закрывается полностью, а приложение работает как прежде.
--
-- Шаг вынесен в миграцию намеренно: так его нельзя пропустить при развёртывании
-- новой среды.

ALTER TABLE "School" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ParentLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClassGroup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeacherAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Topic" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Finding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ParentMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TutorSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TutorMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiLog" ENABLE ROW LEVEL SECURITY;
