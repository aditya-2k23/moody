const fs = require('fs');

const files = [
  'components/Dashboard.js',
  'components/Journal.js',
  'components/chat/ChatContainer.js'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/<<<<<<< HEAD[\s\S]*?=======\n/g, '');
  content = content.replace(/>>>>>>> origin\/refactor\/design\n/g, '');
  fs.writeFileSync(file, content);
}
