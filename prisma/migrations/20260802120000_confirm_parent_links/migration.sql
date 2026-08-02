-- Подтверждение связи «родитель — ученик».
--
-- Раньше связь возникала по одной почте и сразу давала доступ к оценкам:
-- любой в школе мог привязаться к чужому ребёнку. Теперь связь заводит одна
-- сторона, подтверждает вторая, а до подтверждения она ничего не открывает.

CREATE TYPE "LinkStatus" AS ENUM ('PENDING', 'ACCEPTED');

ALTER TABLE "ParentLink" ADD COLUMN "status" "LinkStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "ParentLink" ADD COLUMN "requestedById" TEXT;
ALTER TABLE "ParentLink" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Уже существующие связи создавались родителем при регистрации и работают
-- сегодня. Переводить их в ожидание нельзя — семьи разом потеряли бы доступ,
-- и никто бы не понял, почему.
UPDATE "ParentLink" SET "status" = 'ACCEPTED', "requestedById" = "parentId";

ALTER TABLE "ParentLink" ALTER COLUMN "requestedById" SET NOT NULL;
