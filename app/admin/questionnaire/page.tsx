import { CheckCircle2, ImageIcon, Languages, LockKeyhole } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { languageNames, locales } from "@/lib/i18n";
import { surveyQuestions } from "@/lib/survey-questions";

export default function QuestionnairePage() {
  return <AdminShell active="/admin/questionnaire" title="설문 관리"><div className="content">
    <div className="page-head"><div><h1>설문 관리</h1><p>강사별로 동일한 5점 척도 7문항과 선택형 자유의견을 사용합니다.</p></div></div>
    <section className="grid-2">
      <div className="card questionnaire-card">
        <div className="questionnaire-heading"><div><span className="status NORMAL"><CheckCircle2 size={12} />사용 중</span><h2>강의 평가서 v1</h2><div>5점 척도 7문항 · 자유의견 1문항</div></div><LockKeyhole color="#5b6b84" /></div>
        <div className="questionnaire-notice"><strong>평가 전 확인</strong><span>학생은 화면 캡처·외부 유포 금지 안내를 확인한 후 평가를 시작합니다.</span></div>
        <div>{surveyQuestions.map((question, index) => <div key={question} className="questionnaire-row"><strong>{index + 1}</strong>{question}</div>)}</div>
      </div>
      <div className="questionnaire-side">
        <div className="card questionnaire-info-card"><Languages size={25} color="#0d3168" /><h2>번역 현황</h2><p>브라우저 언어를 자동 감지하며 학생이 언제든 언어를 바꿀 수 있습니다.</p>{locales.map((locale) => <div key={locale} className="translation-row"><strong>{languageNames[locale]}</strong><span>검수본 적용</span></div>)}</div>
        <div className="card questionnaire-info-card"><ImageIcon size={25} color="#0d3168" /><h2>강사 사진</h2><p>사진은 강사별 질문 상단에 표시됩니다. ‘강사 사진 관리’에서 등록하거나 변경할 수 있습니다.</p></div>
      </div>
    </section>
  </div></AdminShell>;
}
