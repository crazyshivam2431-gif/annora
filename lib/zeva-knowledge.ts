export type ZevaRole = 'donor' | 'ngo' | 'driver' | 'admin';

export type ZevaContext = {
  quantity?: number;
  unit?: string;
  foodType?: 'vegetarian' | 'non-vegetarian';
  location?: string;
  safeUntil?: string;
  intent?: string;
};

export type ZevaReply = {
  text: string;
  context: ZevaContext;
  action?: { label: string; href: string };
};

export type ZevaKnowledgeEntry = {
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  languages: ('en' | 'hi' | 'hinglish')[];
  priority: number;
};

export const ZEVA_KNOWLEDGE_BASE: ZevaKnowledgeEntry[] = [
  { question: 'What is ANNORA?', answer: 'ANNORA coordinates surplus food with suitable NGOs, shelters, and volunteers.', category: '01_PLATFORM', keywords: ['annora', 'purpose', 'platform'], languages: ['en', 'hi', 'hinglish'], priority: 100 },
  { question: 'How can I donate food?', answer: 'Use Donate Food and provide food details, quantity, pickup location, and timing.', category: '02_DONATION', keywords: ['donate', 'food', 'surplus', 'meal'], languages: ['en', 'hi', 'hinglish'], priority: 100 },
  { question: 'How does matching work?', answer: 'Matching may consider distance, capacity, food compatibility, need, operating hours, urgency, and driver availability.', category: '06_MATCHING', keywords: ['match', 'ngo', 'capacity', 'distance'], languages: ['en', 'hi', 'hinglish'], priority: 90 },
  { question: 'How can an NGO register?', answer: 'Submit organisation, contact, location, capacity, and food preference details for review.', category: '04_NGO', keywords: ['ngo', 'shelter', 'register', 'verification'], languages: ['en', 'hi', 'hinglish'], priority: 100 },
  { question: 'How can I volunteer?', answer: 'Submit your contact details, city, and availability through Become Volunteer.', category: '05_DRIVER', keywords: ['volunteer', 'driver', 'pickup', 'delivery'], languages: ['en', 'hi', 'hinglish'], priority: 90 },
  { question: 'What does Delivered mean?', answer: 'Delivered means the donation reached its intended destination.', category: '07_DELIVERY', keywords: ['delivered', 'picked up', 'status'], languages: ['en', 'hi', 'hinglish'], priority: 90 },
  { question: 'What is my impact?', answer: 'Impact must come from authorized live account data; ZEVA will not invent numbers.', category: '08_IMPACT', keywords: ['impact', 'meals rescued', 'food diverted'], languages: ['en', 'hi', 'hinglish'], priority: 100 },
  { question: 'Is food definitely safe?', answer: 'ANNORA does not independently certify food safety; use applicable responsible handling practices.', category: '12_SAFETY', keywords: ['safe', 'hygiene', 'food safety'], languages: ['en', 'hi', 'hinglish'], priority: 100 },
  { question: 'Can you share another user’s information?', answer: 'ZEVA cannot reveal another user’s private information.', category: '13_PRIVACY', keywords: ['privacy', 'phone', 'address', 'private'], languages: ['en', 'hi', 'hinglish'], priority: 100 },
  { question: 'What is ZEVA?', answer: "ZEVA AI is ANNORA's intelligent food-rescue assistant.", category: '15_ZEVA', keywords: ['zeva', 'assistant', 'who are you'], languages: ['en', 'hi', 'hinglish'], priority: 100 },
];

const hasAny = (value: string, terms: string[]) => terms.some((term) => value.includes(term));
const isHindi = (value: string) => hasAny(value, ['kya', 'kaise', 'kaisa', 'mujhe', 'mera', 'meri', 'khana', 'madad', 'dikhao', 'karo', 'hai', 'hain', 'chahiye', 'batao', 'karu']);
const getLanguageIntro = (value: string) => isHindi(value) ? 'ANNORA ek AI-powered food-rescue platform hai jo surplus food ko suitable NGOs, shelters aur volunteers tak pahunchane ko coordinate karta hai.' : 'ANNORA is an AI-powered food-rescue platform that coordinates surplus food with suitable NGOs, shelters, and volunteers.';

function extractContext(message: string, previous: ZevaContext): ZevaContext {
  const quantity = message.match(/\b(\d+)\s*(meals?|kg|kilo|packets?|plates?)?\b/i);
  const next: ZevaContext = { ...previous };
  if (quantity) {
    next.quantity = Number(quantity[1]);
    next.unit = quantity[2] ?? previous.unit ?? 'meals';
  }
  if (hasAny(message, ['vegetarian', 'veg', 'शाकाहारी'])) next.foodType = 'vegetarian';
  if (hasAny(message, ['non-vegetarian', 'non vegetarian', 'nonveg', 'non-veg', 'मांसाहारी'])) next.foodType = 'non-vegetarian';
  const city = message.match(/\b(jaipur|delhi|mumbai|pune|bangalore|bengaluru|udaipur|jodhpur|kota)\b/i);
  if (city) next.location = city[1];
  return next;
}

export function answerZeva(message: string, role: ZevaRole = 'donor', previous: ZevaContext = {}): ZevaReply {
  const lower = message.trim().toLowerCase();
  const context = extractContext(lower, previous);
  const hindi = isHindi(lower);

  if (!lower) return { text: 'Please tell me what you need help with.', context };
  if (hasAny(lower, ['hello', 'hi', 'hey', 'namaste', 'नमस्ते'])) {
    return { text: "Namaste! I'm ZEVA AI, ANNORA's intelligent food-rescue assistant. How can I help you today?", context };
  }
  if (hasAny(lower, ['another user', 'someone else', 'dusre user', 'kisi aur ka']) && hasAny(lower, ['phone', 'number', 'address', 'email', 'contact'])) {
    return { text: "I can't provide another user's private information. I can help you use ANNORA's support or contact process.", context };
  }
  if (hasAny(lower, ['definitely safe', 'is this food safe', 'food safe', 'safe hai', 'safety', 'hygiene'])) {
    return { text: 'ANNORA independently food safety certify nahi karta. Food ko applicable food-safety requirements aur responsible handling practices ke according assess aur handle karein.', context, action: { label: 'Donate Food', href: '/donate' } };
  }
  if (hasAny(lower, ['who are you', 'what is zeva', 'zeva kya', 'tum kaun'])) {
    return { text: "I'm ZEVA AI, ANNORA's intelligent food-rescue assistant. I can help you understand ANNORA, donate surplus food, find support, track rescue information, and answer ANNORA-related questions.", context };
  }
  if (hasAny(lower, ['what is annora', 'annora kya', 'annora ka purpose', 'tell me about annora'])) {
    return { text: getLanguageIntro(lower), context, action: { label: 'How ANNORA works', href: '/how-it-works' } };
  }
  if (hasAny(lower, ['how does annora work', 'how it works', 'workflow', 'process kya'])) {
    return { text: hindi ? 'Donor register karta hai, food details submit karta hai, ANNORA eligible NGO/shelter identify karta hai, pickup coordinate hota hai, delivery complete hoti hai aur impact update hota hai.' : 'A donor registers, posts food details, ANNORA identifies eligible organizations, a pickup is coordinated, the food is delivered, and impact is updated.', context, action: { label: 'See workflow', href: '/how-it-works' } };
  }
  if (hasAny(lower, ['what can you do', 'help me', 'capabilities', 'madad'])) {
    return { text: 'I can help with ANNORA, donations, NGOs and shelters, matching, pickup and delivery, impact, accounts, navigation, privacy, and food-rescue rules.', context };
  }
  if (context.intent === 'donation' && context.quantity && context.foodType && context.location && hasAny(lower, ['pickup', 'location', 'jaipur', 'delhi', 'mumbai', 'pune', 'bangalore', 'bengaluru', 'udaipur', 'jodhpur', 'kota'])) {
    return { text: `${context.location} pickup location noted. Ye food approximately kis time tak pickup/deliver ho jana chahiye?`, context };
  }
  if (hasAny(lower, ['donate', 'food', 'meal', 'khana', 'surplus'])) {
    if (context.quantity && context.foodType && !context.location) {
      return { text: `${context.quantity} ${context.unit ?? 'meals'} of ${context.foodType} food noted. Pickup location kya hai?`, context: { ...context, intent: 'donation' } };
    }
    if (context.quantity && !context.foodType) {
      return { text: `${context.quantity} ${context.unit ?? 'meals'} noted. Food vegetarian hai ya non-vegetarian?`, context: { ...context, intent: 'donation' } };
    }
    return { text: hindi ? 'Donate Food section mein food name, quantity, food type, pickup location aur safe-until/pickup timing enter karein. Submit ke baad ANNORA rescue workflow start karega.' : "Open Donate Food and enter the food name, quantity, food type, pickup location, and safe-until or pickup timing. After submission, ANNORA starts the rescue workflow.", context: { ...context, intent: 'donation' }, action: { label: 'Open Donate Food', href: '/donate' } };
  }
  if (hasAny(lower, ['restaurant', 'hotel', 'canteen', 'caterer', 'event'])) {
    return { text: 'Eligible restaurants, hotels, cafeterias, college canteens, caterers, and event organizers can use the donor workflow to submit surplus food.', context, action: { label: 'Create donor account', href: '/register/donor' } };
  }
  if (hasAny(lower, ['ngo', 'shelter', 'organization', 'organisation']) && hasAny(lower, ['register', 'join', 'kaise'])) {
    return { text: hindi ? 'NGO / Shelter registration mein organization details, authorized contact, location, capacity, meal requirement aur food preferences submit karein. Verification review ke baad status update hoga.' : 'Register an NGO or shelter with organization details, authorized contact, location, capacity, meal requirement, and food preferences. Verification status is updated after review.', context, action: { label: 'Register NGO / Shelter', href: '/ngo/register' } };
  }
  if (hasAny(lower, ['every ngo verified', 'automatically verified', 'verified hai'])) {
    return { text: 'No. NGO applications go through ANNORA verification before they can participate as verified organizations.', context };
  }
  if (hasAny(lower, ['volunteer', 'driver', 'pickup help', 'become'])) {
    return { text: hindi ? 'Volunteer application mein personal details, city aur availability submit karein. ANNORA pickup, delivery aur rescue coordination ke liye network se connect karega.' : 'Apply as a volunteer with your contact details, city, and availability. ANNORA can connect the network for pickup, delivery, and rescue coordination.', context, action: { label: 'Become a volunteer', href: '/volunteer' } };
  }
  if (hasAny(lower, ['match', 'matching', 'selected', 'choose ngo'])) {
    return { text: 'ANNORA may consider distance, available capacity, food compatibility, reported need, operating hours, urgency, and driver availability. I do not have enough live match data to explain a specific selection right now.', context };
  }
  if (hasAny(lower, ['posted', 'matched', 'driver assigned', 'picked up', 'delivered', 'expired', 'cancelled', 'failed', 'status', 'track', 'where is my donation'])) {
    return { text: 'I do not have your current authorized donation status available in this chat right now. Open your dashboard to view the live record. Statuses mean: Posted = submitted, Matched = eligible organization identified, Driver Assigned = pickup coordinated, Picked Up = collected, Delivered = reached destination, Expired/Cancelled/Failed = workflow stopped.', context, action: { label: 'Open dashboard', href: role === 'donor' ? '/dashboard/donor' : '/login' } };
  }
  if (hasAny(lower, ['impact', 'meals rescued', 'food diverted'])) {
    return { text: "I don't have your current authorized impact data available right now. Open your dashboard or Impact page for the latest available metrics.", context, action: { label: 'View impact', href: '/impact' } };
  }
  if (hasAny(lower, ['login', 'sign in', 'register', 'account', 'dashboard', 'logout', 'password'])) {
    return { text: 'Use Login for an existing account or Register to choose donor, NGO/shelter, or volunteer onboarding. Your dashboard is available after authentication.', context, action: { label: 'Open account', href: '/login' } };
  }
  if (hasAny(lower, ['privacy', 'data', 'security', 'secure', 'password', 'api key'])) {
    return { text: 'ANNORA uses only the information needed for rescue coordination. Do not share passwords, secrets, documents, or private contact details in chat. I cannot bypass authorization or expose protected data.', context };
  }
  if (hasAny(lower, ['contact', 'support', 'phone', 'email'])) {
    return { text: 'ANNORA support is available at +91 70734 15826 and shivambindal126@gmail.com. You can also submit a request through Find Support.', context, action: { label: 'Find Support', href: '/support' } };
  }
  if (hasAny(lower, ['map', 'live rescue', 'route', 'notification'])) {
    return { text: 'You can view active rescue routes on Live Rescue and account updates in Notifications.', context, action: { label: 'Open Live Rescue', href: '/rescue' } };
  }
  return { text: "I don't have enough reliable information to answer that accurately. I can help with ANNORA, food rescue, donations, NGO/shelter matching, volunteers, delivery, impact, privacy, and account navigation.", context };
}
