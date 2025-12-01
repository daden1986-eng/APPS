const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Menyajikan file statis dari direktori root tempat server dijalankan
app.use(express.static(path.join(__dirname, '/')));

// Untuk menangani routing sisi klien pada SPA, semua permintaan akan diarahkan ke index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  Sirekap DGN Server Berjalan`);
  console.log(`  Buka di browser: http://localhost:${PORT}`);
  console.log(`===============================================`);
  console.log('Tekan Ctrl + C untuk menghentikan server.');
});