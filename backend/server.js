// server.js
import express from "express";
import multer from "multer";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// inisialisasi supabase
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://ymhsgkcpifkuofhlzfxb.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(cors());
app.use(express.json());

// ====== KONFIGURASI DATABASE ======
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "arsip_tugas",
});

db.connect((err) => {
  if (err) {
    console.error("Koneksi database gagal:", err);
  } else {
    console.log("Database terhubung");
  }
});

// ====== KONFIGURASI MULTER ======

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("File harus PDF"));
    }
  },
});

// ====== ENDPOINT UPLOAD ======
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { mata_kuliah, semester } = req.body;
    const file = req.file;

    if (!mata_kuliah || !semester || !file) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    // nama file 
    const filePath = `pdf/${Date.now()}-${file.originalname}`;

    // upload ke Supabase
    const { error } = await supabase.storage
      .from("storage_documents")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    // ambil public URL
    const { data } = supabase.storage
      .from("storage_documents")
      .getPublicUrl(filePath);

    const fileUrl = data.publicUrl;

    // simpan ke MySQL
    const query =
      "INSERT INTO arsip (mata_kuliah, semester, nama_file, path_file) VALUES (?, ?, ?, ?)";

    db.query(
      query,
      [mata_kuliah, semester, file.originalname, fileUrl],
      (err) => {
        if (err) {
          return res.status(500).json({ message: "Gagal simpan ke DB" });
        }

        res.json({
          message: "Upload berhasil",
          url: fileUrl,
        });
      },
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ====== ENDPOINT LIST & FILTER ======
app.get("/files", (req, res) => {
  const { mata_kuliah, semester } = req.query;

  let query = "SELECT * FROM arsip WHERE 1=1";
  const params = [];

  if (mata_kuliah) {
    query += " AND mata_kuliah LIKE ?";
    params.push(`%${mata_kuliah}%`);
  }

  if (semester) {
    query += " AND semester = ?";
    params.push(semester);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Gagal mengambil data" });
    }
    res.json(results);
  });
});

// ====== ENDPOINT DOWNLOAD ======
app.get("/download/:id", (req, res) => {
  db.query(
    "SELECT path_file FROM arsip WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err || result.length === 0) {
        return res.status(404).json({ message: "File tidak ditemukan" });
      }
      res.redirect(result[0].path_file);
    },
  );
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);  
});
