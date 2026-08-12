# K-강의평가

계명대학교 한국어학당의 반별 현장 강의평가 시스템입니다. 공용 임시 QR, 강사별 익명 평가, 다국어 설문, 엑셀 일정 가져오기, 자동 집계 및 규정 판정을 제공합니다.

## 로컬 실행

1. `.env.example`을 `.env`로 복사하고 운영 비밀번호와 세션 비밀키를 변경합니다.
2. `docker compose up db -d`로 PostgreSQL을 시작합니다.
3. `npm run db:generate`, `npm run db:migrate`, `npm run db:seed`를 실행합니다.
4. `npm run dev`로 웹앱을 시작합니다.

데모 관리자 계정은 환경 변수가 없을 때만 `admin@kmu.ac.kr` / `demo-admin`입니다. 학생용 데모는 `/survey/demo-134`에서 확인할 수 있습니다.

## Google Workspace 관리자 로그인

Google Cloud Console에서 OAuth 2.0 웹 애플리케이션 클라이언트를 만든 뒤 승인된 리디렉션 URI에 `${APP_URL}/api/auth/google/callback`을 등록합니다. Vercel에는 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_WORKSPACE_DOMAIN`을 Production 환경으로 등록합니다. Google 로그인은 먼저 관리자 관리 화면에서 등록된 활성 이메일만 허용합니다.

## 개인정보 설계

참여 상태에는 세션별 가명 식별자만 저장하고, 평가 응답에는 학생 식별자를 저장하지 않습니다. 운영 로그에도 학생 식별자와 응답 내용을 함께 기록하지 않습니다. KGAS 연동 전에는 공용 QR과 기기 토큰으로 중복 제출을 보조 차단하며, 학생별 미참여자 식별은 지원하지 않습니다.
