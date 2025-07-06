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
