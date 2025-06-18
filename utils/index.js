export const gradients = {
  indigo: ['#dcd6ff', '#b8adff', '#9285ff', '#7766ff', '#4833ff', '#3525db', '#261ab1', '#1a1093', '#10097a',],
  green: ['#dcfdc3', '#affc9d', '#7cf86c', '#4bf246', '#0cea1c', '#0dc928', '#0ca82f', '#038731', '#047031',],
  blue: ['#ccfffa', '#9afefe', '#66f1fc', '#41dffa', '#07c2f7', '#0497d4', '#0171b1', '#02518e', '#003a76',],
  yellow: ['#fff8db', '#fff0b8', '#ffe495', '#ffd97b', '#ffc84f', '#dba339', '#b78127', '#936118', '#7a4b10',],
  pink: ['#ffd8f2', '#ffb1ea', '#ff8aea', '#ff6df1', '#ff3dfe', '#cd2ddb', '#9d1fb7', '#731493', '#540b7a',],
}

export const baseRating = {
  "0": 2, "1": 5, "2": 4, "3": 1, "4": 3,
  "5": 2, "6": 4, "7": 1, "8": 5, "9": 3,
  "10": 2, "11": 4, "12": 1, "13": 3, "14": 5,
  "15": 2, "16": 4, "17": 1, "18": 3, "19": 5,
  "20": 2, "21": 4, "22": 1, "23": 3, "24": 5,
  "25": 3, "26": 4, "27": 2, "28": 1, "29": 2,
  "30": 4, "31": 1, "32": 3, "33": 5, "34": 2,
  "35": 4, "36": 1, "37": 5, "38": 3, "39": 2,
  "40": 5, "41": 4, "42": 1, "43": 3,
}

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

export default function convertMood(moodIndex) {
  moodIndex = Math.floor(moodIndex);
  console.log("Converting mood index:", moodIndex);

  switch (moodIndex) {
    case 0:
      return 'Awful';
    case 1:
      return 'Sad';
    case 2:
      return 'Existing';
    case 3:
      return 'Good';
    case 4:
      return 'Elated';
    default:
      if (moodIndex < 0) {
        return 'Awful';
      } else if (moodIndex > 4) {
        return 'Elated';
      } else {
        return 'Existing'; // Fallback for unexpected values
      }
  }
}
