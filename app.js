// Import dependensi
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');

// Inisialisasi aplikasi Express
const app = express();

// Konfigurasi session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs")

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set("views"[
  path.join(__dirname, "/views")
])

// Konfigurasi database MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test_db',
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL database');
});

// Middleware untuk memeriksa role pengguna
function checkRole(role) {
  return (req, res, next) => {
    if (req.session && req.session.role === role) {
      next();
    } else {
      res.status(401).send('Unauthorized');
    }
  };
}

app.post('/login', (req, res) => {
  const { username, password, role } = req.body;
  if (username && password && role) {
    // Query ke database untuk memeriksa data pengguna
    db.query(
      `SELECT * FROM users WHERE username = ? AND password = ? AND role = ?`,
      [username, password, role],
      (err, results) => {
        if (err) {
          throw err;
        }
        if (results.length > 0) {
          const { role } = results[0];
          // Set session dengan role pengguna
          req.session.role = role;

                  // Set data pengguna ke sesi
          req.session.loginData = {
            username: results[0].username,
            role:results[0].role
          };

          // res.status(200).send('Login successful');
          res.redirect('/dashboard');
          
        } else {
          res.status(401).send('Invalid username, password, or role');
        }
      }
    );
  } else {
    res.status(400).send('Please enter username, password, and role');
  }
});


// Route untuk logout
app.get('/logout', (req, res) => {
  // Hapus session
  req.session.destroy();
  res.status(200).send('Logged out successfully');
});

// Route untuk logout
app.get('/loginview', (req, res) => {
  // Hapus session
  res.render('login');
});

// Route yang hanya dapat diakses oleh role "user"
app.get('/user', checkRole('user'), (req, res) => {
  res.status(200).send('User access granted');
});

// Route yang hanya dapat diakses oleh role "admin"
app.get('/admin', checkRole('admin'), (req, res) => {
  res.status(200).send('Admin access granted');
});

// Middleware proteksi
const protect = (req, res, next) => {
  if (req.session.loginData) {
    // Pengguna sudah login, lanjutkan ke halaman yang diminta
    next();
  } else {
    // Pengguna belum login, redirect ke halaman login
    res.redirect('/loginview');
  }
};

// Route yang hanya dapat diakses oleh role "admin"
app.get('/dashboard', protect, (req, res) => {

  const { username, role } = req.session.loginData;
  res.render('dashboard',
  {
    username,
    role 
  })
});




// Jalankan server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});