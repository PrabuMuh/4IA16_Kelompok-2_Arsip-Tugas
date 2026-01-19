import { useState, useEffect } from "react";
import "./Style.css";

export default function ArsipTugas() {
  const [mataKuliah, setMataKuliah] = useState("");
  const [semester, setSemester] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // state filter & data
  const [filterMK, setFilterMK] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [arsip, setArsip] = useState([]);

  // ===== UPLOAD =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mataKuliah || !semester || !file) {
      alert("Semua field wajib diisi!");
      return;
    }

    const formData = new FormData();
    formData.append("mata_kuliah", mataKuliah);
    formData.append("semester", semester);
    formData.append("file", file);

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert("Upload berhasil");
      setMataKuliah("");
      setSemester("");
      setFile(null);
      e.target.reset();

      fetchArsip(); // refresh list
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== FETCH + FILTER =====
  const fetchArsip = async () => {
    const params = new URLSearchParams();
    if (filterMK) params.append("mata_kuliah", filterMK);
    if (filterSemester) params.append("semester", filterSemester);

    const res = await fetch(`http://localhost:5000/files?${params.toString()}`);
    const data = await res.json();
    setArsip(data);
  };

  // load awal
  useEffect(() => {
    fetchArsip();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Sistem Arsip Tugas Mahasiswa
        </h1>

        {/* ===== FORM UPLOAD ===== */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            value={mataKuliah}
            onChange={(e) => setMataKuliah(e.target.value)}
            placeholder="Nama Mata Kuliah"
            className="w-full rounded-lg border px-4 py-2"
          />

          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full rounded-lg border px-4 py-2"
          >
            <option value="">Pilih Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            {loading ? "Mengupload..." : "Upload Tugas"}
          </button>
        </form>

        {/* ===== FILTER ===== */}
        <div className="mt-8">
          <h2 className="font-semibold mb-3">Filter Arsip</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={filterMK}
              onChange={(e) => setFilterMK(e.target.value)}
              placeholder="Cari mata kuliah"
              className="flex-1 border rounded px-3 py-2"
            />
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Semester</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={fetchArsip}
              className="bg-blue-600 text-white px-4 rounded"
            >
              Cari
            </button>
          </div>
        </div>

        {/* ===== LIST DATA ===== */}
        <div className="mt-6 space-y-3">
          {arsip.length === 0 && (
            <p className="text-gray-500 text-sm">Data tidak ditemukan</p>
          )}

          {arsip.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-3 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{item.mata_kuliah}</p>
                <p className="text-sm text-gray-500">
                  Semester {item.semester}
                </p>
              </div>
              <a
                href={`http://localhost:5000/download/${item.id}`}
                className="text-blue-600 font-medium"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
