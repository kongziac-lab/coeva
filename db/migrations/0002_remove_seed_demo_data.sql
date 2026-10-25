DO $$
DECLARE
  demo_class_id uuid;
BEGIN
  SELECT c.id INTO demo_class_id
  FROM "classes" c
  JOIN "terms" t ON t.id = c."term_id"
  WHERE t."code" = '2026-SUMMER'
    AND c."code" = '1'
    AND c."room" = '134'
    AND c."scheduled_at" = '2026-08-05T10:00:00+09:00'::timestamptz
    AND c."scheduled_end_at" = '2026-08-05T10:05:00+09:00'::timestamptz
  LIMIT 1;

  IF demo_class_id IS NOT NULL THEN
    DELETE FROM "anonymous_responses"
    WHERE "session_id" IN (SELECT id FROM "evaluation_sessions" WHERE "class_id" = demo_class_id)
       OR "assignment_id" IN (SELECT id FROM "teaching_assignments" WHERE "class_id" = demo_class_id);
    DELETE FROM "participation" WHERE "session_id" IN (SELECT id FROM "evaluation_sessions" WHERE "class_id" = demo_class_id);
    DELETE FROM "evaluation_sessions" WHERE "class_id" = demo_class_id;
    DELETE FROM "teaching_assignments" WHERE "class_id" = demo_class_id;
    DELETE FROM "classes" WHERE id = demo_class_id;
  END IF;

  -- (정리) 예전 데모 강사 2명을 이름으로 지우던 구문은 실명이 소스에 남지 않도록 뺐다.
  -- 현재 시드는 강사를 만들지 않으므로 새 DB에는 지울 데모 강사가 없고, 기존 DB에는 이미 적용됐다.
END $$;
