// English + Bangla copy for every user-facing string in the app, grouped by
// page. Keys are dot-paths, e.g. t('login.title'). Add a new language by
// adding a new key inside each leaf object (e.g. `hi: '...'`).
const translations = {
  common: {
    loading: { en: 'Loading...', bn: 'লোড হচ্ছে...' },
    appName: { en: 'Punoshristi', bn: 'পুনঃসৃষ্টি' },
    pts: { en: 'pts', bn: 'পয়েন্ট' },
  },

  nav: {
    home: { en: 'Home', bn: 'হোম' },
    map: { en: 'Map', bn: 'মানচিত্র' },
    scan: { en: 'Scan', bn: 'স্ক্যান' },
    ranks: { en: 'Ranks', bn: 'র‍্যাঙ্ক' },
    profile: { en: 'Profile', bn: 'প্রোফাইল' },
  },

  splash: {
    tagline: { en: 'Recycle. Reward. Rebuild.', bn: 'রিসাইকেল। পুরস্কার। পুনর্গঠন।' },
    poweredBy: { en: 'Powered by Punoshristi', bn: 'পাওয়ার্ড বাই পুনঃসৃষ্টি' },
  },

  onboarding: {
    step1Title: { en: 'Drop Your Bottle', bn: 'বোতল জমা দিন' },
    step1Body: {
      en: 'Find a Punoshristi machine near you and insert your empty plastic PET bottle.',
      bn: 'আপনার কাছাকাছি একটি পুনঃসৃষ্টি মেশিন খুঁজুন এবং আপনার খালি প্লাস্টিক PET বোতল ঢুকিয়ে দিন।',
    },
    step2Title: { en: 'Scan & Earn Points', bn: 'স্ক্যান করুন ও পয়েন্ট অর্জন করুন' },
    step2Body: {
      en: 'Scan the QR code on the machine screen. Points hit your wallet instantly — no delays.',
      bn: 'মেশিনের স্ক্রিনে থাকা QR কোড স্ক্যান করুন। সাথে সাথেই আপনার ওয়ালেটে পয়েন্ট যোগ হয়ে যাবে — কোনো দেরি নেই।',
    },
    step3Title: { en: 'Redeem Your Rewards', bn: 'আপনার পুরস্কার রিডিম করুন' },
    step3Body: {
      en: 'Use your Punoshristi points for real discounts at partner restaurants, shops and cafes across Dhaka.',
      bn: 'ঢাকার পার্টনার রেস্তোরাঁ, দোকান ও ক্যাফেতে আসল ছাড় পেতে আপনার পুনঃসৃষ্টি পয়েন্ট ব্যবহার করুন।',
    },
    next: { en: 'Next', bn: 'পরবর্তী' },
    getStarted: { en: 'Get Started', bn: 'শুরু করুন' },
    skip: { en: 'Skip onboarding', bn: 'বাদ দিন' },
    alreadyHaveAccount: { en: 'Already have an account?', bn: 'ইতিমধ্যে অ্যাকাউন্ট আছে?' },
    login: { en: 'Login', bn: 'লগইন' },
  },

  login: {
    welcomeBack: { en: 'Welcome Back 👋', bn: 'ফিরে আসার জন্য স্বাগতম 👋' },
    subtitle: { en: 'Login to check your points and rewards', bn: 'আপনার পয়েন্ট ও পুরস্কার দেখতে লগইন করুন' },
    phoneOrEmail: { en: 'Phone or Email', bn: 'ফোন নম্বর বা ইমেইল' },
    phoneOrEmailPlaceholder: { en: 'e.g. 01XXXXXXXXX or email@example.com', bn: 'যেমন: 01XXXXXXXXX অথবা email@example.com' },
    password: { en: 'Password', bn: 'পাসওয়ার্ড' },
    loginBtn: { en: 'Login', bn: 'লগইন করুন' },
    loggingIn: { en: 'Logging in...', bn: 'লগইন হচ্ছে...' },
    noAccount: { en: "Don't have an account?", bn: 'অ্যাকাউন্ট নেই?' },
    registerHere: { en: 'Register Here', bn: 'এখানে রেজিস্টার করুন' },
    errRequired: { en: 'Please enter your phone/email and password.', bn: 'অনুগ্রহ করে আপনার ফোন/ইমেইল ও পাসওয়ার্ড দিন।' },
    errGeneric: { en: 'Could not log in. Please try again.', bn: 'লগইন করা যায়নি। আবার চেষ্টা করুন।' },
  },

  register: {
    title: { en: 'Create Your Account', bn: 'আপনার অ্যাকাউন্ট তৈরি করুন' },
    subtitle: { en: 'Join thousands recycling for rewards', bn: 'পুরস্কারের জন্য রিসাইক্লিং করা হাজারো মানুষের সাথে যোগ দিন' },
    fullName: { en: 'Full Name', bn: 'পূর্ণ নাম' },
    fullNamePlaceholder: { en: 'John Doe', bn: 'আপনার পুরো নাম' },
    phoneNumber: { en: 'Phone Number', bn: 'ফোন নম্বর' },
    email: { en: 'Email', bn: 'ইমেইল' },
    password: { en: 'Password', bn: 'পাসওয়ার্ড' },
    confirmPassword: { en: 'Confirm Password', bn: 'পাসওয়ার্ড নিশ্চিত করুন' },
    agreePrefix: { en: 'I agree to the', bn: 'আমি' },
    termsOfService: { en: 'Terms of Service', bn: 'ব্যবহারের শর্তাবলী' },
    and: { en: 'and', bn: 'এবং' },
    privacyPolicy: { en: 'Privacy Policy', bn: 'গোপনীয়তা নীতি' },
    agreeSuffix: { en: '.', bn: '-তে সম্মত।' },
    createAccount: { en: 'Create Account', bn: 'অ্যাকাউন্ট তৈরি করুন' },
    creating: { en: 'Creating account...', bn: 'অ্যাকাউন্ট তৈরি হচ্ছে...' },
    haveAccount: { en: 'Already have an account?', bn: 'ইতিমধ্যে অ্যাকাউন্ট আছে?' },
    loginHere: { en: 'Login Here', bn: 'এখানে লগইন করুন' },
    errRequired: { en: 'Please fill in your name, phone, email and password.', bn: 'অনুগ্রহ করে নাম, ফোন, ইমেইল ও পাসওয়ার্ড পূরণ করুন।' },
    errPhoneFormat: { en: 'Phone number must be exactly 11 digits (e.g. 01712345678).', bn: 'ফোন নম্বর অবশ্যই ঠিক ১১ সংখ্যার হতে হবে (যেমন: 01712345678)।' },
    errPasswordLength: { en: 'Password must be at least 6 characters.', bn: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' },
    errPasswordMismatch: { en: 'Passwords do not match.', bn: 'পাসওয়ার্ড মিলছে না।' },
    errAgreeTerms: { en: 'Please agree to the Terms of Service and Privacy Policy.', bn: 'অনুগ্রহ করে ব্যবহারের শর্তাবলী ও গোপনীয়তা নীতিতে সম্মত হন।' },
    errGeneric: { en: 'Registration failed. Please try again.', bn: 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' },
  },

  otp: {
    title: { en: 'Verify Your Number', bn: 'আপনার নম্বর যাচাই করুন' },
    subtitlePrefix: { en: 'We sent a 6-digit code to', bn: 'আমরা একটি ৬-সংখ্যার কোড পাঠিয়েছি' },
    devModePrefix: { en: 'Dev mode: your code is', bn: 'ডেভ মোড: আপনার কোড হলো' },
    devModeSuffix: { en: '(no SMS gateway configured yet)', bn: '(এখনো কোনো SMS গেটওয়ে কনফিগার করা হয়নি)' },
    codeSent: { en: 'Verification code sent.', bn: 'যাচাইকরণ কোড পাঠানো হয়েছে।' },
    errSend: { en: 'Could not send verification code.', bn: 'যাচাইকরণ কোড পাঠানো যায়নি।' },
    resend: { en: 'Resend OTP', bn: 'আবার কোড পাঠান' },
    sending: { en: 'Sending...', bn: 'পাঠানো হচ্ছে...' },
    verify: { en: 'Verify & Continue', bn: 'যাচাই করুন ও এগিয়ে যান' },
    verifying: { en: 'Verifying...', bn: 'যাচাই করা হচ্ছে...' },
    errIncomplete: { en: 'Enter the full 6-digit code.', bn: 'পুরো ৬-সংখ্যার কোড লিখুন।' },
    errFailed: { en: 'Verification failed.', bn: 'যাচাই ব্যর্থ হয়েছে।' },
  },

  dashboard: {
    greeting: { en: 'Good day, {name} 👋', bn: 'শুভেচ্ছা, {name} 👋' },
    tagline: { en: 'Every bottle counts towards a greener planet.', bn: 'প্রতিটি বোতল একটি সবুজ পৃথিবীর জন্য গুরুত্বপূর্ণ।' },
    ecoBalance: { en: 'Total Eco-Balance', bn: 'মোট ইকো-ব্যালেন্স' },
    points: { en: 'Points', bn: 'পয়েন্ট' },
    bottles: { en: 'Bottles', bn: 'বোতল' },
    rank: { en: 'Rank', bn: 'র‍্যাঙ্ক' },
    scanQr: { en: 'Scan QR', bn: 'QR স্ক্যান' },
    findRvm: { en: 'Find RVM', bn: 'মেশিন খুঁজুন' },
    redeem: { en: 'Redeem', bn: 'রিডিম' },
    ranks: { en: 'Ranks', bn: 'র‍্যাঙ্ক' },
    nearbyMachine: { en: 'Nearby Machine', bn: 'কাছাকাছি মেশিন' },
    viewAll: { en: 'View All', bn: 'সব দেখুন' },
    kmAway: { en: '{km} km away', bn: '{km} কিমি দূরে' },
    activeReady: { en: 'ACTIVE & READY', bn: 'সক্রিয় ও প্রস্তুত' },
    recentActivity: { en: 'Recent Activity', bn: 'সাম্প্রতিক কার্যকলাপ' },
    noActivity: { en: 'No activity yet — go recycle a bottle!', bn: 'এখনো কোনো কার্যকলাপ নেই — একটি বোতল রিসাইকেল করুন!' },
    exclusiveOffers: { en: 'Exclusive Offers', bn: 'বিশেষ অফার' },
    fromPoints: { en: 'From {points} Points', bn: '{points} পয়েন্ট থেকে' },
    pts: { en: 'pts', bn: 'পয়েন্ট' },
  },

  activity: {
    recycledWithMachine: { en: '{count} bottle{plural} recycled at {machine}', bn: '{machine}-এ {count}টি বোতল রিসাইকেল হয়েছে' },
    recycledNoMachine: { en: '{count} bottle{plural} recycled', bn: '{count}টি বোতল রিসাইকেল হয়েছে' },
    redeemed: { en: 'Redeemed: {offer} at {partner}', bn: 'রিডিম করা হয়েছে: {partner}-এ {offer}' },
  },

  scan: {
    title: { en: 'Scan Machine QR', bn: 'মেশিনের QR স্ক্যান করুন' },
    pointCamera: { en: 'Point your camera at the machine QR code', bn: 'মেশিনের QR কোডের দিকে আপনার ক্যামেরা ধরুন' },
    orManual: { en: 'Or Enter Code Manually', bn: 'অথবা কোড ম্যানুয়ালি লিখুন' },
    codePlaceholder: { en: 'e.g. RVM-7729', bn: 'যেমন: RVM-7729' },
    confirmCode: { en: 'Confirm Code', bn: 'কোড নিশ্চিত করুন' },
    retryCamera: { en: 'Retry Camera Scan', bn: 'আবার ক্যামেরা স্ক্যান করুন' },
    verifying: { en: 'Verifying...', bn: 'যাচাই করা হচ্ছে...' },
    errCameraStart: { en: 'Could not start the camera module', bn: 'ক্যামেরা মডিউল চালু করা যায়নি' },
    errCameraAccess: {
      en: 'Could not access the camera. Please allow camera permission and try again, or enter the code manually below.',
      bn: 'ক্যামেরা অ্যাক্সেস করা যায়নি। অনুগ্রহ করে ক্যামেরার অনুমতি দিন এবং আবার চেষ্টা করুন, অথবা নিচে ম্যানুয়ালি কোড লিখুন।',
    },
    errCameraRetry: { en: 'Could not access the camera. Try the manual code entry below.', bn: 'ক্যামেরা অ্যাক্সেস করা যায়নি। নিচে ম্যানুয়াল কোড এন্ট্রি ব্যবহার করুন।' },
    errVerify: { en: 'Could not verify this code. Please try again.', bn: 'এই কোডটি যাচাই করা যায়নি। আবার চেষ্টা করুন।' },
  },

  success: {
    pointsEarned: { en: '+{points} Points Earned! 🎉', bn: '+{points} পয়েন্ট অর্জিত! 🎉' },
    bottlesRecycled: { en: '{count} bottle{plural} recycled successfully', bn: '{count}টি বোতল সফলভাবে রিসাইকেল হয়েছে' },
    totalPoints: { en: 'Total Points', bn: 'মোট পয়েন্ট' },
    bottlesToday: { en: 'Bottles Today', bn: 'আজকের বোতল' },
    currentRank: { en: 'Current Rank', bn: 'বর্তমান র‍্যাঙ্ক' },
    roadToLevel: { en: 'Road to Level {level}', bn: 'লেভেল {level}-এর পথে' },
    maxLevel: { en: 'Max Level Reached', bn: 'সর্বোচ্চ লেভেল অর্জিত' },
    ptsToGo: { en: '{pts} pts to go', bn: 'আর {pts} পয়েন্ট বাকি' },
    recycleAnother: { en: 'Recycle Another', bn: 'আরেকটি রিসাইকেল করুন' },
    goDashboard: { en: 'Go To Dashboard', bn: 'ড্যাশবোর্ডে যান' },
  },

  map: {
    findNearest: { en: 'Find nearest RVM...', bn: 'কাছাকাছি মেশিন খুঁজুন...' },
    active: { en: 'Active', bn: 'সক্রিয়' },
    almostFull: { en: 'Almost Full', bn: 'প্রায় পূর্ণ' },
    getDirections: { en: 'Get Directions', bn: 'দিকনির্দেশনা নিন' },
    kmAway: { en: '{km} km away', bn: '{km} কিমি দূরে' },
  },

  partners: {
    title: { en: 'Our Partners', bn: 'আমাদের পার্টনার' },
    subtitle: { en: 'Redeem your Eco-Points for exclusive rewards.', bn: 'বিশেষ পুরস্কারের জন্য আপনার ইকো-পয়েন্ট রিডিম করুন।' },
    searchPlaceholder: { en: 'Search for stores or offers...', bn: 'দোকান বা অফার খুঁজুন...' },
    all: { en: 'All', bn: 'সব' },
    featured: { en: 'FEATURED', bn: 'ফিচার্ড' },
    fromPointsAt: { en: 'From {points} points at {category}', bn: '{category}-এ {points} পয়েন্ট থেকে' },
    fromPoints: { en: 'From {points} Points', bn: '{points} পয়েন্ট থেকে' },
    pointsSuffix: { en: 'Points', bn: 'পয়েন্ট' },
    viewOffer: { en: 'View Offer', bn: 'অফার দেখুন' },
    noPartners: { en: 'No partners found.', bn: 'কোনো পার্টনার পাওয়া যায়নি।' },
  },

  partnerDetail: {
    yourBalance: { en: 'Your Balance', bn: 'আপনার ব্যালেন্স' },
    availableOffers: { en: 'Available Offers', bn: 'উপলব্ধ অফার' },
    noOffers: { en: 'No offers available right now.', bn: 'এই মুহূর্তে কোনো অফার নেই।' },
    redeem: { en: 'Redeem', bn: 'রিডিম' },
    redeemedMessage: { en: 'Redeemed: {title}! Show this screen to staff to claim it.', bn: 'রিডিম হয়েছে: {title}! এটি দাবি করতে এই স্ক্রিনটি স্টাফকে দেখান।' },
    errRedeem: { en: 'Could not redeem this offer.', bn: 'এই অফারটি রিডিম করা যায়নি।' },
    location: { en: 'Location', bn: 'অবস্থান' },
    points: { en: 'Points', bn: 'পয়েন্ট' },
  },

  leaderboard: {
    title: { en: 'Leaderboard', bn: 'লিডারবোর্ড' },
    thisWeek: { en: 'This Week', bn: 'এই সপ্তাহ' },
    thisMonth: { en: 'This Month', bn: 'এই মাস' },
    allTime: { en: 'All Time', bn: 'সর্বকাল' },
    noActivity: { en: 'No recycling activity yet for this period.', bn: 'এই সময়ের জন্য এখনো কোনো রিসাইক্লিং কার্যকলাপ নেই।' },
    you: { en: 'You', bn: 'আপনি' },
    recyclersRanked: { en: '{count} recyclers ranked', bn: '{count} জন রিসাইক্লার র‍্যাঙ্ক করা হয়েছে' },
    topRecyclers: { en: 'Top Recyclers', bn: 'শীর্ষ রিসাইক্লার' },
    users: { en: 'Users', bn: 'ব্যবহারকারী' },
    pts: { en: 'pts', bn: 'পয়েন্ট' },
  },

  profile: {
    ecoWarriorLevel: { en: 'Eco Warrior Level {level}', bn: 'ইকো ওয়ারিয়র লেভেল {level}' },
    points: { en: 'Points', bn: 'পয়েন্ট' },
    bottles: { en: 'Bottles', bn: 'বোতল' },
    rank: { en: 'Rank', bn: 'র‍্যাঙ্ক' },
    greenImpact: { en: 'Your Green Impact 🌿', bn: 'আপনার সবুজ প্রভাব 🌿' },
    co2Message: {
      en: "You've saved approximately {co2}kg of CO2 from entering the atmosphere this month. Keep up the great work!",
      bn: 'আপনি এই মাসে প্রায় {co2}কেজি CO2 বায়ুমণ্ডলে প্রবেশ করা থেকে বাঁচিয়েছেন। দারুণ কাজ চালিয়ে যান!',
    },
    levelProgress: { en: 'Level {level} Progress', bn: 'লেভেল {level} অগ্রগতি' },
    rewards: { en: 'Rewards', bn: 'পুরস্কার' },
    history: { en: 'History', bn: 'ইতিহাস' },
    locations: { en: 'Locations', bn: 'অবস্থানসমূহ' },
    settings: { en: 'Settings', bn: 'সেটিংস' },
    privacy: { en: 'Privacy', bn: 'গোপনীয়তা' },
    help: { en: 'Help', bn: 'সাহায্য' },
    contact: { en: 'Contact', bn: 'যোগাযোগ' },
    rate: { en: 'Rate', bn: 'রেটিং দিন' },
    logout: { en: 'Logout', bn: 'লগআউট' },
    ptsSuffix: { en: 'Pts', bn: 'পয়েন্ট' },
  },

  history: {
    title: { en: 'History', bn: 'ইতিহাস' },
    loading: { en: 'Loading...', bn: 'লোড হচ্ছে...' },
    noActivity: { en: 'No activity yet.', bn: 'এখনো কোনো কার্যকলাপ নেই।' },
  },

  info: {
    settingsTitle: { en: 'Settings', bn: 'সেটিংস' },
    settingsBody: { en: 'Account and notification settings are coming soon.', bn: 'অ্যাকাউন্ট ও নোটিফিকেশন সেটিংস শীঘ্রই আসছে।' },
    privacyTitle: { en: 'Privacy', bn: 'গোপনীয়তা' },
    privacyBody: { en: 'Our privacy policy will be published here.', bn: 'আমাদের গোপনীয়তা নীতি এখানে প্রকাশ করা হবে।' },
    helpTitle: { en: 'Help', bn: 'সাহায্য' },
    helpBody: { en: 'A help center / FAQ is coming soon.', bn: 'একটি হেল্প সেন্টার / FAQ শীঘ্রই আসছে।' },
    contactTitle: { en: 'Contact', bn: 'যোগাযোগ' },
    contactBody: { en: 'Reach the Punoshristi team at hello@punoshristi.com.', bn: 'hello@punoshristi.com-এ পুনঃসৃষ্টি টিমের সাথে যোগাযোগ করুন।' },
    rateTitle: { en: 'Rate Punoshristi', bn: 'পুনঃসৃষ্টিকে রেট করুন' },
    rateBody: { en: 'App store ratings will be enabled once Punoshristi ships to app stores.', bn: 'পুনঃসৃষ্টি অ্যাপ স্টোরে প্রকাশিত হলে রেটিং চালু করা হবে।' },
    defaultTitle: { en: 'Info', bn: 'তথ্য' },
    defaultBody: { en: 'Coming soon.', bn: 'শীঘ্রই আসছে।' },
  },
};

// Resolve a dot-path like "login.title" against the translations object.
export function resolveKey(key) {
  return key.split('.').reduce((node, part) => (node ? node[part] : undefined), translations);
}

export default translations;
