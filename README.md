# Sirekap Damar Global Network - Aplikasi Keuangan

Aplikasi web untuk mencatat transaksi kas, mengelola iuran pelanggan, dan membuat faktur. Dirancang untuk dijalankan secara lokal di komputer atau di server pribadi.

## Cara Menjalankan Aplikasi

Pilih salah satu metode di bawah ini yang paling sesuai dengan kebutuhan Anda.

---

### Metode 1: Menjalankan dengan Node.js (Windows & macOS - Untuk Development)

Metode ini cocok untuk penggunaan di komputer pribadi untuk tujuan pengembangan.

#### Prasyarat

Anda perlu menginstal **Node.js**.
1.  Kunjungi [situs web resmi Node.js](https://nodejs.org/).
2.  Unduh versi **LTS** (Recommended For Most Users).
3.  Jalankan installer dan ikuti petunjuk di layar.

#### Langkah-langkah Menjalankan

1.  **Buka Terminal atau Command Prompt**.
    *   **Windows:** Tekan `Win + R`, ketik `cmd`, lalu tekan Enter.
    *   **macOS:** Buka `Launchpad`, cari "Terminal", lalu klik untuk membukanya.

2.  **Navigasi ke Folder Aplikasi** menggunakan perintah `cd`.
    ```bash
    # Contoh:
    cd path/ke/folder/sirekap-dgn
    ```

3.  **Instal Dependensi Server** (hanya perlu dilakukan sekali).
    ```bash
    npm install
    ```

4.  **Jalankan Server**.
    ```bash
    npm start
    ```
    Terminal akan menampilkan pesan bahwa server berjalan di `http://localhost:3000`.

5.  **Buka Aplikasi di Browser** dengan mengunjungi alamat **http://localhost:3000**.

Untuk menghentikan server, kembali ke terminal dan tekan `Ctrl + C`.

---

### Metode 2: Menjalankan dengan Docker (Rekomendasi Lintas Platform)

Metode ini menggunakan containerisasi Nginx untuk menjalankan aplikasi dalam lingkungan yang terisolasi dan berperforma tinggi.

#### Prasyarat

- [Docker Engine](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/) (Opsional, tapi direkomendasikan)

#### Opsi 1: Menjalankan dengan Docker Compose (Paling Mudah)

1.  **Buka Terminal** dan navigasi ke folder aplikasi.

2.  **Bangun dan Jalankan Container** dengan satu perintah.
    ```bash
    docker-compose up --build -d
    ```
    - `--build`: Membangun image Docker dari Dockerfile.
    - `-d`: Menjalankan container di latar belakang (detached mode).

3.  **Buka Aplikasi di Browser** dengan mengunjungi alamat **http://localhost:3000**.

**Perintah Berguna (Docker Compose):**
- **Melihat log aplikasi:** `docker-compose logs -f`
- **Menghentikan aplikasi:** `docker-compose down`

#### Opsi 2: Menjalankan dengan Docker CLI (Tanpa Compose)

Jika Anda tidak memiliki Docker Compose, Anda dapat membangun dan menjalankan container menggunakan perintah Docker biasa.

1.  **Bangun Image Docker:**
    Pastikan Anda berada di direktori root aplikasi (yang berisi `Dockerfile`), lalu jalankan:
    ```bash
    docker build -t sirekap-dgn .
    ```
    - `-t sirekap-dgn`: Memberi nama (tag) pada image Anda agar mudah dikenali.

2.  **Jalankan Container dari Image:**
    Setelah image berhasil dibuat, jalankan container:
    ```bash
    docker run -d -p 3000:80 --name sirekap-container --restart unless-stopped sirekap-dgn
    ```
    - `-d`: Menjalankan di latar belakang.
    - `-p 3000:80`: Memetakan port 3000 di komputer Anda ke port 80 (Nginx) di dalam container.
    - `--name sirekap-container`: Memberi nama pada container.
    - `--restart unless-stopped`: Agar container otomatis berjalan kembali jika server restart.

3.  **Akses Aplikasi:** Buka browser dan kunjungi **http://localhost:3000**.

**Perintah Berguna (Docker CLI):**
- **Melihat log:** `docker logs -f sirekap-container`
- **Menghentikan:** `docker stop sirekap-container`
- **Menghapus container (setelah dihentikan):** `docker rm sirekap-container`

---

### Metode 3: Instalasi di Server Debian/Ubuntu (Untuk Produksi)

Panduan ini untuk menginstal aplikasi secara permanen di server Linux (Debian atau Ubuntu) dan menyajikannya menggunakan Nginx, sebuah web server standar industri.

#### Prasyarat
- Server Debian/Ubuntu.
- Akses ke terminal dengan hak `sudo`.

#### Langkah 1: Persiapan Server

1.  Update daftar paket dan upgrade sistem Anda.
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
2.  Instal `git` (untuk mengambil kode sumber) dan `nginx`.
    ```bash
    sudo apt install -y git nginx
    ```

#### Langkah 2: Unduh dan Tempatkan File Aplikasi

1.  Salin file aplikasi ke direktori web Nginx. Cara paling umum adalah menggunakan `git`.
    ```bash
    # Buat direktori jika belum ada
    sudo mkdir -p /var/www/sirekap-dgn
    
    # Salin file dari direktori lokal Anda ke server, atau gunakan git clone
    # Contoh dengan git:
    sudo git clone <URL_GIT_REPO> /var/www/sirekap-dgn
    
    # Atur kepemilikan agar Nginx bisa membacanya
    sudo chown -R www-data:www-data /var/www/sirekap-dgn
    ```
    Jika Anda tidak menggunakan git, cukup salin semua file aplikasi ke direktori `/var/www/sirekap-dgn` di server.

#### Langkah 3: Konfigurasi Nginx

1.  Buat file konfigurasi server block baru untuk aplikasi Anda.
    ```bash
    sudo nano /etc/nginx/sites-available/sirekap-dgn
    ```
2.  Salin dan tempel konfigurasi berikut ke dalam file tersebut. Ganti `domain_anda.com` dengan nama domain atau alamat IP server Anda.
    ```nginx
    server {
        listen 80;
        server_name domain_anda.com www.domain_anda.com;

        root /var/www/sirekap-dgn;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
    ```
    Simpan file dan keluar dari editor (tekan `Ctrl + X`, lalu `Y`, lalu `Enter`).

3.  **Aktifkan Konfigurasi** dengan membuat tautan simbolis.
    ```bash
    sudo ln -s /etc/nginx/sites-available/sirekap-dgn /etc/nginx/sites-enabled/
    ```

4.  **Uji Konfigurasi Nginx** untuk memastikan tidak ada kesalahan.
    ```bash
    sudo nginx -t
    ```
    Jika outputnya `syntax is ok` dan `test is successful`, lanjutkan ke langkah berikutnya.

5.  **Mulai Ulang Nginx** untuk menerapkan perubahan.
    ```bash
    sudo systemctl restart nginx
    ```

#### Langkah 4: Konfigurasi Firewall (Wajib)

Izinkan lalu lintas HTTP melalui firewall.
```bash
sudo ufw allow 'Nginx HTTP'
sudo ufw enable
```

**Selesai!** Aplikasi Anda sekarang berjalan dan dapat diakses melalui `http://<IP_SERVER_ANDA>` atau nama domain yang Anda konfigurasikan.

---

### Metode 4: Deployment di Web Server Standar (Apache / PHP Hosting)

Metode ini adalah cara termudah untuk hosting di lingkungan web hosting umum (seperti shared hosting) yang menggunakan server Apache.

#### Prasyarat
-   Akses ke panel kontrol hosting Anda (misalnya cPanel) atau FTP untuk mengunggah file.

#### Langkah-langkah Deployment

1.  **Unggah Semua File Aplikasi**
    -   Salin *semua* file dan folder dari proyek ini ke direktori root web Anda di server. Direktori ini biasanya bernama `public_html` atau `www`.
    -   Pastikan Anda juga menyalin file `.htaccess` yang tersembunyi. File ini sangat penting agar aplikasi berfungsi dengan benar.

2.  **Selesai!**
    -   Setelah semua file diunggah, buka nama domain Anda di browser. Aplikasi seharusnya sudah berjalan.
    -   File `.htaccess` yang disertakan akan secara otomatis menangani routing sisi klien (client-side routing) yang diperlukan oleh aplikasi React, sehingga halaman akan dimuat dengan benar bahkan setelah di-refresh.

---

### Metode 5: Menjalankan dengan PM2 (Manajemen Proses di Produksi)

`PM2` adalah manajer proses tingkat produksi untuk aplikasi Node.js. Ini membantu menjaga aplikasi tetap hidup selamanya, me-restarting-nya tanpa downtime, dan memfasilitasi tugas-tugas DevOps umum.

#### Prasyarat
- Node.js sudah terinstal.
- Aplikasi sudah diunduh/di-clone ke server Anda.

#### Langkah-langkah Menjalankan

1.  **Instal PM2 Secara Global**
    Buka terminal di server Anda dan jalankan perintah berikut:
    ```bash
    npm install pm2 -g
    ```

2.  **Navigasi ke Folder Aplikasi**
    ```bash
    cd path/ke/folder/sirekap-dgn
    ```

3.  **Instal Dependensi Aplikasi**
    ```bash
    npm install
    ```

4.  **Mulai Aplikasi dengan PM2**
    Gunakan file konfigurasi `ecosystem.config.js` yang sudah disediakan:
    ```bash
    pm2 start ecosystem.config.js --env production
    ```
    - `--env production`: Menjalankan aplikasi dalam mode produksi.

5.  **Simpan Konfigurasi PM2**
    Agar PM2 secara otomatis me-restart aplikasi Anda setelah server reboot, jalankan:
    ```bash
    pm2 save
    ```
    Ikuti petunjuk di terminal untuk menyelesaikan setup startup.

Aplikasi Anda sekarang berjalan di latar belakang, dikelola oleh PM2.

**Perintah Berguna (PM2):**
- **Melihat daftar semua proses:** `pm2 list`
- **Melihat log aplikasi secara real-time:** `pm2 logs sirekap-dgn`
- **Menghentikan aplikasi:** `pm2 stop sirekap-dgn`
- **Me-restart aplikasi:** `pm2 restart sirekap-dgn`
- **Menghapus aplikasi dari daftar PM2:** `pm2 delete sirekap-dgn`
