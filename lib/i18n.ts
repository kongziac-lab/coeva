import { surveyQuestions } from "./survey-questions";

export const locales = ["ko", "en", "zh", "ja", "vi", "mn"] as const;
export type Locale = (typeof locales)[number];

type Copy = {
  title: string;
  subtitle: string;
  noticeTitle: string;
  noticeBody: string;
  noticeConfirm: string;
  start: string;
  progress: string;
  instructorSuffix: string;
  comment: string;
  optional: string;
  back: string;
  next: string;
  submit: string;
  submitting: string;
  scale: [string, string, string, string, string];
  privacy: string;
  done: string;
  doneBody: string;
  receipt: string;
  showReceipt: string;
  duplicateError: string;
  submitError: string;
  questions: readonly string[];
};

export const languageNames: Record<Locale, string> = {
  ko: "한국어", en: "English", zh: "中文", ja: "日本語", vi: "Tiếng Việt", mn: "Монгол",
};

export const copy: Record<Locale, Copy> = {
  ko: {
    title: "강의 평가서", subtitle: "각 강사의 수업을 솔직하게 평가해 주세요.",
    noticeTitle: "평가 전 확인", noticeBody: "강의평가 화면이나 내용을 캡처하거나 외부에 유포하지 마세요. 응답 내용은 강의 개선 목적으로만 사용됩니다.",
    noticeConfirm: "위 내용을 확인했습니다.", start: "평가 시작", progress: "강사", instructorSuffix: "선생님",
    comment: "선생님께 전하고 싶은 의견이 있나요?", optional: "선택 사항", back: "이전", next: "다음 강사", submit: "평가 제출", submitting: "제출 중",
    scale: ["매우 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"],
    privacy: "응답은 익명으로 저장되며 참여 여부와 분리됩니다.", done: "평가가 완료되었습니다", doneBody: "소중한 의견을 보내주셔서 감사합니다.",
    receipt: "완료 확인번호", showReceipt: "이 화면을 조사자에게 보여주세요.", duplicateError: "이 기기에서는 이미 평가를 제출했습니다.", submitError: "제출하지 못했습니다. 조사자에게 알려 주세요.", questions: surveyQuestions,
  },
  en: {
    title: "Instructor & Course Evaluation", subtitle: "Please evaluate each instructor honestly.",
    noticeTitle: "Before you begin", noticeBody: "Do not capture or distribute this evaluation form. Responses are used only to improve teaching.",
    noticeConfirm: "I have read and understood the notice above.", start: "Start evaluation", progress: "Instructor", instructorSuffix: "",
    comment: "Is there anything you would like to tell this instructor?", optional: "Optional", back: "Back", next: "Next instructor", submit: "Submit evaluation", submitting: "Submitting",
    scale: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
    privacy: "Responses are anonymous and stored separately from participation.", done: "Evaluation complete", doneBody: "Thank you for sharing your feedback.",
    receipt: "Completion code", showReceipt: "Show this screen to the survey operator.", duplicateError: "An evaluation has already been submitted from this device.", submitError: "We could not submit your evaluation. Please tell the survey operator.",
    questions: [
      "The instructor is well-prepared and uses class time efficiently.", "The instructor answers questions carefully and completely.",
      "The instructor uses examples to make the material easy to understand.", "Course assignments are appropriate, and I receive sufficient feedback.",
      "The instructor uses appropriate supplementary books and references when needed.", "The instructor is helpful in improving my Korean language skills.",
      "Overall, I am satisfied with this instructor's class.",
    ],
  },
  zh: {
    title: "课程评价表", subtitle: "请如实评价每位教师的课程。", noticeTitle: "评价前须知", noticeBody: "请勿截屏或向外传播本评价表。评价内容仅用于改进教学。",
    noticeConfirm: "我已阅读并确认以上内容。", start: "开始评价", progress: "教师", instructorSuffix: "老师", comment: "您想对这位老师说些什么？", optional: "选填", back: "返回", next: "下一位教师", submit: "提交评价", submitting: "提交中",
    scale: ["非常不同意", "不同意", "一般", "同意", "非常同意"], privacy: "回答将匿名保存，并与参与信息分开。", done: "评价已完成", doneBody: "感谢您提供宝贵意见。", receipt: "完成确认码", showReceipt: "请向调查人员出示此画面。", duplicateError: "此设备已提交过评价。", submitError: "无法提交评价，请告知调查人员。",
    questions: ["老师遵守上课时间，认真授课。", "老师认真回应学生的提问和咨询。", "老师授课通俗易懂。", "作业的数量和内容恰当，并且对作业的反馈充分。", "老师在需要时恰当地使用辅助教材和参考资料。", "老师为提高我的韩国语能力提供了很多帮助。", "我对这位老师的课程感到满意。"],
  },
  ja: {
    title: "授業評価票", subtitle: "先生ごとに授業を率直に評価してください。", noticeTitle: "評価前の確認", noticeBody: "この評価画面を撮影したり、外部に共有したりしないでください。回答は授業改善のためにのみ使用されます。",
    noticeConfirm: "上記の内容を確認しました。", start: "評価を始める", progress: "先生", instructorSuffix: "先生", comment: "先生に伝えたい意見はありますか？", optional: "任意", back: "戻る", next: "次の先生", submit: "評価を提出", submitting: "提出中",
    scale: ["全くそう思わない", "そう思わない", "ふつう", "そう思う", "非常にそう思う"], privacy: "回答は匿名で保存され、参加情報とは分離されます。", done: "評価が完了しました", doneBody: "ご意見をお寄せいただき、ありがとうございます。", receipt: "完了確認番号", showReceipt: "この画面を調査担当者に見せてください。", duplicateError: "この端末からはすでに評価が提出されています。", submitError: "提出できませんでした。調査担当者にお知らせください。",
    questions: ["先生は授業時間を守り、誠実に教えた。", "先生は学生の質問や相談に誠実に応じた。", "先生は理解しやすく教えた。", "宿題の量と内容は適切で、宿題へのフィードバックは十分だった。", "先生は必要なときに適切な副教材や参考資料を使用した。", "先生は私の韓国語能力向上のために多くの助けを与えた。", "私はこの先生の授業に満足している。"],
  },
  vi: {
    title: "Phiếu đánh giá khóa học", subtitle: "Vui lòng đánh giá trung thực từng giảng viên.", noticeTitle: "Xác nhận trước khi đánh giá", noticeBody: "Không chụp hoặc phát tán nội dung phiếu đánh giá. Câu trả lời chỉ được dùng để cải thiện việc giảng dạy.",
    noticeConfirm: "Tôi đã đọc và xác nhận nội dung trên.", start: "Bắt đầu đánh giá", progress: "Giảng viên", instructorSuffix: "", comment: "Bạn có ý kiến gì muốn gửi đến giảng viên?", optional: "Không bắt buộc", back: "Quay lại", next: "Giảng viên tiếp theo", submit: "Gửi đánh giá", submitting: "Đang gửi",
    scale: ["Hoàn toàn không đồng ý", "Không đồng ý", "Bình thường", "Đồng ý", "Rất đồng ý"], privacy: "Câu trả lời được lưu ẩn danh và tách biệt với trạng thái tham gia.", done: "Đã hoàn thành đánh giá", doneBody: "Cảm ơn bạn đã chia sẻ ý kiến.", receipt: "Mã xác nhận", showReceipt: "Hãy cho nhân viên khảo sát xem màn hình này.", duplicateError: "Thiết bị này đã gửi đánh giá.", submitError: "Không thể gửi đánh giá. Vui lòng báo cho nhân viên khảo sát.",
    questions: ["Giáo viên đảm bảo giờ học và giảng dạy nhiệt tình.", "Giáo viên trả lời câu hỏi và tư vấn cho học sinh một cách nhiệt tình.", "Giáo viên giảng dạy một cách dễ hiểu.", "Số lượng và nội dung bài tập phù hợp, đồng thời giáo viên phản hồi đầy đủ.", "Giáo viên sử dụng tài liệu bổ trợ và tài liệu tham khảo phù hợp khi cần.", "Giáo viên đã giúp đỡ rất nhiều cho sự tiến bộ tiếng Hàn của tôi.", "Tôi hài lòng về giờ dạy của giáo viên."],
  },
  mn: {
    title: "Хичээлийн үнэлгээ", subtitle: "Багш бүрийн хичээлийг үнэн зөв үнэлнэ үү.", noticeTitle: "Үнэлгээний өмнө", noticeBody: "Үнэлгээний хуудсыг зураг авах болон бусдад тараахгүй байна уу. Хариултыг зөвхөн сургалтыг сайжруулахад ашиглана.",
    noticeConfirm: "Дээрх мэдээллийг уншиж танилцлаа.", start: "Үнэлгээ эхлүүлэх", progress: "Багш", instructorSuffix: "багш", comment: "Багшид хэлэх санал байна уу?", optional: "Заавал биш", back: "Буцах", next: "Дараагийн багш", submit: "Үнэлгээ илгээх", submitting: "Илгээж байна",
    scale: ["Огт санал нийлэхгүй", "Санал нийлэхгүй", "Дунд зэрэг", "Санал нийлнэ", "Үнэхээр санал нийлнэ"], privacy: "Хариултыг нэргүй хадгалж, оролцооны мэдээллээс тусгаарлана.", done: "Үнэлгээ дууслаа", doneBody: "Санал бодлоо хуваалцсанд баярлалаа.", receipt: "Баталгаажуулах дугаар", showReceipt: "Энэ дэлгэцийг судалгааны ажилтанд үзүүлнэ үү.", duplicateError: "Энэ төхөөрөмжөөс үнэлгээ аль хэдийн илгээсэн байна.", submitError: "Үнэлгээг илгээж чадсангүй. Судалгааны ажилтанд мэдэгдэнэ үү.",
    questions: ["Багш хичээлийн цагийг сайн баримталж, үнэнч шударгаар хичээл заадаг.", "Багш оюутны асуултад сайн хариулж, зөвлөгөө өгдөг.", "Багш хичээлийг ойлгоход хялбар аргаар заадаг.", "Гэрийн даалгаврын хэмжээ болон агуулга тохиромжтой бөгөөд багш хангалттай санал өгдөг.", "Багш шаардлагатай үед тохиромжтой нэмэлт материал, сурах бичиг ашигладаг.", "Багш солонгос хэлний мэдлэгийг дээшлүүлэхэд маань их тусалдаг.", "Би энэ багшийн хичээлд сэтгэл хангалуун байна."],
  },
};

export function normalizeLocale(value: string | undefined): Locale {
  const base = value?.toLowerCase().split("-")[0];
  return locales.includes(base as Locale) ? base as Locale : "ko";
}
