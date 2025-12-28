export const gradients = {
  indigo: ['#e6e3ff', '#d1caff', '#b8adff', '#9285ff', '#7766ff', '#5e4aff', '#4833ff', '#3525db', '#261ab1', '#1a1093', '#10097a', '#090364', '#05004f'],
  green: ['#edffd9', '#dcfdc3', '#c2fca8', '#affc9d', '#92f37e', '#7cf86c', '#5ff44e', '#4bf246', '#2cf02e', '#0cea1c', '#0dc928', '#0ca82f', '#038731'],
  blue: ['#e2fffd', '#ccfffa', '#affffc', '#9afefe', '#83f7fa', '#66f1fc', '#41dffa', '#07c2f7', '#0497d4', '#0171b1', '#02518e', '#003a76', '#00285e'],
  yellow: ['#fffbe8', '#fff8db', '#fff3c6', '#fff0b8', '#ffeaa7', '#ffe495', '#ffd97b', '#ffc84f', '#dba339', '#b78127', '#936118', '#7a4b10', '#5f3908'],
  pink: ['#ffe6f6', '#ffd8f2', '#ffc1f0', '#ffb1ea', '#ff99ec', '#ff8aea', '#ff6df1', '#ff3dfe', '#cd2ddb', '#9d1fb7', '#731493', '#540b7a', '#3d0561']
};

export const baseRating = {
  "0": 3, "1": 9, "2": 6, "3": 1, "4": 4,
  "5": 2, "6": 7, "7": 0, "8": 10, "9": 5,
  "10": 3, "11": 8, "12": 1, "13": 6, "14": 11,
  "15": 2, "16": 7, "17": 0, "18": 4, "19": 10,
  "20": 3, "21": 8, "22": 1, "23": 5, "24": 12,
  "25": 4, "26": 7, "27": 2, "28": 1, "29": 3,
  "30": 8, "31": 0, "32": 6, "33": 11, "34": 2,
  "35": 9, "36": 1, "37": 12, "38": 5, "39": 3,
  "40": 10, "41": 7, "42": 0, "43": 6
};

export const demoData = {
  "15": 2, "16": 4, "17": 1, "18": 3, "19": 5,
  "20": 2, "21": 4, "22": 1, "23": 3, "24": 5,
}

export const moods = {
  'Awful': '😭',
  'Sad': '🥺',
  'Existing': '😐',
  'Good': '😊',
  'Elated': '😃',

  "Grateful": '🙏',
  "Excited": '🤩',
  "Neutral": '😶',
  "Anxious": '😰',
  "Unsure": '😟',
  "Tired": '😴',
  "Stressed": '😩',
  "Angry": '😡',
}

export const months = {
  "January": "Jan",
  "February": "Feb",
  "March": "Mar",
  "April": "Apr",
  "May": "May",
  "June": "Jun",
  "July": "Jul",
  "August": "Aug",
  "September": "Sep",
  "October": "Oct",
  "November": "Nov",
  "December": "Dec"
};

export const dayList = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function convertMood(moodValue) {
  if (typeof moodValue === 'number') {
    const moodKeys = Object.keys(moods);
    const idx = Math.max(0, Math.min(moodKeys.length - 1, moodValue - 1));
    return moodKeys[idx];
  }
  if (typeof moodValue === 'string' && moods[moodValue]) {
    return moodValue;
  }
  return 'Neutral';
}

export const quotes = [
  {
    text: "Your mood is like the weather – it changes, but the sun always comes back to shine again.",
    author: "Unknown"
  },
  {
    text: "Every day may not be good, but there's something good in every day.",
    author: "Alice Morse Earle"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Happiness is not something ready made. It comes from your own actions.",
    author: "Dalai Lama"
  },
  {
    text: "Be yourself; everyone else is already taken.",
    author: "Oscar Wilde"
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb"
  },
  {
    text: "Your emotions are the slaves to your thoughts, and you are the slave to your emotions.",
    author: "Elizabeth Gilbert"
  },
  {
    text: "Life is 10% what happens to you and 90% how you react to it.",
    author: "Charles R. Swindoll"
  },
  {
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins"
  },
  {
    text: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein"
  },
  {
    text: "A positive attitude causes a chain reaction of positive thoughts, events and outcomes.",
    author: "Wade Boggs"
  },
  {
    text: "You are never too old to set another goal or to dream a new dream.",
    author: "C.S. Lewis"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt"
  },
  {
    text: "The purpose of our lives is to be happy.",
    author: "Dalai Lama"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    text: "Your time is limited, don't waste it living someone else's life.",
    author: "Steve Jobs"
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney"
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson"
  },
  {
    text: "Keep your face always toward the sunshine—and shadows will fall behind you.",
    author: "Walt Whitman"
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt"
  },
  {
    text: "You must be the change you wish to see in the world.",
    author: "Mahatma Gandhi"
  },
  {
    text: "Spread love everywhere you go. Let no one ever come to you without leaving happier.",
    author: "Mother Teresa"
  },
  {
    text: "The only way to have a friend is to be one.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "Life is really simple, but we insist on making it complicated.",
    author: "Confucius"
  },
  {
    text: "May you live all the days of your life.",
    author: "Jonathan Swift"
  },
  {
    text: "Life itself is the most wonderful fairy tale.",
    author: "Hans Christian Andersen"
  },
  {
    text: "Do not go where the path may lead, go instead where there is no path and leave a trail.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "You will face many defeats in life, but never let yourself be defeated.",
    author: "Maya Angelou"
  },
  {
    text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela"
  },
  {
    text: "Nothing is impossible, the word itself says, 'I'm possible!'",
    author: "Audrey Hepburn"
  },
  {
    text: "The best way to predict the future is to create it.",
    author: "Peter Drucker"
  },
  {
    text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt"
  },
  {
    text: "Act as if what you do makes a difference. It does.",
    author: "William James"
  },
  {
    text: "Happiness can be found even in the darkest of times, if one only remembers to turn on the light.",
    author: "J.K. Rowling"
  },
  {
    text: "You are never too old to set another goal or to dream a new dream.",
    author: "C.S. Lewis"
  },
  {
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius"
  },
  {
    text: "Everything you’ve ever wanted is on the other side of fear.",
    author: "George Addair"
  },
  {
    text: "The only person you are destined to become is the person you decide to be.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "Difficulties in life are intended to make us better, not bitter.",
    author: "Dan Reeves"
  },
  {
    text: "You don’t have to control your thoughts. You just have to stop letting them control you.",
    author: "Dan Millman"
  }
];

// Curated journal placeholders - calm, reflective, and non-repetitive
export const journalPlaceholders = [
  "How did today really feel? 🌿",
  "What's one moment you don't want to forget? ✨",
  "Write freely. No one's judging. 🫶",
  "What made today different? 🌅",
  "Capture a feeling before it fades... 🍃",
  "What would make tomorrow even better? 🌱",
  "Describe today in three words... 💭",
  "What gave you energy today? ☀️",
  "What's been on your mind lately? 🌙",
  "A small win worth celebrating... 🎉",
  "Something that made you smile today... 😊",
  "What are you grateful for right now? 🙏",
  "How are you really doing? 💫",
  "What did you learn about yourself today? 🌸",
  "Pause. Breathe. Reflect. 🧘",
  "What felt heavy today? Let it out... 🌊",
  "One thing you're proud of today... 🌟",
  "What brought you peace today? 🕊️",
  "If today had a color, what would it be? 🎨",
  "What do you need more of in your life? 💝"
];
