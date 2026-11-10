import { matchVoiceCommand, normalizeVoiceInput, SupportedLanguage } from './voiceRegistry';

interface TestCase {
  input: string;
  lang: SupportedLanguage;
  expectedRoute: string | null;
  description: string;
}

const testCases: TestCase[] = [
  // 1. Marketplace commands
  { input: 'Take me to Marketplace.', lang: 'en', expectedRoute: '/marketplace', description: 'English: Take me to Marketplace.' },
  { input: 'Open Marketplace', lang: 'en', expectedRoute: '/marketplace', description: 'English: Open Marketplace' },
  { input: 'market', lang: 'en', expectedRoute: '/marketplace', description: 'English: market' },
  { input: 'go to market', lang: 'en', expectedRoute: '/marketplace', description: 'English: go to market' },
  { input: 'ಮಾರ್ಕೆಟ್ಪ್ಲೇಸ್ ತೆರೆಯಿರಿ', lang: 'kn', expectedRoute: '/marketplace', description: 'Kannada: ಮಾರ್ಕೆಟ್ಪ್ಲೇಸ್ ತೆರೆಯಿರಿ' },
  { input: 'ಮಾರುಕಟ್ಟೆಗೆ ಹೋಗಿ', lang: 'kn', expectedRoute: '/marketplace', description: 'Kannada: ಮಾರುಕಟ್ಟೆಗೆ ಹೋಗಿ' },
  { input: 'marketplace kholo', lang: 'hi', expectedRoute: '/marketplace', description: 'Hinglish: marketplace kholo' },
  { input: 'मार्केटप्लेस खोलो', lang: 'hi', expectedRoute: '/marketplace', description: 'Hindi: मार्केटप्लेस खोलो' },
  { input: 'बाजार जाओ', lang: 'hi', expectedRoute: '/marketplace', description: 'Hindi: बाजार जाओ' },
  { input: 'మార్కెట్ప్లేస్ తెరవండి', lang: 'te', expectedRoute: '/marketplace', description: 'Telugu: మార్కెట్ప్లేస్ తెరవండి' },
  { input: 'மார்க்கெட்பிளேஸைத் திறக்கவும்', lang: 'ta', expectedRoute: '/marketplace', description: 'Tamil: மார்க்கெட்பிளேஸைத் திறக்கவும்' },

  // 2. Veterinary & Doctor commands
  { input: 'Open Veterinary.', lang: 'en', expectedRoute: '/medical', description: 'English: Open Veterinary.' },
  { input: 'Go to Health.', lang: 'en', expectedRoute: '/medical', description: 'English: Go to Health.' },
  { input: 'Go to Veterinary', lang: 'en', expectedRoute: '/medical', description: 'English: Go to Veterinary' },
  { input: 'Open the doctor page', lang: 'en', expectedRoute: '/medical', description: 'English: Open the doctor page' },
  { input: 'doctor', lang: 'en', expectedRoute: '/medical', description: 'English: doctor' },
  { input: 'find vet', lang: 'en', expectedRoute: '/medical', description: 'English: find vet' },
  { input: 'ಪಶು ವೈದ್ಯರು', lang: 'kn', expectedRoute: '/medical', description: 'Kannada: ಪಶು ವೈದ್ಯರು' },
  { input: 'ಡಾಕ್ಟರ್', lang: 'kn', expectedRoute: '/medical', description: 'Kannada: ಡಾಕ್ಟರ್' },
  { input: 'doctor page ge hogi', lang: 'kn', expectedRoute: '/medical', description: 'Kannada spoken: doctor page ge hogi' },
  { input: 'पशु चिकित्सक', lang: 'hi', expectedRoute: '/medical', description: 'Hindi: पशु चिकित्सक' },
  { input: 'डॉक्टर पेज', lang: 'hi', expectedRoute: '/medical', description: 'Hindi: डॉक्टर पेज' },
  { input: 'డాక్టర్ పేజీ', lang: 'te', expectedRoute: '/medical', description: 'Telugu: డాక్టర్ పేజీ' },
  { input: 'மருத்துவர் பக்கம்', lang: 'ta', expectedRoute: '/medical', description: 'Tamil: மருத்துவர் பக்கம்' },

  // 3. Animal Health & Disease Detection
  { input: 'Check disease', lang: 'en', expectedRoute: '/medical', description: 'English: Check disease' },
  { input: 'Open Health', lang: 'en', expectedRoute: '/medical', description: 'English: Open Health' },
  { input: 'animal health', lang: 'en', expectedRoute: '/medical', description: 'English: animal health' },
  { input: 'disease scan', lang: 'en', expectedRoute: '/medical', description: 'English: disease scan' },
  { input: 'ರೋಗ ಪರೀಕ್ಷೆ', lang: 'kn', expectedRoute: '/medical', description: 'Kannada: ರೋಗ ಪರೀಕ್ಷೆ' },
  { input: 'रोग की जांच', lang: 'hi', expectedRoute: '/medical', description: 'Hindi: रोग की जांच' },
  { input: 'बीमारी चेक करो', lang: 'hi', expectedRoute: '/medical', description: 'Hindi: बीमारी चेक करो' },
  { input: 'వ్యాధి తనిఖీ', lang: 'te', expectedRoute: '/medical', description: 'Telugu: వ్యాధి తనిఖీ' },
  { input: 'நோய் பரிசோதனை', lang: 'ta', expectedRoute: '/medical', description: 'Tamil: நோய் பரிசோதனை' },

  // 4. GPS & Livestock tracking
  { input: 'Show my livestock.', lang: 'en', expectedRoute: '/gps-tracking', description: 'English: Show my livestock.' },
  { input: 'Track my animal', lang: 'en', expectedRoute: '/gps-tracking', description: 'English: Track my animal' },
  { input: 'gps tracking', lang: 'en', expectedRoute: '/gps-tracking', description: 'English: gps tracking' },
  { input: 'ಪ್ರಾಣಿ ಟ್ರ್ಯಾಕ್', lang: 'kn', expectedRoute: '/gps-tracking', description: 'Kannada: ಪ್ರಾಣಿ ಟ್ರ್ಯಾಕ್' },
  { input: 'ಜಿಪಿಎಸ್', lang: 'kn', expectedRoute: '/gps-tracking', description: 'Kannada: ಜಿಪಿಎಸ್' },
  { input: 'जानवर ट्रैक करो', lang: 'hi', expectedRoute: '/gps-tracking', description: 'Hindi: जानवर ट्रैक करो' },
  { input: 'पशु ट्रैकिंग', lang: 'hi', expectedRoute: '/gps-tracking', description: 'Hindi: पशु ट्रैकिंग' },
  { input: 'నా జంతువును ట్రాక్ చేయండి', lang: 'te', expectedRoute: '/gps-tracking', description: 'Telugu: నా జంతువును ట్రాక్ చేయండి' },
  { input: 'விலங்கு கண்காணிப்பு', lang: 'ta', expectedRoute: '/gps-tracking', description: 'Tamil: விலங்கு கண்காணிப்பு' },

  // 5. Tasks / Todo management
  { input: 'Open my tasks', lang: 'en', expectedRoute: '/todo-list', description: 'English: Open my tasks' },
  { input: 'todo list', lang: 'en', expectedRoute: '/todo-list', description: 'English: todo list' },
  { input: 'farm tasks', lang: 'en', expectedRoute: '/todo-list', description: 'English: farm tasks' },
  { input: 'ನನ್ನ ಕಾರ್ಯಗಳು', lang: 'kn', expectedRoute: '/todo-list', description: 'Kannada: ನನ್ನ ಕಾರ್ಯಗಳು' },
  { input: 'ಕೆಲಸಗಳು', lang: 'kn', expectedRoute: '/todo-list', description: 'Kannada: ಕೆಲಸಗಳು' },
  { input: 'मेरे काम', lang: 'hi', expectedRoute: '/todo-list', description: 'Hindi: मेरे काम' },
  { input: 'कार्य सूची', lang: 'hi', expectedRoute: '/todo-list', description: 'Hindi: कार्य सूची' },
  { input: 'నా పనులు', lang: 'te', expectedRoute: '/todo-list', description: 'Telugu: నా పనులు' },
  { input: 'என் பணிகள்', lang: 'ta', expectedRoute: '/todo-list', description: 'Tamil: என் பணிகள்' },

  // 6. Profile
  { input: 'Open my profile', lang: 'en', expectedRoute: '/profile', description: 'English: Open my profile' },
  { input: 'ನನ್ನ ಪ್ರೊಫೈಲ್', lang: 'kn', expectedRoute: '/profile', description: 'Kannada: ನನ್ನ ಪ್ರೊಫೈಲ್' },
  { input: 'मेरी प्रोफाइल', lang: 'hi', expectedRoute: '/profile', description: 'Hindi: मेरी प्रोफाइल' },
  { input: 'నా ప్రొఫైల్', lang: 'te', expectedRoute: '/profile', description: 'Telugu: నా ప్రొఫైల్' },

  // 7. Navigation controls: Home, Back, Help
  { input: 'Open Dashboard.', lang: 'en', expectedRoute: '/', description: 'English: Open Dashboard.' },
  { input: 'Go to Hygiene.', lang: 'en', expectedRoute: '/hygiene-test', description: 'English: Go to Hygiene.' },
  { input: 'Go back.', lang: 'en', expectedRoute: '__back__', description: 'English: Go back.' },
  { input: 'Go home', lang: 'en', expectedRoute: '/', description: 'English: Go home' },
  { input: 'home page', lang: 'en', expectedRoute: '/', description: 'English: home page' },
  { input: 'ಮನೆಗೆ ಹೋಗಿ', lang: 'kn', expectedRoute: '/', description: 'Kannada: ಮನೆಗೆ ಹೋಗಿ' },
  { input: 'होम पेज', lang: 'hi', expectedRoute: '/', description: 'Hindi: होम पेज' },
  { input: 'Go back', lang: 'en', expectedRoute: '__back__', description: 'English: Go back' },
  { input: 'previous page', lang: 'en', expectedRoute: '__back__', description: 'English: previous page' },
  { input: 'ಹಿಂದೆ ಹೋಗಿ', lang: 'kn', expectedRoute: '__back__', description: '__back__ in Kannada' },
  { input: 'वापस जाओ', lang: 'hi', expectedRoute: '__back__', description: '__back__ in Hindi' },
  { input: 'Help', lang: 'en', expectedRoute: '__help__', description: 'English: Help' },
  { input: 'commands list', lang: 'en', expectedRoute: '__help__', description: 'English: commands list' },
  { input: 'ಸಹಾಯ', lang: 'kn', expectedRoute: '__help__', description: 'Kannada: ಸಹಾಯ' },
  { input: 'मदद', lang: 'hi', expectedRoute: '__help__', description: 'Hindi: मदद' },

  // 8. Other Indian Languages (ml, mr, bn, gu, pa, or)
  { input: 'മാർക്കറ്റ്പ്ലേസ് തുറക്കുക', lang: 'ml', expectedRoute: '/marketplace', description: 'Malayalam: മാർക്കറ്റ്പ്ലേസ് തുറക്കുക' },
  { input: 'ഡോക്ടറെ കാണുക', lang: 'ml', expectedRoute: '/medical', description: 'Malayalam: ഡോക്ടറെ കാണുക' },
  { input: 'രോഗം പരിശോധിക്കുക', lang: 'ml', expectedRoute: '/medical', description: 'Malayalam: രോഗം പരിശോധിക്കുക' },
  { input: 'मार्केटप्लेस उघडा', lang: 'mr', expectedRoute: '/marketplace', description: 'Marathi: मार्केटप्लेस उघडा' },
  { input: 'दवाखाना', lang: 'mr', expectedRoute: '/medical', description: 'Marathi: दवाखाना' },
  { input: 'प्राणी शोधा', lang: 'mr', expectedRoute: '/gps-tracking', description: 'Marathi: प्राणी शोधा' },
  { input: 'মার্কেটপ্লেস খুলুন', lang: 'bn', expectedRoute: '/marketplace', description: 'Bengali: মার্কেটপ্লেস খুলুন' },
  { input: 'পশু চিকিৎসক', lang: 'bn', expectedRoute: '/medical', description: 'Bengali: পশু চিকিৎসক' },
  { input: 'মুরগির রোগ', lang: 'bn', expectedRoute: '/medical', description: 'Bengali: মুরগির রোগ' },
  { input: 'માર્કેટપ્લેસ ખોલો', lang: 'gu', expectedRoute: '/marketplace', description: 'Gujarati: માર્કેટપ્લેસ ખોલો' },
  { input: 'પશુ ચિકિત્સક', lang: 'gu', expectedRoute: '/medical', description: 'Gujarati: પશુ ચિકિત્સક' },
  { input: 'ਮਾਰਕੀਟਪਲੇਸ ਖੋਲ੍ਹੋ', lang: 'pa', expectedRoute: '/marketplace', description: 'Punjabi: ਮਾਰਕੀਟਪਲੇਸ ਖੋਲ੍ਹੋ' },
  { input: 'ਪਸ਼ੂ ਡਾਕਟਰ', lang: 'pa', expectedRoute: '/medical', description: 'Punjabi: ਪਸ਼ੂ ਡਾਕਟਰ' },
  { input: 'ମାର୍କେଟପ୍ଲେସ ଖୋଲ', lang: 'or', expectedRoute: '/marketplace', description: 'Odia: ମାର୍କେଟପ୍ଲେସ ଖୋଲ' },
  { input: 'ପଶୁ ଡାକ୍ତର', lang: 'or', expectedRoute: '/medical', description: 'Odia: ପଶୁ ଡାକ୍ତର' },

  // 9. Normalization & noise tolerance tests
  { input: '  Open Marketplace!!!  ', lang: 'en', expectedRoute: '/marketplace', description: 'Punctuation and whitespace stripping' },
  { input: 'Could you please open marketplace now?', lang: 'en', expectedRoute: '/marketplace', description: 'Polite natural conversation wrapping' },
  { input: 'कृप्या मार्केटप्लेस खोलें।', lang: 'hi', expectedRoute: '/marketplace', description: 'Hindi with danda and polite prefix' },

  // 10. Negative & Unrecognized commands (Must NOT match random pages!)
  { input: 'What is the weather on Mars today?', lang: 'en', expectedRoute: null, description: 'Negative: Random question' },
  { input: 'play my favorite song', lang: 'en', expectedRoute: null, description: 'Negative: Media command' },
  { input: 'asdfqwerty12345', lang: 'en', expectedRoute: null, description: 'Negative: Gibberish' },
  { input: 'the', lang: 'en', expectedRoute: null, description: 'Negative: Stopword "the"' },
  { input: 'is', lang: 'en', expectedRoute: null, description: 'Negative: Stopword "is"' },
  { input: 'to', lang: 'en', expectedRoute: null, description: 'Negative: Stopword "to"' },
];

console.log('--- STARTING AGROARMOUR MULTILINGUAL VOICE REGISTRY TESTS ---');
let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = matchVoiceCommand(tc.input, tc.lang);
  const matchedRoute = result ? result.route : null;

  if (matchedRoute === tc.expectedRoute) {
    passed++;
    console.log(`[PASS] ${tc.description} -> ${matchedRoute}`);
  } else {
    failed++;
    console.error(`[FAIL] ${tc.description}`);
    console.error(`   Input: "${tc.input}" (Lang: ${tc.lang})`);
    console.error(`   Expected: ${tc.expectedRoute}`);
    console.error(`   Actual:   ${matchedRoute} (Matched: ${result?.matchedAlias})`);
  }
}

console.log('------------------------------------------------------------');
console.log(`Summary: ${passed} passed, ${failed} failed, total ${testCases.length}`);

if (failed > 0) {
  process.exit(1);
}
