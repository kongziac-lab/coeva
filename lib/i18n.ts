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

// 원어민 검수를 마친 번역. 나머지는 검수 전 초벌 번역이다.
export const reviewedLocales: readonly Locale[] = ["ko", "en", "vi", "mn", "zh", "ja"];

export const copy: Record<Locale, Copy> = {
  ko: {
    title: "강의 평가서", subtitle: "각 강사의 수업을 솔직하게 평가해 주세요.",
    noticeTitle: "평가 전 확인", noticeBody: "강의평가 화면이나 내용을 캡처하거나 외부에 유포하지 마세요. 응답 내용은 강의 개선 목적으로만 사용됩니다.",
    noticeConfirm: "위 내용을 확인했습니다.", start: "평가 시작", progress: "강사", instructorSuffix: "선생님",
    comment: "선생님께 전하고 싶은 의견이 있나요?", optional: "선택 사항", back: "이전", next: "다음 강사", submit: "평가 제출", submitting: "제출 중",
    scale: ["매우 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"],
    privacy: "응답은 익명으로 저장되며 참여 여부와 분리됩니다.", done: "평가가 완료되었습니다", doneBody: "소중한 의견을 보내주셔서 감사합니다.",
    receipt: "완료 확인번호", showReceipt: "이 화면을 조사자에게 보여주세요.", duplicateError: "이 기기에서는 이미 평가를 제출했습니다.", otherClassError: "이 기기에서는 이번 학기에 이미 다른 반 평가를 제출했습니다. 한 기기로는 한 반만 평가할 수 있습니다.", submitError: "제출하지 못했습니다. 조사자에게 알려 주세요.", closedError: "평가 시간이 끝났습니다. 조사자에게 알려 주세요. 다시 열리면 제출 버튼을 다시 눌러 주세요.", pendingTitle: "평가 시작 전입니다", pendingBody: "조사자가 평가를 시작하면 이 화면이 자동으로 평가 화면으로 바뀝니다. 잠시 기다려 주세요.", gateClosedTitle: "평가가 마감되었습니다", gateClosedBody: "이 반의 평가 시간이 끝났습니다. 아직 제출하지 못했다면 조사자에게 알려 주세요.", refresh: "새로고침", questions: surveyQuestions,
  },
  en: {
    title: "Instructor & Course Evaluation", subtitle: "Please evaluate each instructor honestly.",
    noticeTitle: "Before you begin", noticeBody: "Do not capture or distribute this evaluation form. Responses are used only to improve teaching.",
    noticeConfirm: "I have read and understood the notice above.", start: "Start evaluation", progress: "Instructor", instructorSuffix: "",
    comment: "Is there anything you would like to tell this instructor?", optional: "Optional", back: "Back", next: "Next instructor", submit: "Submit evaluation", submitting: "Submitting",
    scale: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
    privacy: "Responses are anonymous and stored separately from participation.", done: "Evaluation complete", doneBody: "Thank you for sharing your feedback.",
    receipt: "Completion code", showReceipt: "Show this screen to the survey operator.", duplicateError: "An evaluation has already been submitted from this device.", otherClassError: "This device has already submitted an evaluation for another class this term. Each device can evaluate only one class.", submitError: "We could not submit your evaluation. Please tell the survey operator.", closedError: "The evaluation time has ended. Please tell the survey operator. When it reopens, press Submit again.", pendingTitle: "The evaluation has not started yet", pendingBody: "This screen will switch to the evaluation automatically when the survey operator starts it. Please wait a moment.", gateClosedTitle: "The evaluation is closed", gateClosedBody: "The evaluation time for this class has ended. If you have not submitted yet, please tell the survey operator.", refresh: "Refresh",
    questions: [
      "The instructor is well-prepared and uses class time efficiently.", "The instructor answers questions carefully and completely.",
      "The instructor uses examples to make the material easy to understand.", "Course assignments are appropriate, and I receive sufficient feedback.",
      "The instructor uses appropriate supplementary books and references when needed.", "The instructor is helpful in improving my Korean language skills.",
      "Overall, I am satisfied with this instructor's class.",
    ],
  },
  vi: {
    title: "Phiếu đánh giá khóa học", subtitle: "Vui lòng đánh giá trung thực từng giảng viên.", noticeTitle: "Xác nhận trước khi đánh giá", noticeBody: "Không chụp hoặc phát tán nội dung phiếu đánh giá. Câu trả lời chỉ được dùng để cải thiện việc giảng dạy.",
    noticeConfirm: "Tôi đã đọc và xác nhận nội dung trên.", start: "Bắt đầu đánh giá", progress: "Giảng viên", instructorSuffix: "", comment: "Bạn có ý kiến gì muốn gửi đến giảng viên?", optional: "Không bắt buộc", back: "Quay lại", next: "Giảng viên tiếp theo", submit: "Gửi đánh giá", submitting: "Đang gửi",
    scale: ["Hoàn toàn không đồng ý", "Không đồng ý", "Bình thường", "Đồng ý", "Rất đồng ý"], privacy: "Câu trả lời được lưu ẩn danh và tách biệt với trạng thái tham gia.", done: "Đã hoàn thành đánh giá", doneBody: "Cảm ơn bạn đã chia sẻ ý kiến.", receipt: "Mã xác nhận", showReceipt: "Hãy cho nhân viên khảo sát xem màn hình này.", duplicateError: "Thiết bị này đã gửi đánh giá.", otherClassError: "Thiết bị này đã gửi đánh giá cho một lớp khác trong học kỳ này. Mỗi thiết bị chỉ được đánh giá một lớp.", submitError: "Không thể gửi đánh giá. Vui lòng báo cho nhân viên khảo sát.", closedError: "Thời gian đánh giá đã kết thúc. Vui lòng báo cho nhân viên khảo sát. Khi được mở lại, hãy nhấn Gửi một lần nữa.", pendingTitle: "Chưa bắt đầu đánh giá", pendingBody: "Màn hình này sẽ tự động chuyển sang phiếu đánh giá khi nhân viên khảo sát bắt đầu. Vui lòng chờ trong giây lát.", gateClosedTitle: "Đánh giá đã kết thúc", gateClosedBody: "Thời gian đánh giá của lớp này đã kết thúc. Nếu bạn chưa gửi, vui lòng báo cho nhân viên khảo sát.", refresh: "Tải lại",
    questions: ["Giáo viên đảm bảo giờ học và giảng dạy nhiệt tình.", "Giáo viên trả lời câu hỏi và tư vấn cho học sinh một cách nhiệt tình.", "Giáo viên giảng dạy một cách dễ hiểu.", "Số lượng và nội dung bài tập phù hợp, đồng thời giáo viên phản hồi đầy đủ.", "Giáo viên sử dụng tài liệu bổ trợ và tài liệu tham khảo phù hợp khi cần.", "Giáo viên đã giúp đỡ rất nhiều cho sự tiến bộ tiếng Hàn của tôi.", "Tôi hài lòng về giờ dạy của giáo viên."],
  },
  mn: {
    title: "Хичээлийн үнэлгээ", subtitle: "Багш бүрийн хичээлийг үнэн зөв үнэлнэ үү.", noticeTitle: "Үнэлгээний өмнө", noticeBody: "Үнэлгээний хуудсыг зураг авах болон бусдад тараахгүй байна уу. Хариултыг зөвхөн сургалтыг сайжруулахад ашиглана.",
    noticeConfirm: "Дээрх мэдээллийг уншиж танилцлаа.", start: "Үнэлгээ эхлүүлэх", progress: "Багш", instructorSuffix: "багш", comment: "Багшид хэлэх санал байна уу?", optional: "Заавал биш", back: "Буцах", next: "Дараагийн багш", submit: "Үнэлгээ илгээх", submitting: "Илгээж байна",
    scale: ["Огт санал нийлэхгүй", "Санал нийлэхгүй", "Дунд зэрэг", "Санал нийлнэ", "Үнэхээр санал нийлнэ"], privacy: "Хариултыг нэргүй хадгалж, оролцооны мэдээллээс тусгаарлана.", done: "Үнэлгээ дууслаа", doneBody: "Санал бодлоо хуваалцсанд баярлалаа.", receipt: "Баталгаажуулах дугаар", showReceipt: "Энэ дэлгэцийг судалгааны ажилтанд үзүүлнэ үү.", duplicateError: "Энэ төхөөрөмжөөс үнэлгээ аль хэдийн илгээсэн байна.", otherClassError: "Энэ төхөөрөмжөөс энэ улиралд өөр ангийн үнэлгээг аль хэдийн илгээсэн байна. Нэг төхөөрөмжөөр зөвхөн нэг ангийг үнэлнэ.", submitError: "Үнэлгээг илгээж чадсангүй. Судалгааны ажилтанд мэдэгдэнэ үү.", closedError: "Үнэлгээний хугацаа дууслаа. Судалгааны ажилтанд мэдэгдэнэ үү. Дахин нээгдсэний дараа илгээх товчийг дахин дарна уу.", pendingTitle: "Үнэлгээ хараахан эхлээгүй байна", pendingBody: "Судалгааны ажилтан үнэлгээг эхлүүлэхэд энэ дэлгэц автоматаар үнэлгээний хуудас руу шилжинэ. Түр хүлээнэ үү.", gateClosedTitle: "Үнэлгээ хаагдсан", gateClosedBody: "Энэ ангийн үнэлгээний хугацаа дууссан. Хэрэв та илгээж амжаагүй бол судалгааны ажилтанд мэдэгдэнэ үү.", refresh: "Шинэчлэх",
    questions: ["Багш хичээлийн цагийг сайн баримталж, үнэнч шударгаар хичээл заадаг.", "Багш оюутны асуултад сайн хариулж, зөвлөгөө өгдөг.", "Багш хичээлийг ойлгоход хялбар аргаар заадаг.", "Гэрийн даалгаврын хэмжээ болон агуулга тохиромжтой бөгөөд багш хангалттай санал өгдөг.", "Багш шаардлагатай үед тохиромжтой нэмэлт материал, сурах бичиг ашигладаг.", "Багш солонгос хэлний мэдлэгийг дээшлүүлэхэд маань их тусалдаг.", "Би энэ багшийн хичээлд сэтгэл хангалуун байна."],
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
    comment: "ဤဆရာ/ဆရာမထံ ပြောလိုသော အကြံပြုချက် ရှိပါသလား။",
    optional: "မဖြစ်မနေ မဟုတ်ပါ",
    back: "နောက်သို့",
    next: "နောက်ဆရာ/ဆရာမ",
    submit: "အကဲဖြတ်ချက် ပေးပို့ရန်",
    submitting: "ပေးပို့နေသည်",
    scale: ["လုံးဝ သဘောမတူပါ", "သဘောမတူပါ", "သာမန်", "သဘောတူပါသည်", "အပြည့်အဝ သဘောတူပါသည်"],
    privacy: "ဖြေဆိုချက်များကို အမည်မဖော်ဘဲ သိမ်းဆည်းပြီး ပါဝင်မှုအချက်အလက်နှင့် သီးခြားထားပါသည်။",
    done: "အကဲဖြတ်ခြင်း ပြီးဆုံးပါပြီ",
    doneBody: "သင့်အမြင်ကို မျှဝေပေးသည့်အတွက် ကျေးဇူးတင်ပါသည်။",
    receipt: "အတည်ပြုကုဒ်",
    showReceipt: "ဤဖန်သားပြင်ကို စစ်တမ်းကောက်ယူသူအား ပြပါ။",
    duplicateError: "ဤစက်မှ အကဲဖြတ်ချက်ကို ပေးပို့ပြီးဖြစ်သည်။",
    otherClassError: "ဤစက်မှ ဤစာသင်နှစ်ဝက်တွင် အခြားအတန်းအတွက် အကဲဖြတ်ချက်ကို ပေးပို့ပြီးဖြစ်သည်။ စက်တစ်လုံးဖြင့် အတန်းတစ်တန်းကိုသာ အကဲဖြတ်နိုင်ပါသည်။",
    submitError: "အကဲဖြတ်ချက်ကို ပေးပို့၍ မရပါ။ စစ်တမ်းကောက်ယူသူအား အသိပေးပါ။",
    closedError: "အကဲဖြတ်ချိန် ကုန်ဆုံးသွားပါပြီ။ စစ်တမ်းကောက်ယူသူအား အသိပေးပါ။ ပြန်ဖွင့်ပြီးနောက် ပေးပို့ရန်ခလုတ်ကို ထပ်နှိပ်ပါ။", pendingTitle: "အကဲဖြတ်ခြင်း မစတင်သေးပါ", pendingBody: "စစ်တမ်းကောက်ယူသူက စတင်လိုက်သည်နှင့် ဤဖန်သားပြင်သည် အကဲဖြတ်စာမျက်နှာသို့ အလိုအလျောက် ပြောင်းသွားပါမည်။ ခဏစောင့်ပါ။", gateClosedTitle: "အကဲဖြတ်ခြင်း ပိတ်လိုက်ပါပြီ", gateClosedBody: "ဤအတန်း၏ အကဲဖြတ်ချိန် ကုန်ဆုံးသွားပါပြီ။ မပေးပို့ရသေးပါက စစ်တမ်းကောက်ယူသူအား အသိပေးပါ။", refresh: "ပြန်လည်တင်ရန်",
    questions: [
      "ဆရာ/ဆရာမသည် စာသင်ချိန်ကို လိုက်နာပြီး စိတ်ရင်းမှန်ဖြင့် သင်ကြားခဲ့သည်။",
      "ဆရာ/ဆရာမသည် ကျောင်းသားများ၏ မေးခွန်းများနှင့် အကြံဉာဏ်တောင်းခံမှုများကို စိတ်ရင်းမှန်ဖြင့် ဖြေကြားခဲ့သည်။",
      "ဆရာ/ဆရာမသည် နားလည်လွယ်အောင် သင်ကြားခဲ့သည်။",
      "အိမ်စာ၏ ပမာဏနှင့် အကြောင်းအရာ သင့်လျော်ပြီး အိမ်စာအပေါ် တုံ့ပြန်ချက်ကို လုံလောက်စွာ ရရှိခဲ့သည်။",
      "ဆရာ/ဆရာမသည် လိုအပ်သည့်အချိန်တွင် သင့်လျော်သော အထောက်အကူပြု စာအုပ်များနှင့် ကိုးကားစရာများကို အသုံးပြုခဲ့သည်။",
      "ဆရာ/ဆရာမသည် ကျွန်ုပ်၏ ကိုရီးယားဘာသာစကား စွမ်းရည် တိုးတက်ရန် များစွာ ကူညီပေးခဲ့သည်။",
      "ဤဆရာ/ဆရာမ၏ အတန်းကို တက်ရောက်ခဲ့ရသည့်အတွက် ကျေနပ်ပါသည်။",
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
    comment: "මෙම ගුරුවරයාට පැවසීමට අදහසක් තිබේද?",
    optional: "අනිවාර්ය නොවේ",
    back: "ආපසු",
    next: "ඊළඟ ගුරුවරයා",
    submit: "ඇගයීම යොමු කරන්න",
    submitting: "යොමු කරමින්",
    scale: ["දැඩි ලෙස එකඟ නොවෙමි", "එකඟ නොවෙමි", "මධ්‍යස්ථයි", "එකඟ වෙමි", "දැඩි ලෙස එකඟ වෙමි"],
    privacy: "පිළිතුරු නිර්නාමිකව සුරැකෙන අතර සහභාගීත්ව තොරතුරුවලින් වෙන්ව තබා ඇත.",
    done: "ඇගයීම සම්පූර්ණයි",
    doneBody: "ඔබේ අදහස් ලබා දීම ගැන ස්තුතියි.",
    receipt: "තහවුරු කිරීමේ කේතය",
    showReceipt: "මෙම තිරය සමීක්ෂණ නිලධාරියාට පෙන්වන්න.",
    duplicateError: "මෙම උපාංගයෙන් දැනටමත් ඇගයීමක් යොමු කර ඇත.",
    otherClassError: "මෙම උපාංගයෙන් මෙම වාරයේ දැනටමත් වෙනත් පන්තියක ඇගයීමක් යොමු කර ඇත. එක් උපාංගයකින් ඇගයිය හැක්කේ එක් පන්තියක් පමණි.",
    submitError: "ඇගයීම යොමු කළ නොහැකි විය. කරුණාකර සමීක්ෂණ නිලධාරියාට දන්වන්න.",
    closedError: "ඇගයීමේ කාලය අවසන්. කරුණාකර සමීක්ෂණ නිලධාරියාට දන්වන්න. නැවත විවෘත වූ පසු යොමු කරන්න බොත්තම නැවත ඔබන්න.", pendingTitle: "ඇගයීම තවම ආරම්භ කර නැත", pendingBody: "සමීක්ෂණ නිලධාරියා ඇගයීම ආරම්භ කළ විට මෙම තිරය ස්වයංක්‍රීයව ඇගයීම් පිටුවට මාරු වේ. කරුණාකර මොහොතක් රැඳී සිටින්න.", gateClosedTitle: "ඇගයීම අවසන් කර ඇත", gateClosedBody: "මෙම පන්තියේ ඇගයීම් කාලය අවසන්. ඔබ තවම යොමු කර නොමැති නම්, කරුණාකර සමීක්ෂණ නිලධාරියාට දන්වන්න.", refresh: "නැවත පූරණය කරන්න",
    questions: [
      "ගුරුවරයා පන්ති වේලාව නිසි ලෙස පිළිපැද කැපවීමෙන් ඉගැන්වීය.",
      "ගුරුවරයා සිසුන්ගේ ප්‍රශ්නවලට සහ උපදෙස් ඉල්ලීම්වලට කැපවීමෙන් ප්‍රතිචාර දැක්වීය.",
      "ගුරුවරයා පහසුවෙන් තේරුම් ගත හැකි ලෙස ඉගැන්වීය.",
      "ගෙදර වැඩවල ප්‍රමාණය සහ අන්තර්ගතය සුදුසු වූ අතර, ගෙදර වැඩ පිළිබඳ ප්‍රතිපෝෂණය ප්‍රමාණවත් විය.",
      "අවශ්‍ය අවස්ථාවලදී ගුරුවරයා සුදුසු අතිරේක පොත් සහ ආශ්‍රිත ද්‍රව්‍ය භාවිත කළේය.",
      "මගේ කොරියානු භාෂා හැකියාව වර්ධනය කිරීමට ගුරුවරයා බොහෝ සෙයින් උපකාර කළේය.",
      "මෙම ගුරුවරයාගේ පන්තියට සහභාගී වීම ගැන මම සෑහීමකට පත් වෙමි.",
    ],
  },
  ne: {
    title: "कक्षा मूल्याङ्कन फारम",
    subtitle: "कृपया प्रत्येक शिक्षकको कक्षालाई इमानदारीपूर्वक मूल्याङ्कन गर्नुहोस्।",
    noticeTitle: "मूल्याङ्कन अघि",
    noticeBody: "यो मूल्याङ्कन पृष्ठको स्क्रिनसट नलिनुहोस् र अरूलाई नफैलाउनुहोस्। उत्तरहरू शिक्षण सुधारका लागि मात्र प्रयोग गरिन्छन्।",
    noticeConfirm: "मैले माथिको जानकारी पढेँ र बुझेँ।",
    start: "मूल्याङ्कन सुरु गर्नुहोस्",
    progress: "शिक्षक",
    instructorSuffix: "",
    comment: "यो शिक्षकलाई भन्न चाहनुभएको केही कुरा छ?",
    optional: "ऐच्छिक",
    back: "पछाडि",
    next: "अर्को शिक्षक",
    submit: "मूल्याङ्कन पेस गर्नुहोस्",
    submitting: "पेस हुँदैछ",
    scale: ["पूर्ण रूपमा असहमत", "असहमत", "सामान्य", "सहमत", "पूर्ण रूपमा सहमत"],
    privacy: "उत्तरहरू गोप्य रूपमा सुरक्षित गरिन्छन् र सहभागिताको जानकारीबाट छुट्टै राखिन्छन्।",
    done: "मूल्याङ्कन सम्पन्न भयो",
    doneBody: "आफ्नो राय दिनुभएकोमा धन्यवाद।",
    receipt: "पुष्टि कोड",
    showReceipt: "यो स्क्रिन सर्वेक्षण कर्मचारीलाई देखाउनुहोस्।",
    duplicateError: "यस उपकरणबाट मूल्याङ्कन पहिले नै पेस भइसकेको छ।",
    otherClassError: "यस उपकरणबाट यो सत्रमा अर्को कक्षाको मूल्याङ्कन पहिले नै पेस भइसकेको छ। एउटा उपकरणबाट एउटा कक्षा मात्र मूल्याङ्कन गर्न सकिन्छ।",
    submitError: "मूल्याङ्कन पेस गर्न सकिएन। कृपया सर्वेक्षण कर्मचारीलाई जानकारी दिनुहोस्।",
    closedError: "मूल्याङ्कनको समय सकियो। कृपया सर्वेक्षण कर्मचारीलाई जानकारी दिनुहोस्। फेरि खुलेपछि पेस बटन फेरि थिच्नुहोस्।", pendingTitle: "मूल्याङ्कन अझै सुरु भएको छैन", pendingBody: "सर्वेक्षण कर्मचारीले मूल्याङ्कन सुरु गरेपछि यो स्क्रिन आफैँ मूल्याङ्कन पृष्ठमा बदलिन्छ। कृपया केही बेर पर्खनुहोस्।", gateClosedTitle: "मूल्याङ्कन बन्द भयो", gateClosedBody: "यो कक्षाको मूल्याङ्कन समय सकियो। अझै पेस गर्नुभएको छैन भने कृपया सर्वेक्षण कर्मचारीलाई जानकारी दिनुहोस्।", refresh: "रिफ्रेस गर्नुहोस्",
    questions: [
      "शिक्षकले कक्षाको समय राम्ररी पालना गर्नुभयो र लगनशीलतापूर्वक पढाउनुभयो।",
      "शिक्षकले विद्यार्थीका प्रश्न र परामर्शमा लगनशीलतापूर्वक जवाफ दिनुभयो।",
      "शिक्षकले बुझ्न सजिलो हुने गरी पढाउनुभयो।",
      "गृहकार्यको मात्रा र विषयवस्तु उपयुक्त थियो, र गृहकार्यमा पर्याप्त प्रतिक्रिया दिइयो।",
      "शिक्षकले आवश्यक बेला उपयुक्त सहायक पाठ्यसामग्री र सन्दर्भ सामग्री प्रयोग गर्नुभयो।",
      "शिक्षकले मेरो कोरियाली भाषा क्षमता सुधार गर्न धेरै मद्दत गर्नुभयो।",
      "म यस शिक्षकको कक्षा लिएकोमा सन्तुष्ट छु।",
    ],
  },
  zh: {
    title: "课程评价表", subtitle: "请如实评价每位教师的课程。", noticeTitle: "评价前须知", noticeBody: "请勿截屏或向外传播本评价表。评价内容仅用于改进教学。",
    noticeConfirm: "我已阅读并确认以上内容。", start: "开始评价", progress: "教师", instructorSuffix: "老师", comment: "您想对这位老师说些什么？", optional: "选填", back: "返回", next: "下一位教师", submit: "提交评价", submitting: "提交中",
    scale: ["非常不同意", "不同意", "一般", "同意", "非常同意"], privacy: "回答将匿名保存，并与参与信息分开。", done: "评价已完成", doneBody: "感谢您提供宝贵意见。", receipt: "完成确认码", showReceipt: "请向调查人员出示此画面。", duplicateError: "此设备已提交过评价。", otherClassError: "此设备本学期已提交过其他班级的评价。每台设备只能评价一个班级。", submitError: "无法提交评价，请告知调查人员。", closedError: "评价时间已结束，请告知调查人员。重新开放后，请再次点击提交。", pendingTitle: "评价尚未开始", pendingBody: "调查人员开始评价后，此页面会自动切换到评价表。请稍候。", gateClosedTitle: "评价已结束", gateClosedBody: "本班的评价时间已结束。如果您还没有提交，请告知调查人员。", refresh: "刷新",
    questions: ["老师遵守上课时间，认真授课。", "老师认真回应学生的提问和咨询。", "老师授课通俗易懂。", "作业的数量和内容恰当，并且对作业的反馈充分。", "老师在需要时恰当地使用辅助教材和参考资料。", "老师为提高我的韩国语能力提供了很多帮助。", "我对这位老师的课程感到满意。"],
  },
  ja: {
    title: "授業評価票", subtitle: "先生ごとに授業を率直に評価してください。", noticeTitle: "評価前の確認", noticeBody: "この評価画面を撮影したり、外部に共有したりしないでください。回答は授業改善のためにのみ使用されます。",
    noticeConfirm: "上記の内容を確認しました。", start: "評価を始める", progress: "先生", instructorSuffix: "先生", comment: "先生に伝えたい意見はありますか？", optional: "任意", back: "戻る", next: "次の先生", submit: "評価を提出", submitting: "提出中",
    scale: ["全くそう思わない", "そう思わない", "ふつう", "そう思う", "非常にそう思う"], privacy: "回答は匿名で保存され、参加情報とは分離されます。", done: "評価が完了しました", doneBody: "ご意見をお寄せいただき、ありがとうございます。", receipt: "完了確認番号", showReceipt: "この画面を調査担当者に見せてください。", duplicateError: "この端末からはすでに評価が提出されています。", otherClassError: "この端末からは今学期すでに別のクラスの評価が提出されています。1台の端末で評価できるのは1クラスのみです。", submitError: "提出できませんでした。調査担当者にお知らせください。", closedError: "評価時間が終了しました。調査担当者にお知らせください。再開されたら、もう一度提出ボタンを押してください。", pendingTitle: "評価はまだ始まっていません", pendingBody: "調査担当者が評価を始めると、この画面は自動的に評価画面に切り替わります。しばらくお待ちください。", gateClosedTitle: "評価は締め切られました", gateClosedBody: "このクラスの評価時間は終了しました。まだ提出していない場合は、調査担当者にお知らせください。", refresh: "再読み込み",
    questions: ["先生は授業時間を守り、誠実に教えた。", "先生は学生の質問や相談に誠実に応じた。", "先生は理解しやすく教えた。", "宿題の量と内容は適切で、宿題へのフィードバックは十分だった。", "先生は必要なときに適切な副教材や参考資料を使用した。", "先生は私の韓国語能力向上のために多くの助けを与えた。", "私はこの先生の授業に満足している。"],
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
    comment: "Apakah ada pesan yang ingin Anda sampaikan kepada pengajar ini?",
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
    closedError: "Waktu evaluasi telah berakhir. Silakan beri tahu petugas survei. Setelah dibuka kembali, tekan Kirim sekali lagi.", pendingTitle: "Evaluasi belum dimulai", pendingBody: "Layar ini akan otomatis berganti ke formulir evaluasi saat petugas survei memulainya. Mohon tunggu sebentar.", gateClosedTitle: "Evaluasi sudah ditutup", gateClosedBody: "Waktu evaluasi untuk kelas ini telah berakhir. Jika Anda belum mengirim, silakan beri tahu petugas survei.", refresh: "Muat ulang",
    questions: [
      "Pengajar menepati waktu kelas dan mengajar dengan sungguh-sungguh.",
      "Pengajar menanggapi pertanyaan dan konsultasi siswa dengan sungguh-sungguh.",
      "Pengajar mengajar dengan cara yang mudah dipahami.",
      "Jumlah dan isi pekerjaan rumah sudah sesuai, dan umpan balik atas pekerjaan rumah sudah cukup.",
      "Pengajar menggunakan bahan ajar tambahan dan referensi yang tepat saat diperlukan.",
      "Pengajar banyak membantu meningkatkan kemampuan bahasa Korea saya.",
      "Saya puas mengikuti kelas pengajar ini.",
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
    comment: "มีความคิดเห็นที่อยากบอกอาจารย์ท่านนี้หรือไม่",
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
    closedError: "หมดเวลาประเมินแล้ว โปรดแจ้งเจ้าหน้าที่สำรวจ เมื่อเปิดอีกครั้ง ให้กดส่งอีกครั้ง", pendingTitle: "ยังไม่เริ่มการประเมิน", pendingBody: "เมื่อเจ้าหน้าที่สำรวจเริ่มการประเมิน หน้าจอนี้จะเปลี่ยนเป็นแบบประเมินโดยอัตโนมัติ โปรดรอสักครู่", gateClosedTitle: "ปิดการประเมินแล้ว", gateClosedBody: "หมดเวลาประเมินของห้องเรียนนี้แล้ว หากยังไม่ได้ส่ง โปรดแจ้งเจ้าหน้าที่สำรวจ", refresh: "โหลดใหม่",
    questions: [
      "อาจารย์ตรงต่อเวลาเรียนและสอนอย่างตั้งใจ",
      "อาจารย์ตอบคำถามและให้คำปรึกษาแก่นักเรียนอย่างตั้งใจ",
      "อาจารย์สอนให้เข้าใจได้ง่าย",
      "ปริมาณและเนื้อหาของการบ้านเหมาะสม และได้รับคำแนะนำเกี่ยวกับการบ้านอย่างเพียงพอ",
      "อาจารย์ใช้สื่อการสอนเสริมและเอกสารอ้างอิงที่เหมาะสมเมื่อจำเป็น",
      "อาจารย์ช่วยพัฒนาความสามารถภาษาเกาหลีของข้าพเจ้าได้มาก",
      "ข้าพเจ้าพึงพอใจที่ได้เรียนในชั้นเรียนของอาจารย์ท่านนี้",
    ],
  },
  uz: {
    title: "Dars baholash varaqasi",
    subtitle: "Har bir oʻqituvchining darsini xolis baholang.",
    noticeTitle: "Baholashdan oldin",
    noticeBody: "Ushbu baholash sahifasini skrinshot qilmang va boshqalarga tarqatmang. Javoblar faqat oʻqitishni yaxshilash uchun ishlatiladi.",
    noticeConfirm: "Yuqoridagi maʼlumot bilan tanishib chiqdim.",
    start: "Baholashni boshlash",
    progress: "Oʻqituvchi",
    instructorSuffix: "ustoz",
    comment: "Bu oʻqituvchiga aytmoqchi boʻlgan fikringiz bormi?",
    optional: "Ixtiyoriy",
    back: "Orqaga",
    next: "Keyingi oʻqituvchi",
    submit: "Baholashni yuborish",
    submitting: "Yuborilmoqda",
    scale: ["Mutlaqo qoʻshilmayman", "Qoʻshilmayman", "Oʻrtacha", "Qoʻshilaman", "Toʻliq qoʻshilaman"],
    privacy: "Javoblar anonim saqlanadi va ishtirok maʼlumotlaridan alohida turadi.",
    done: "Baholash yakunlandi",
    doneBody: "Fikringizni bildirganingiz uchun rahmat.",
    receipt: "Tasdiqlash kodi",
    showReceipt: "Bu ekranni soʻrovnoma xodimiga koʻrsating.",
    duplicateError: "Bu qurilmadan baholash allaqachon yuborilgan.",
    otherClassError: "Bu qurilmadan ushbu semestrda boshqa guruh uchun baholash allaqachon yuborilgan. Bitta qurilma faqat bitta guruhni baholay oladi.",
    submitError: "Baholashni yuborib boʻlmadi. Soʻrovnoma xodimiga xabar bering.",
    closedError: "Baholash vaqti tugadi. Soʻrovnoma xodimiga xabar bering. Qayta ochilgach, Yuborish tugmasini yana bosing.", pendingTitle: "Baholash hali boshlanmagan", pendingBody: "Soʻrovnoma xodimi baholashni boshlaganda bu ekran avtomatik ravishda baholash sahifasiga oʻtadi. Iltimos, biroz kuting.", gateClosedTitle: "Baholash yopilgan", gateClosedBody: "Bu guruh uchun baholash vaqti tugadi. Hali yubormagan boʻlsangiz, soʻrovnoma xodimiga xabar bering.", refresh: "Yangilash",
    questions: [
      "Oʻqituvchi dars vaqtiga rioya qildi va vijdonan dars berdi.",
      "Oʻqituvchi talabalarning savollari va maslahat soʻrovlariga vijdonan javob berdi.",
      "Oʻqituvchi tushunarli qilib dars berdi.",
      "Uy vazifalarining hajmi va mazmuni mos edi, uy vazifasi boʻyicha fikr-mulohazalar yetarli boʻldi.",
      "Oʻqituvchi kerakli paytda mos qoʻshimcha oʻquv qoʻllanmalari va maʼlumotnomalardan foydalandi.",
      "Oʻqituvchi koreys tili bilimimni oshirishda koʻp yordam berdi.",
      "Men bu oʻqituvchining darsida oʻqiganimdan mamnunman.",
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
