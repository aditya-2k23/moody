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
  }
];

// Function to get a quote based on the current date
export function getQuoteOfTheDay() {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today - startOfYear;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Use day of year to consistently select the same quote for the entire day
  const quoteIndex = dayOfYear % quotes.length;
  return quotes[quoteIndex];
}
