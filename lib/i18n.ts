import { surveyQuestions } from "./survey-questions";

export const locales = ["ko", "en", "vi", "mn", "my", "si", "ne", "zh", "ja", "id", "th", "uz"] as const;
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
  otherClassError: string;
  submitError: string;
  closedError: string;
  pendingTitle: string;
  pendingBody: string;
  gateClosedTitle: string;
  gateClosedBody: string;
  refresh: string;
  photoZoom: string;
  photoClose: string;
  photoHint: string;
  questions: readonly string[];
};

// 학생이 고르는 언어 목록에는 각 언어의 자기 이름을 보여 준다.
export const languageNames: Record<Locale, string> = {
  ko: "한국어", en: "English", vi: "Tiếng Việt", mn: "Монгол", my: "မြန်မာ", si: "සිංහල",
  ne: "नेपाली", zh: "中文", ja: "日本語", id: "Bahasa Indonesia", th: "ไทย", uz: "Oʻzbekcha",
};

// 관리자 화면용 한국어 이름.
export const languageNamesKo: Record<Locale, string> = {
  ko: "한국어", en: "영어", vi: "베트남어", mn: "몽골어", my: "미얀마어", si: "스리랑카어(싱할라어)",
  ne: "네팔어", zh: "중국어", ja: "일본어", id: "인도네시아어", th: "태국어", uz: "우즈베크어",
};

// 2026 가을학기 평가서(v2)로 문항이 바뀌어 한국어 외 번역은 모두 다시 검수가 필요하다.
export const reviewedLocales: readonly Locale[] = ["ko"];

export const copy: Record<Locale, Copy> = {
  ko: {
    title: "강의 평가서", subtitle: "각 강사의 수업을 솔직하게 평가해 주세요.",
    noticeTitle: "평가 전 확인", noticeBody: "강의평가 화면이나 내용을 캡처하거나 외부에 유포하지 마세요. 응답 내용은 강의 개선 목적으로만 사용됩니다.",
    noticeConfirm: "위 내용을 확인했습니다.", start: "평가 시작", progress: "강사", instructorSuffix: "선생님",
    comment: "선생님의 수업에서 좋았던 점이나 바라는 점을 자유롭게 써 주세요(모국어 가능).", optional: "선택 사항", back: "이전", next: "다음 강사", submit: "평가 제출", submitting: "제출 중",
    scale: ["매우 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"],
    privacy: "응답은 익명으로 저장되며 참여 여부와 분리됩니다.", done: "평가가 완료되었습니다", doneBody: "소중한 의견을 보내주셔서 감사합니다.",
    receipt: "완료 확인번호", showReceipt: "이 화면을 조사자에게 보여주세요.", duplicateError: "이 기기에서는 이미 평가를 제출했습니다.", otherClassError: "이 기기에서는 이번 학기에 이미 다른 반 평가를 제출했습니다. 한 기기로는 한 반만 평가할 수 있습니다.", submitError: "제출하지 못했습니다. 조사자에게 알려 주세요.", closedError: "평가 시간이 끝났습니다. 조사자에게 알려 주세요. 다시 열리면 제출 버튼을 다시 눌러 주세요.", pendingTitle: "평가 시작 전입니다", pendingBody: "조사자가 평가를 시작하면 이 화면이 자동으로 평가 화면으로 바뀝니다. 잠시 기다려 주세요.", gateClosedTitle: "평가가 마감되었습니다", gateClosedBody: "이 반의 평가 시간이 끝났습니다. 아직 제출하지 못했다면 조사자에게 알려 주세요.", refresh: "새로고침", photoZoom: "사진 확대", photoClose: "사진 닫기", photoHint: "화면을 탭하거나 닫기 버튼을 눌러 닫습니다.", questions: surveyQuestions,
  },
  en: {
    title: "Course Evaluation Form", subtitle: "Please evaluate each teacher honestly.",
    noticeTitle: "Before you begin", noticeBody: "Please do not take screenshots of this evaluation or share its contents with others. Responses are used only to improve teaching.",
    noticeConfirm: "I have read and understood the notice above.", start: "Start evaluation", progress: "Teacher", instructorSuffix: "",
    comment: "Please feel free to write what you liked about this teacher's class or what you would like to see improved (you may write in your native language).", optional: "Optional", back: "Back", next: "Next teacher", submit: "Submit evaluation", submitting: "Submitting",
    scale: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
    privacy: "Your responses are stored anonymously and kept separate from the record of who took part.", done: "Evaluation complete", doneBody: "Thank you for sharing your feedback.",
    receipt: "Completion code", showReceipt: "Show this screen to the survey operator.", duplicateError: "An evaluation has already been submitted from this device.", otherClassError: "This device has already submitted an evaluation for another class this term. Each device can evaluate only one class.", submitError: "We could not submit your evaluation. Please tell the survey operator.", closedError: "The evaluation time has ended. Please tell the survey operator. When it reopens, press Submit again.", pendingTitle: "The evaluation has not started yet", pendingBody: "This screen will switch to the evaluation automatically when the survey operator starts it. Please wait a moment.", gateClosedTitle: "The evaluation is closed", gateClosedBody: "The evaluation time for this class has ended. If you have not submitted yet, please tell the survey operator.", refresh: "Refresh", photoZoom: "Enlarge photo", photoClose: "Close photo", photoHint: "Tap the screen or press the close button to close.",
    questions: [
      "The teacher kept to the scheduled class time.",
      "The teacher taught diligently throughout the class.",
      "I felt comfortable asking the teacher about things I did not understand.",
      "The teacher's explanations were easy to understand.",
      "The teacher clearly showed me how to correct my mistakes.",
      "The teacher gave me enough opportunities to practice Korean during class.",
      "The teacher's class helped me a lot in improving my Korean.",
      "The teacher treated all students fairly and without prejudice.",
    ],
  },
  vi: {
    title: "Phiếu đánh giá khóa học", subtitle: "Vui lòng đánh giá trung thực giờ học của từng giáo viên.", noticeTitle: "Xác nhận trước khi đánh giá", noticeBody: "Vui lòng không chụp màn hình hoặc phát tán nội dung phiếu đánh giá ra bên ngoài. Câu trả lời chỉ được dùng để cải thiện việc giảng dạy.",
    noticeConfirm: "Tôi đã đọc và xác nhận nội dung trên.", start: "Bắt đầu đánh giá", progress: "Giáo viên", instructorSuffix: "", comment: "Hãy tự do viết những điểm bạn thấy tốt hoặc mong muốn ở giờ học của giáo viên (có thể viết bằng tiếng mẹ đẻ).", optional: "Không bắt buộc", back: "Quay lại", next: "Giáo viên tiếp theo", submit: "Gửi đánh giá", submitting: "Đang gửi",
    scale: ["Hoàn toàn không đồng ý", "Không đồng ý", "Bình thường", "Đồng ý", "Hoàn toàn đồng ý"], privacy: "Câu trả lời được lưu ẩn danh và tách biệt với trạng thái tham gia.", done: "Đã hoàn thành đánh giá", doneBody: "Cảm ơn bạn đã chia sẻ ý kiến.", receipt: "Mã xác nhận", showReceipt: "Hãy cho nhân viên khảo sát xem màn hình này.", duplicateError: "Thiết bị này đã gửi đánh giá.", otherClassError: "Thiết bị này đã gửi đánh giá cho một lớp khác trong học kỳ này. Mỗi thiết bị chỉ được đánh giá một lớp.", submitError: "Không thể gửi đánh giá. Vui lòng báo cho nhân viên khảo sát.", closedError: "Thời gian đánh giá đã kết thúc. Vui lòng báo cho nhân viên khảo sát. Khi được mở lại, hãy nhấn Gửi một lần nữa.", pendingTitle: "Chưa bắt đầu đánh giá", pendingBody: "Màn hình này sẽ tự động chuyển sang phiếu đánh giá khi nhân viên khảo sát bắt đầu. Vui lòng chờ trong giây lát.", gateClosedTitle: "Đánh giá đã kết thúc", gateClosedBody: "Thời gian đánh giá của lớp này đã kết thúc. Nếu bạn chưa gửi, vui lòng báo cho nhân viên khảo sát.", refresh: "Tải lại", photoZoom: "Phóng to ảnh", photoClose: "Đóng ảnh", photoHint: "Chạm vào màn hình hoặc nhấn nút đóng để đóng.",
    questions: [
      "Giáo viên tuân thủ đúng thời gian học đã quy định.",
      "Giáo viên giảng dạy chăm chỉ, tận tâm trong suốt giờ học.",
      "Tôi có thể thoải mái hỏi giáo viên những điều mình chưa hiểu.",
      "Lời giải thích của giáo viên dễ hiểu.",
      "Giáo viên chỉ rõ cho tôi cách sửa những lỗi sai của tôi.",
      "Giáo viên cho tôi đủ cơ hội luyện tập tiếng Hàn trong giờ học.",
      "Giờ học của giáo viên giúp ích rất nhiều cho việc nâng cao năng lực tiếng Hàn của tôi.",
      "Giáo viên đối xử công bằng với tất cả học viên, không thiên vị hay có định kiến.",
    ],
  },
  mn: {
    title: "Хичээлийн үнэлгээ", subtitle: "Багш бүрийн хичээлийг үнэн зөв үнэлнэ үү.", noticeTitle: "Үнэлгээний өмнө", noticeBody: "Үнэлгээний дэлгэцийн зургийг авахгүй, бусдад тараахгүй байна уу. Хариултыг зөвхөн сургалтыг сайжруулахад ашиглана.",
    noticeConfirm: "Дээрх мэдээллийг уншиж танилцлаа.", start: "Үнэлгээ эхлүүлэх", progress: "Багш", instructorSuffix: "багш", comment: "Багшийн хичээлийн сайн тал эсвэл хүсэж буй зүйлээ чөлөөтэй бичнэ үү (эх хэлээрээ бичиж болно).", optional: "Заавал биш", back: "Буцах", next: "Дараагийн багш", submit: "Үнэлгээ илгээх", submitting: "Илгээж байна",
    scale: ["Огт санал нийлэхгүй", "Санал нийлэхгүй", "Дунд зэрэг", "Санал нийлнэ", "Бүрэн санал нийлнэ"], privacy: "Хариултыг нэргүй хадгалж, оролцооны мэдээллээс тусгаарлана.", done: "Үнэлгээ дууслаа", doneBody: "Санал бодлоо хуваалцсанд баярлалаа.", receipt: "Баталгаажуулах дугаар", showReceipt: "Энэ дэлгэцийг судалгааны ажилтанд үзүүлнэ үү.", duplicateError: "Энэ төхөөрөмжөөс үнэлгээ аль хэдийн илгээсэн байна.", otherClassError: "Энэ төхөөрөмжөөс энэ улиралд өөр ангийн үнэлгээг аль хэдийн илгээсэн байна. Нэг төхөөрөмжөөр зөвхөн нэг ангийг үнэлнэ.", submitError: "Үнэлгээг илгээж чадсангүй. Судалгааны ажилтанд мэдэгдэнэ үү.", closedError: "Үнэлгээний хугацаа дууслаа. Судалгааны ажилтанд мэдэгдэнэ үү. Дахин нээгдсэний дараа илгээх товчийг дахин дарна уу.", pendingTitle: "Үнэлгээ хараахан эхлээгүй байна", pendingBody: "Судалгааны ажилтан үнэлгээг эхлүүлэхэд энэ дэлгэц автоматаар үнэлгээний хуудас руу шилжинэ. Түр хүлээнэ үү.", gateClosedTitle: "Үнэлгээ хаагдсан", gateClosedBody: "Энэ ангийн үнэлгээний хугацаа дууссан. Хэрэв та илгээж амжаагүй бол судалгааны ажилтанд мэдэгдэнэ үү.", refresh: "Шинэчлэх", photoZoom: "Зургийг томруулах", photoClose: "Зургийг хаах", photoHint: "Хаахын тулд дэлгэц дээр дарах эсвэл хаах товчийг дарна уу.",
    questions: [
      "Багш хичээлийн тогтоосон цагийг сайн баримталсан.",
      "Багш хичээлийн цагийн турш хичээлийг хариуцлагатай заасан.",
      "Би ойлгохгүй зүйлээ багшаас чөлөөтэй асууж чадсан.",
      "Багшийн тайлбар ойлгоход хялбар байсан.",
      "Багш миний алдааг хэрхэн засахыг сайн зааж өгсөн.",
      "Багш хичээлийн үеэр солонгос хэлээр дадлага хийх боломжийг хангалттай олгосон.",
      "Багшийн хичээл миний солонгос хэлний чадварыг дээшлүүлэхэд их тус болсон.",
      "Багш бүх оюутанд ялгаварлалгүй, шударга хандсан.",
    ],
  },
  my: {
    title: "သင်ခန်းစာ အကဲဖြတ်လွှာ",
    subtitle: "ဆရာ/ဆရာမ တစ်ဦးချင်းစီ၏ သင်ကြားမှုကို ရိုးသားစွာ အကဲဖြတ်ပေးပါ။",
    noticeTitle: "အကဲမဖြတ်မီ သိရန်",
    noticeBody: "ဤအကဲဖြတ်စာမျက်နှာကို ဖန်သားပြင်ဓာတ်ပုံ မရိုက်ပါနှင့်၊ အခြားသူများထံ မဖြန့်ဝေပါနှင့်။ ဖြေဆိုချက်များကို သင်ကြားမှု တိုးတက်စေရန်အတွက်သာ အသုံးပြုပါမည်။",
    noticeConfirm: "အထက်ပါအချက်များကို ဖတ်ရှုပြီး နားလည်ပါသည်။",
    start: "အကဲဖြတ်ခြင်း စတင်ရန်",
    progress: "ဆရာ/ဆရာမ",
    instructorSuffix: "",
    comment: "ဆရာ/ဆရာမ၏ သင်ခန်းစာတွင် ကောင်းခဲ့သောအချက်များ သို့မဟုတ် ပိုကောင်းစေလိုသည့်အချက်များကို လွတ်လပ်စွာ ရေးပေးပါ (မိခင်ဘာသာစကားဖြင့် ရေးနိုင်ပါသည်)။",
    optional: "မဖြစ်မနေ မဟုတ်ပါ",
    back: "ယခင်",
    next: "နောက်ဆရာ/ဆရာမ",
    submit: "အကဲဖြတ်ချက် ပေးပို့ရန်",
    submitting: "ပေးပို့နေသည်",
    scale: ["လုံးဝ သဘောမတူပါ", "သဘောမတူပါ", "သာမန်", "သဘောတူပါသည်", "လုံးဝ သဘောတူပါသည်"],
    privacy: "ဖြေဆိုချက်များကို အမည်မဖော်ဘဲ သိမ်းဆည်းပြီး ပါဝင်မှုအချက်အလက်နှင့် သီးခြားထားပါသည်။",
    done: "အကဲဖြတ်ခြင်း ပြီးဆုံးပါပြီ",
    doneBody: "သင့်အမြင်ကို မျှဝေပေးသည့်အတွက် ကျေးဇူးတင်ပါသည်။",
    receipt: "အတည်ပြုကုဒ်",
    showReceipt: "ဤဖန်သားပြင်ကို စစ်တမ်းကောက်ယူသူအား ပြပါ။",
    duplicateError: "ဤစက်မှ အကဲဖြတ်ချက်ကို ပေးပို့ပြီးဖြစ်သည်။",
    otherClassError: "ဤစက်မှ ဤစာသင်ကာလတွင် အခြားအတန်းအတွက် အကဲဖြတ်ချက်ကို ပေးပို့ပြီးဖြစ်သည်။ စက်တစ်လုံးဖြင့် အတန်းတစ်တန်းကိုသာ အကဲဖြတ်နိုင်ပါသည်။",
    submitError: "အကဲဖြတ်ချက်ကို ပေးပို့၍ မရပါ။ စစ်တမ်းကောက်ယူသူအား အသိပေးပါ။",
    closedError: "အကဲဖြတ်ချိန် ကုန်ဆုံးသွားပါပြီ။ စစ်တမ်းကောက်ယူသူအား အသိပေးပါ။ အကဲဖြတ်ခြင်း ပြန်ဖွင့်ပေးသောအခါ ပေးပို့ရန်ခလုတ်ကို ထပ်နှိပ်ပါ။", pendingTitle: "အကဲဖြတ်ခြင်း မစတင်သေးပါ", pendingBody: "စစ်တမ်းကောက်ယူသူက စတင်လိုက်သည်နှင့် ဤဖန်သားပြင်သည် အကဲဖြတ်စာမျက်နှာသို့ အလိုအလျောက် ပြောင်းသွားပါမည်။ ခဏစောင့်ပါ။", gateClosedTitle: "အကဲဖြတ်ခြင်း ပိတ်လိုက်ပါပြီ", gateClosedBody: "ဤအတန်း၏ အကဲဖြတ်ချိန် ကုန်ဆုံးသွားပါပြီ။ မပေးပို့ရသေးပါက စစ်တမ်းကောက်ယူသူအား အသိပေးပါ။", refresh: "ပြန်လည်တင်ရန်", photoZoom: "ဓာတ်ပုံကို ချဲ့ကြည့်ရန်", photoClose: "ဓာတ်ပုံကို ပိတ်ရန်", photoHint: "ပိတ်ရန် ဖန်သားပြင်ကို နှိပ်ပါ သို့မဟုတ် ပိတ်ရန်ခလုတ်ကို နှိပ်ပါ။",
    questions: [
      "ဆရာ/ဆရာမသည် သတ်မှတ်ထားသော စာသင်ချိန်ကို ကောင်းစွာ လိုက်နာခဲ့သည်။",
      "ဆရာ/ဆရာမသည် စာသင်ချိန်တစ်လျှောက်လုံး တာဝန်ကျေပွန်စွာ သင်ကြားခဲ့သည်။",
      "နားမလည်သည်များကို ဆရာ/ဆရာမထံ စိတ်လွတ်လပ်စွာ မေးမြန်းနိုင်ခဲ့သည်။",
      "ဆရာ/ဆရာမ၏ ရှင်းပြချက်များသည် နားလည်ရလွယ်ကူခဲ့သည်။",
      "ဆရာ/ဆရာမသည် ကျွန်ုပ်၏ အမှားများကို မည်သို့ပြင်ရမည်ကို ကောင်းစွာ ပြောပြပေးခဲ့သည်။",
      "ဆရာ/ဆရာမသည် စာသင်ချိန်အတွင်း ကိုရီးယားဘာသာစကား လေ့ကျင့်ရန် အခွင့်အလမ်းများကို လုံလောက်စွာ ပေးခဲ့သည်။",
      "ဆရာ/ဆရာမ၏ သင်ခန်းစာသည် ကျွန်ုပ်၏ ကိုရီးယားဘာသာစကား စွမ်းရည် တိုးတက်ရန် များစွာ အထောက်အကူ ဖြစ်ခဲ့သည်။",
      "ဆရာ/ဆရာမသည် ကျောင်းသားအားလုံးကို ဘက်မလိုက်ဘဲ တန်းတူ မျှတစွာ ဆက်ဆံခဲ့သည်။",
    ],
  },
  si: {
    title: "පාඨමාලා ඇගයීම් පත්‍රය",
    subtitle: "කරුණාකර සෑම ගුරුවරයෙකුගේම පන්තිය අවංකව ඇගයීමට ලක් කරන්න.",
    noticeTitle: "ඇගයීමට පෙර",
    noticeBody: "මෙම ඇගයීම් පිටුවේ තිර රුවක් නොගන්න, අන් අයට බෙදා නොහරින්න. පිළිතුරු භාවිත කරන්නේ ඉගැන්වීම වැඩිදියුණු කිරීමට පමණි.",
    noticeConfirm: "ඉහත තොරතුරු කියවා තේරුම් ගත්තෙමි.",
    start: "ඇගයීම අරඹන්න",
    progress: "ගුරුවරයා",
    instructorSuffix: "",
    comment: "ගුරුවරයාගේ පන්තියේ ඔබ කැමති වූ දේ හෝ බලාපොරොත්තු වන දේ නිදහසේ ලියන්න (මව් භාෂාවෙන් ලිවිය හැක).",
    optional: "අනිවාර්ය නොවේ",
    back: "ආපසු",
    next: "ඊළඟ ගුරුවරයා",
    submit: "ඇගයීම යොමු කරන්න",
    submitting: "යොමු කරමින්",
    scale: ["දැඩි ලෙස එකඟ නොවෙමි", "එකඟ නොවෙමි", "මධ්‍යස්ථයි", "එකඟ වෙමි", "දැඩි ලෙස එකඟ වෙමි"],
    privacy: "පිළිතුරු නිර්නාමිකව සුරැකෙන අතර සහභාගිත්ව තොරතුරුවලින් වෙන්ව තබා ඇත.",
    done: "ඇගයීම සම්පූර්ණයි",
    doneBody: "ඔබේ අදහස් ලබා දීම ගැන ස්තුතියි.",
    receipt: "තහවුරු කිරීමේ කේතය",
    showReceipt: "මෙම තිරය සමීක්ෂණ නිලධාරියාට පෙන්වන්න.",
    duplicateError: "මෙම උපාංගයෙන් දැනටමත් ඇගයීමක් යොමු කර ඇත.",
    otherClassError: "මෙම උපාංගයෙන් මෙම වාරයේ දැනටමත් වෙනත් පන්තියක ඇගයීමක් යොමු කර ඇත. එක් උපාංගයකින් ඇගයිය හැක්කේ එක් පන්තියක් පමණි.",
    submitError: "ඇගයීම යොමු කළ නොහැකි විය. කරුණාකර සමීක්ෂණ නිලධාරියාට දන්වන්න.",
    closedError: "ඇගයීමේ කාලය අවසන්. කරුණාකර සමීක්ෂණ නිලධාරියාට දන්වන්න. නැවත විවෘත වූ පසු යොමු කිරීමේ බොත්තම නැවත ඔබන්න.", pendingTitle: "ඇගයීම තවම ආරම්භ කර නැත", pendingBody: "සමීක්ෂණ නිලධාරියා ඇගයීම ආරම්භ කළ විට මෙම තිරය ස්වයංක්‍රීයව ඇගයීම් පිටුවට මාරු වේ. කරුණාකර මොහොතක් රැඳී සිටින්න.", gateClosedTitle: "ඇගයීම අවසන් කර ඇත", gateClosedBody: "මෙම පන්තියේ ඇගයීම් කාලය අවසන්. ඔබ තවම යොමු කර නොමැති නම්, කරුණාකර සමීක්ෂණ නිලධාරියාට දන්වන්න.", refresh: "නැවත පූරණය කරන්න", photoZoom: "ඡායාරූපය විශාල කරන්න", photoClose: "ඡායාරූපය වසන්න", photoHint: "වැසීමට තිරය තට්ටු කරන්න හෝ වැසීමේ බොත්තම ඔබන්න.",
    questions: [
      "ගුරුවරයා නියමිත පන්ති වේලාව නිසි ලෙස පිළිපැද්දේය.",
      "ගුරුවරයා පන්ති කාලය පුරා කැපවීමෙන් යුතුව ඉගැන්වූයේය.",
      "මට නොතේරෙන දේ ගැන ගුරුවරයාගෙන් නිදහසේ ප්‍රශ්න ඇසීමට හැකි විය.",
      "ගුරුවරයාගේ පැහැදිලි කිරීම් තේරුම් ගැනීමට පහසු විය.",
      "මගේ වැරදි නිවැරදි කරගන්නේ කෙසේදැයි ගුරුවරයා හොඳින් පෙන්වා දුන්නේය.",
      "පන්ති කාලය තුළ කොරියානු භාෂාව පුහුණු වීමට ගුරුවරයා ප්‍රමාණවත් අවස්ථා ලබා දුන්නේය.",
      "ගුරුවරයාගේ පන්තිය මගේ කොරියානු භාෂා හැකියාව වර්ධනය කිරීමට බොහෝ සෙයින් උපකාරී විය.",
      "ගුරුවරයා සියලු සිසුන්ට අගතියකින් තොරව සාධාරණව සැලකුවේය.",
    ],
  },
  ne: {
    title: "कक्षा मूल्याङ्कन फारम",
    subtitle: "कृपया प्रत्येक शिक्षकको कक्षालाई इमानदारीपूर्वक मूल्याङ्कन गर्नुहोस्।",
    noticeTitle: "मूल्याङ्कन गर्नुअघि",
    noticeBody: "यस मूल्याङ्कन पृष्ठको स्क्रिनसट नलिनुहोस् र बाहिर नफैलाउनुहोस्। उत्तरहरू शिक्षण सुधारका लागि मात्र प्रयोग गरिन्छन्।",
    noticeConfirm: "मैले माथिको जानकारी पढेँ र बुझेँ।",
    start: "मूल्याङ्कन सुरु गर्नुहोस्",
    progress: "शिक्षक",
    instructorSuffix: "",
    comment: "शिक्षकको कक्षामा मन परेका कुरा वा चाहेका कुराहरू स्वतन्त्र रूपमा लेख्नुहोस् (मातृभाषामा लेख्न सकिन्छ)।",
    optional: "ऐच्छिक",
    back: "पछाडि",
    next: "अर्को शिक्षक",
    submit: "मूल्याङ्कन पेस गर्नुहोस्",
    submitting: "पेस हुँदैछ",
    scale: ["पूर्ण रूपमा असहमत", "असहमत", "सामान्य", "सहमत", "पूर्ण रूपमा सहमत"],
    privacy: "उत्तरहरू नाम नखुलाई (बेनामी रूपमा) सुरक्षित गरिन्छन् र सहभागिताको जानकारीबाट छुट्टै राखिन्छन्।",
    done: "मूल्याङ्कन सम्पन्न भयो",
    doneBody: "आफ्नो राय दिनुभएकोमा धन्यवाद।",
    receipt: "पुष्टि कोड",
    showReceipt: "यो स्क्रिन सर्वेक्षण कर्मचारीलाई देखाउनुहोस्।",
    duplicateError: "यस उपकरणबाट मूल्याङ्कन पहिले नै पेस भइसकेको छ।",
    otherClassError: "यस उपकरणबाट यस सत्रमा अर्को कक्षाको मूल्याङ्कन पहिले नै पेस भइसकेको छ। एउटा उपकरणबाट एउटा कक्षा मात्र मूल्याङ्कन गर्न सकिन्छ।",
    submitError: "मूल्याङ्कन पेस गर्न सकिएन। कृपया सर्वेक्षण कर्मचारीलाई जानकारी दिनुहोस्।",
    closedError: "मूल्याङ्कनको समय सकियो। कृपया सर्वेक्षण कर्मचारीलाई जानकारी दिनुहोस्। मूल्याङ्कन फेरि खुलेपछि पेस बटन पुनः थिच्नुहोस्।", pendingTitle: "मूल्याङ्कन अझै सुरु भएको छैन", pendingBody: "सर्वेक्षण कर्मचारीले मूल्याङ्कन सुरु गरेपछि यो स्क्रिन आफैँ मूल्याङ्कन पृष्ठमा बदलिन्छ। कृपया केही बेर पर्खनुहोस्।", gateClosedTitle: "मूल्याङ्कन बन्द भयो", gateClosedBody: "यो कक्षाको मूल्याङ्कन समय सकियो। अझै पेस गर्नुभएको छैन भने कृपया सर्वेक्षण कर्मचारीलाई जानकारी दिनुहोस्।", refresh: "रिफ्रेस गर्नुहोस्", photoZoom: "फोटो ठूलो गर्नुहोस्", photoClose: "फोटो बन्द गर्नुहोस्", photoHint: "बन्द गर्न स्क्रिनमा ट्याप गर्नुहोस् वा बन्द गर्ने बटन थिच्नुहोस्।",
    questions: [
      "शिक्षकले तोकिएको कक्षा समय राम्ररी पालना गर्नुभयो।",
      "शिक्षकले कक्षाभरि लगनशीलतापूर्वक पढाउनुभयो।",
      "मैले नबुझेका कुराहरू शिक्षकलाई सहज रूपमा सोध्न सकेँ।",
      "शिक्षकको व्याख्या बुझ्न सजिलो थियो।",
      "शिक्षकले मेरा गल्तीहरू कसरी सुधार्ने भनेर राम्ररी बताउनुभयो।",
      "शिक्षकले कक्षामा कोरियाली भाषा अभ्यास गर्ने पर्याप्त अवसर दिनुभयो।",
      "शिक्षकको कक्षाले मेरो कोरियाली भाषा क्षमता सुधार गर्न धेरै मद्दत गर्‍यो।",
      "शिक्षकले सबै विद्यार्थीसँग पूर्वाग्रहबिना समान र निष्पक्ष व्यवहार गर्नुभयो।",
    ],
  },
  zh: {
    title: "课程评价表", subtitle: "请如实评价每位教师的课程。", noticeTitle: "评价前须知", noticeBody: "请勿截屏或向外传播本评价表。评价内容仅用于改进教学。",
    noticeConfirm: "我已阅读并确认以上内容。", start: "开始评价", progress: "教师", instructorSuffix: "老师", comment: "请自由写下您对老师课程的满意之处或希望改进的地方（可用母语书写）。", optional: "选填", back: "返回", next: "下一位教师", submit: "提交评价", submitting: "提交中",
    scale: ["非常不同意", "不同意", "一般", "同意", "非常同意"], privacy: "回答将匿名保存，并与参与信息分开。", done: "评价已完成", doneBody: "感谢您提供宝贵意见。", receipt: "完成确认码", showReceipt: "请向调查人员出示此页面。", duplicateError: "此设备已提交过评价。", otherClassError: "此设备本学期已提交过其他班级的评价。每台设备只能评价一个班级。", submitError: "无法提交评价，请告知调查人员。", closedError: "评价时间已结束，请告知调查人员。重新开放后，请再次点击提交。", pendingTitle: "评价尚未开始", pendingBody: "调查人员开始评价后，此页面会自动切换到评价表。请稍候。", gateClosedTitle: "评价已结束", gateClosedBody: "本班的评价时间已结束。如果您还没有提交，请告知调查人员。", refresh: "刷新", photoZoom: "放大照片", photoClose: "关闭照片", photoHint: "点击屏幕或关闭按钮即可关闭。",
    questions: [
      "老师遵守规定的上课时间。",
      "老师在上课时间内认真授课。",
      "我可以毫无顾虑地向老师询问不懂的内容。",
      "老师的讲解容易理解。",
      "老师清楚地告诉我如何改正错误。",
      "老师在课堂上给了我充分的韩语练习机会。",
      "老师的课对提高我的韩语能力有很大帮助。",
      "老师对所有学生一视同仁，公平对待，没有偏见。",
    ],
  },
  ja: {
    title: "授業評価票", subtitle: "先生ごとに授業を率直に評価してください。", noticeTitle: "評価前の確認", noticeBody: "この評価画面のスクリーンショットを撮ったり、内容を外部に共有したりしないでください。回答は授業改善のためにのみ使用されます。",
    noticeConfirm: "上記の内容を確認しました。", start: "評価を始める", progress: "先生", instructorSuffix: "先生", comment: "先生の授業でよかった点や希望する点を自由に書いてください（母語でも構いません）。", optional: "任意", back: "戻る", next: "次の先生", submit: "評価を提出", submitting: "提出中",
    scale: ["全くそう思わない", "そう思わない", "どちらともいえない", "そう思う", "とてもそう思う"], privacy: "回答は匿名で保存され、参加情報とは分離されます。", done: "評価が完了しました", doneBody: "ご意見をお寄せいただき、ありがとうございます。", receipt: "完了確認番号", showReceipt: "この画面を調査担当者に見せてください。", duplicateError: "この端末からはすでに評価が提出されています。", otherClassError: "この端末からは今学期すでに別のクラスの評価が提出されています。1台の端末で評価できるのは1クラスのみです。", submitError: "提出できませんでした。調査担当者にお知らせください。", closedError: "評価時間が終了しました。調査担当者にお知らせください。再開されたら、もう一度提出ボタンを押してください。", pendingTitle: "評価はまだ始まっていません", pendingBody: "調査担当者が評価を始めると、この画面は自動的に評価画面に切り替わります。しばらくお待ちください。", gateClosedTitle: "評価は締め切られました", gateClosedBody: "このクラスの評価時間は終了しました。まだ提出していない場合は、調査担当者にお知らせください。", refresh: "再読み込み", photoZoom: "写真を拡大", photoClose: "写真を閉じる", photoHint: "画面をタップするか、閉じるボタンを押すと閉じます。",
    questions: [
      "先生は決められた授業時間をきちんと守った。",
      "先生は授業時間中、誠実に授業を行った。",
      "わからないことを先生に気軽に質問することができた。",
      "先生の説明はわかりやすかった。",
      "先生は私の間違いをどう直せばよいかをよく教えてくれた。",
      "先生は授業中に韓国語を練習する機会を十分に与えてくれた。",
      "先生の授業は私の韓国語能力の向上に大いに役立った。",
      "先生はすべての学生を偏見なく公平に扱った。",
    ],
  },
  id: {
    title: "Formulir Evaluasi Kelas",
    subtitle: "Silakan nilai kelas setiap pengajar dengan jujur.",
    noticeTitle: "Sebelum memulai",
    noticeBody: "Jangan mengambil tangkapan layar atau menyebarkan isi evaluasi ini. Jawaban hanya digunakan untuk meningkatkan pengajaran.",
    noticeConfirm: "Saya sudah membaca dan memahami informasi di atas.",
    start: "Mulai evaluasi",
    progress: "Pengajar",
    instructorSuffix: "",
    comment: "Silakan tulis dengan bebas hal yang Anda sukai atau harapan Anda tentang kelas pengajar ini (boleh dalam bahasa ibu Anda).",
    optional: "Opsional",
    back: "Kembali",
    next: "Pengajar berikutnya",
    submit: "Kirim evaluasi",
    submitting: "Mengirim",
    scale: ["Sangat tidak setuju", "Tidak setuju", "Netral", "Setuju", "Sangat setuju"],
    privacy: "Jawaban disimpan secara anonim dan terpisah dari data partisipasi.",
    done: "Evaluasi selesai",
    doneBody: "Terima kasih atas masukan Anda.",
    receipt: "Kode konfirmasi",
    showReceipt: "Tunjukkan layar ini kepada petugas survei.",
    duplicateError: "Perangkat ini sudah mengirim evaluasi.",
    otherClassError: "Perangkat ini sudah mengirim evaluasi untuk kelas lain pada semester ini. Setiap perangkat hanya dapat mengevaluasi satu kelas.",
    submitError: "Evaluasi tidak dapat dikirim. Silakan beri tahu petugas survei.",
    closedError: "Waktu evaluasi telah berakhir. Silakan beri tahu petugas survei. Setelah dibuka kembali, tekan Kirim sekali lagi.", pendingTitle: "Evaluasi belum dimulai", pendingBody: "Layar ini akan otomatis berganti ke formulir evaluasi saat petugas survei memulainya. Mohon tunggu sebentar.", gateClosedTitle: "Evaluasi sudah ditutup", gateClosedBody: "Waktu evaluasi untuk kelas ini telah berakhir. Jika Anda belum mengirim, silakan beri tahu petugas survei.", refresh: "Muat ulang", photoZoom: "Perbesar foto", photoClose: "Tutup foto", photoHint: "Ketuk layar atau tekan tombol tutup untuk menutup.",
    questions: [
      "Pengajar menepati waktu kelas yang telah ditentukan.",
      "Pengajar mengajar dengan sungguh-sungguh selama jam pelajaran.",
      "Saya bisa bertanya dengan nyaman kepada pengajar tentang hal yang tidak saya pahami.",
      "Penjelasan pengajar mudah dipahami.",
      "Pengajar menunjukkan dengan baik cara memperbaiki kesalahan saya.",
      "Pengajar memberikan cukup kesempatan untuk berlatih bahasa Korea selama kelas.",
      "Kelas pengajar ini sangat membantu meningkatkan kemampuan bahasa Korea saya.",
      "Pengajar memperlakukan semua siswa secara adil tanpa prasangka.",
    ],
  },
  th: {
    title: "แบบประเมินการสอน",
    subtitle: "โปรดประเมินการสอนของอาจารย์แต่ละท่านตามความเป็นจริง",
    noticeTitle: "ก่อนเริ่มประเมิน",
    noticeBody: "ห้ามบันทึกภาพหน้าจอหรือเผยแพร่เนื้อหาของแบบประเมินนี้ คำตอบจะใช้เพื่อพัฒนาการสอนเท่านั้น",
    noticeConfirm: "ข้าพเจ้าได้อ่านและรับทราบข้อความข้างต้นแล้ว",
    start: "เริ่มประเมิน",
    progress: "อาจารย์",
    instructorSuffix: "",
    comment: "โปรดเขียนสิ่งที่ชอบหรือสิ่งที่อยากให้ปรับปรุงในชั้นเรียนของอาจารย์ได้อย่างอิสระ (เขียนเป็นภาษาแม่ได้)",
    optional: "ไม่บังคับ",
    back: "ย้อนกลับ",
    next: "อาจารย์ท่านถัดไป",
    submit: "ส่งแบบประเมิน",
    submitting: "กำลังส่ง",
    scale: ["ไม่เห็นด้วยอย่างยิ่ง", "ไม่เห็นด้วย", "ปานกลาง", "เห็นด้วย", "เห็นด้วยอย่างยิ่ง"],
    privacy: "คำตอบจะถูกบันทึกโดยไม่ระบุตัวตนและแยกจากข้อมูลการเข้าร่วม",
    done: "ประเมินเสร็จเรียบร้อย",
    doneBody: "ขอบคุณสำหรับความคิดเห็นของคุณ",
    receipt: "รหัสยืนยัน",
    showReceipt: "โปรดแสดงหน้าจอนี้ให้เจ้าหน้าที่สำรวจดู",
    duplicateError: "อุปกรณ์นี้ส่งแบบประเมินไปแล้ว",
    otherClassError: "อุปกรณ์นี้ส่งแบบประเมินของห้องเรียนอื่นในภาคการศึกษานี้ไปแล้ว อุปกรณ์หนึ่งเครื่องประเมินได้เพียงหนึ่งห้องเรียนเท่านั้น",
    submitError: "ไม่สามารถส่งแบบประเมินได้ โปรดแจ้งเจ้าหน้าที่สำรวจ",
    closedError: "หมดเวลาประเมินแล้ว โปรดแจ้งเจ้าหน้าที่สำรวจ เมื่อเปิดให้ประเมินอีกครั้งแล้ว โปรดกดปุ่มส่งใหม่", pendingTitle: "ยังไม่เริ่มการประเมิน", pendingBody: "เมื่อเจ้าหน้าที่สำรวจเริ่มการประเมิน หน้าจอนี้จะเปลี่ยนเป็นแบบประเมินโดยอัตโนมัติ โปรดรอสักครู่", gateClosedTitle: "ปิดการประเมินแล้ว", gateClosedBody: "หมดเวลาประเมินของห้องเรียนนี้แล้ว หากยังไม่ได้ส่ง โปรดแจ้งเจ้าหน้าที่สำรวจ", refresh: "โหลดใหม่", photoZoom: "ขยายรูปภาพ", photoClose: "ปิดรูปภาพ", photoHint: "แตะหน้าจอหรือกดปุ่มปิดเพื่อปิด",
    questions: [
      "อาจารย์รักษาเวลาเรียนตามที่กำหนดไว้ได้ดี",
      "อาจารย์สอนอย่างตั้งใจตลอดเวลาเรียน",
      "ข้าพเจ้าสามารถถามอาจารย์ในสิ่งที่ไม่เข้าใจได้อย่างสบายใจ",
      "คำอธิบายของอาจารย์เข้าใจง่าย",
      "อาจารย์บอกวิธีแก้ไขข้อผิดพลาดของข้าพเจ้าได้ดี",
      "อาจารย์ให้โอกาสฝึกภาษาเกาหลีในชั้นเรียนอย่างเพียงพอ",
      "การสอนของอาจารย์ช่วยพัฒนาความสามารถภาษาเกาหลีของข้าพเจ้าได้มาก",
      "อาจารย์ปฏิบัติต่อนักเรียนทุกคนอย่างเท่าเทียมโดยไม่มีอคติ",
    ],
  },
  uz: {
    title: "Dars baholash varaqasi",
    subtitle: "Har bir oʻqituvchining darsini samimiy baholang.",
    noticeTitle: "Baholashdan oldin",
    noticeBody: "Ushbu baholash sahifasini skrinshot qilmang va boshqalarga tarqatmang. Javoblar faqat oʻqitishni yaxshilash uchun ishlatiladi.",
    noticeConfirm: "Yuqoridagi maʼlumot bilan tanishib chiqdim.",
    start: "Baholashni boshlash",
    progress: "Oʻqituvchi",
    instructorSuffix: "ustoz",
    comment: "Oʻqituvchining darsida sizga yoqqan jihatlar yoki istaklaringizni bemalol yozing (ona tilingizda yozishingiz mumkin).",
    optional: "Ixtiyoriy",
    back: "Orqaga",
    next: "Keyingi oʻqituvchi",
    submit: "Baholashni yuborish",
    submitting: "Yuborilmoqda",
    scale: ["Mutlaqo qoʻshilmayman", "Qoʻshilmayman", "Oʻrtacha", "Qoʻshilaman", "Toʻliq qoʻshilaman"],
    privacy: "Javoblar anonim tarzda, ishtirok maʼlumotlaridan alohida saqlanadi.",
    done: "Baholash yakunlandi",
    doneBody: "Fikringizni bildirganingiz uchun rahmat.",
    receipt: "Tasdiqlash kodi",
    showReceipt: "Bu ekranni soʻrovnoma xodimiga koʻrsating.",
    duplicateError: "Bu qurilmadan baholash allaqachon yuborilgan.",
    otherClassError: "Bu qurilmadan ushbu semestrda boshqa guruh uchun baholash allaqachon yuborilgan. Bitta qurilma faqat bitta guruhni baholay oladi.",
    submitError: "Baholashni yuborib boʻlmadi. Soʻrovnoma xodimiga xabar bering.",
    closedError: "Baholash vaqti tugadi. Soʻrovnoma xodimiga xabar bering. Qayta ochilgach, Yuborish tugmasini yana bosing.", pendingTitle: "Baholash hali boshlanmagan", pendingBody: "Soʻrovnoma xodimi baholashni boshlaganda bu ekran avtomatik ravishda baholash sahifasiga oʻtadi. Iltimos, biroz kuting.", gateClosedTitle: "Baholash yopilgan", gateClosedBody: "Bu guruh uchun baholash vaqti tugadi. Hali yubormagan boʻlsangiz, soʻrovnoma xodimiga xabar bering.", refresh: "Yangilash", photoZoom: "Rasmni kattalashtirish", photoClose: "Rasmni yopish", photoHint: "Yopish uchun ekranga teging yoki yopish tugmasini bosing.",
    questions: [
      "Oʻqituvchi belgilangan dars vaqtiga yaxshi rioya qildi.",
      "Oʻqituvchi darsni boshidan oxirigacha vijdonan olib bordi.",
      "Tushunmagan narsalarimni oʻqituvchidan bemalol soʻray oldim.",
      "Oʻqituvchining tushuntirishlari oson tushunarli edi.",
      "Oʻqituvchi xatolarimni qanday tuzatish kerakligini yaxshi koʻrsatib berdi.",
      "Oʻqituvchi dars davomida koreys tilida mashq qilish uchun yetarli imkoniyat berdi.",
      "Oʻqituvchining darsi koreys tili darajamni oshirishga katta yordam berdi.",
      "Oʻqituvchi barcha talabalarga xolis va adolatli munosabatda boʻldi.",
    ],
  },
};

export function normalizeLocale(value: string | undefined): Locale {
  const base = value?.toLowerCase().split(/[-_]/)[0];
  const alias = base === "in" ? "id" : base; // 일부 안드로이드는 인도네시아어를 "in"으로 보낸다.
  return locales.includes(alias as Locale) ? alias as Locale : "ko";
}

// 브라우저 선호 언어 중 지원하는 첫 언어. 하나도 없으면 null(한국어 유지).
export function detectBrowserLocale(languages: readonly string[]): Locale | null {
  const match = languages.find((language) => normalizeLocale(language) !== "ko" || language.toLowerCase().startsWith("ko"));
  return match ? normalizeLocale(match) : null;
}
