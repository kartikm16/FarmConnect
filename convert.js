const fs = require('fs');
const path = require('path');

try {
    if (!fs.existsSync('views')) fs.mkdirSync('views');
    if (!fs.existsSync('public')) fs.mkdirSync('public');
    
    if (fs.existsSync('index.html')) fs.renameSync('index.html', 'views/index.ejs');
    if (fs.existsSync('script.js')) fs.renameSync('script.js', 'public/script.js');
    if (fs.existsSync('styles.css')) fs.renameSync('styles.css', 'public/styles.css');
    
    console.log('Files moved successfully');
} catch (error) {
    console.error('Error moving files:', error);
}
