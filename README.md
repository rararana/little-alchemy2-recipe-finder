<h1 align="center"> Tugas Besar 2 IF2211 Strategi Algoritma </h1>
<h1 align="center">  Pemanfaatan Algoritma BFS dan DFS dalam Permainan Elemen Little Alchemy 2 </h1>

## Deskripsi Program
Program ini merupakan program sederhana berbasis web yang memiliki fitur utama pencarian resep suatu elemen pada Little Alchemy 2. Pada program ini, kami menggunakan algoritma Breadth-First Search (BFS) dan Depth-First Search (DFS). Bahasa pemrograman yang digunakan adalah Go untuk pengembangan backend dan Typescript dengan framework next.js dan tailwindcss untuk pengembangan frontend.

## Penjelasan Algoritma
#### 1. Algoritma BFS
Pada algoritma BFS, semua elemen yang dapat membentuk suatu elemen akan ditelusuri terlebih dahulu. Untuk setiap resep dari suatu elemen, akan dibangkitkan dua elemen pencarian. Dengan menggunakan struktur data queue, hasil pembangkitan elemen akan ditambahkan pada queue. Kemudian dari queue akan diambil elemen terdepan untuk diproses hingga queue tidak memiliki elemen yang dapat diproses. Ketika queue kosong, semua jalur valid menuju target telah ditemukan.
#### 2. Algoritma BFS
Pada algoritma DFS, satu resep dari elemen akan ditelusuri hingga mencapai elemen dasar. Penelusuran suatu simpul elemen akan berlanjut ke resep selanjutnya jika semua jalur valid telah ditemukan untuk resep sebelumnya. Karena resep terdiri dari dua elemen, setiap resep harus menemukan semua path valid ke kedua elemen dalam resep tertentu. Ini adalah salah satu aspek yang dapat diparalelisasi. 

## Requirement
<div>
    <table align="center">
      <tr>
        <td>No</td>
        <td>Requirement</td>
      </tr>
      <tr>
        <td>1</td>
        <td>Go 1.24</td>
      </tr>
      <tr>
        <td>2</td>
        <td>Node.js (18.x atau lebih baru)</td>
      </tr>
      <tr>
        <td>3</td>
        <td>npm</td>
      </tr>
      <tr>
        <td>4</td>
        <td>Docker Desktop	</td>
      </tr>
    </table>
</div>

## Cara Mengkompilasi dan Menjalankan Program
##### Tanpa Docker
1. Clone repository
   ```
      git clone https://github.com/naylzhra/Tubes2_FullRustAlchemist.git
   ```
2. Instalasi dependencies
    ```
       cd src/frontend
       npm install
       cd ../backend
       go mod download
   ```
3. Built frontend, pastikan sebelumnya sudah instalasi dependensinya.
   ```
      cd src/frontend
      npm run dev
   ```
4. Run backend pada terminal berbeda, pastikan sebelumnya sudah instalasi dependensinya.
   ```
      cd src/backend
      go run .
   ```
5. Kemudian, buka localhost:3000 pada browser
   ```
      http://localhost:3000/
   ```
6. Pilih mode pencarian resep yang diinginkan (single recipe/ multiple recipe)
7. Masukkan input sesuai kebutuhan pencarian kemudian klik tombol search

##### Menggunakan Docker
1. Clone repository
   ```
    git clone https://github.com/naylzhra/Tubes2_FullRustAlchemist.git
   ```
2. Buka dan jalankan aplikasi docker desktop
3. Build dan jalankan docker
   ```
     docker compose up --build
   ```
5. Kemudian, buka localhost:3000 pada browse
   ```
     http://localhost:3000/
   ```
6. Pilih mode pencarian resep yang diinginkan (single recipe/ multiple recipe)
7. Masukkan input sesuai kebutuhan pencarian kemudian klik tombol search

## Identitas Pembuat
<div>
    <table align="center">
      <tr>
        <td>NIM</td>
        <td>Nama</td>
      </tr>
      <tr>
        <td>13523007</td>
        <td>Ranashahira Reztaputri</td>
      </tr>
      <tr>
        <td>13523063</td>
        <td>Syahrizal Bani Khairan</td>
      </tr>
      <tr>
        <td>13523079</td>
        <td>Nayla Zahira</td>
      </tr>
    </table>
</div>
