const express = require('express');
// server.js
const express = require('express');
const path = require('path');

const app = express();
const distPath = path.resolve(__dirname, 'dist');

app.use(express.static(distPath));

// Pour toutes les routes, retourner index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});