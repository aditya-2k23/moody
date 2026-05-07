const fs = require('fs');

let content = fs.readFileSync('app/api/chat/route.js', 'utf-8');

// The main conflict is usually around the imports or utility functions. Let's fix it by regex or direct replacement.
// Looking at the conflict markers:
content = content.replace(/<<<<<<< HEAD[\s\S]*?=======\n/g, '');
content = content.replace(/>>>>>>> origin\/refactor\/design\n/g, '');

fs.writeFileSync('app/api/chat/route.js', content);
