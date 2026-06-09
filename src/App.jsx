import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRight, Search, Check, X, Users, ShieldCheck, Wifi, Monitor, Calendar, CheckCircle, Clock, Mail, MapPin, Phone, User, FileText, LogOut, Lock } from 'lucide-react';

// --- IMPORT ASSETS ---
import logo from './assets/Logo_Binus-1.png';
import backgroundRuangKelas from './assets/Background_Ruang_Kelas.jpeg';
import Ruangkelas301 from './assets/Ruang_Kelas_301.jpg';
import LabKomputerA from './assets/Lab_Komputer_A.jpg';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function App() {
  const [view, setView]               = useState('home');
  const [step, setStep]               = useState(1);
  const [ruangan, setRuangan]         = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookings, setBookings]       = useState([]);
  const [adminFilter, setAdminFilter] = useState('all');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginData, setLoginData]     = useState({ username: '', password: '' });
  const [loginError, setLoginError]   = useState('');
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [bookedSlots, setBookedSlots] = useState([]); // jadwal yang sudah di-approve untuk ruangan terpilih

  // State untuk popup alasan penolakan
  const [rejectTarget, setRejectTarget] = useState(null); // booking yang sedang ditolak
  const [rejectReason, setRejectReason] = useState('');

  const [formData, setFormData] = useState({
    fasilitas_id: '', tanggal: '', waktu_mulai: '', durasi: '1',
    tujuan: '', nama: '', nim: '', email: '', telepon: '',
  });

  // ==========================================
  // DATA FETCHING
  // ==========================================
  useEffect(() => {
    fetchRuangan();
  }, []);

  useEffect(() => {
    if (view === 'admin' && isAdminLoggedIn) fetchBookings();
  }, [view, isAdminLoggedIn]);

  const fetchRuangan = () => {
    axios.get(`${API_BASE}/ruangan`)
      .then(res => setRuangan(res.data))
      .catch(() => setRuangan([
        { id: 1, nama: 'Ruang Kelas 301', kapasitas: 40, gedung: 'A', lantai: 3 },
        { id: 2, nama: 'Lab Komputer A',  kapasitas: 30, gedung: 'B', lantai: 4 },
      ]));
  };

  const fetchBookings = () => {
    axios.get(`${API_BASE}/admin/bookings`)
      .then(res => setBookings(res.data))
      .catch(() => setBookings([]));
  };

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleBooking = () => {
    // Konversi tanggal DD/MM/YYYY -> YYYY-MM-DD agar sesuai format kolom date di Laravel
    const [dd, mm, yyyy] = formData.tanggal.split('/');
    const payload = { ...formData, tanggal: `${yyyy}-${mm}-${dd}` };

    setLoadingBooking(true);
    axios.post(`${API_BASE}/booking`, payload)
      .then(() => {
        alert('Booking berhasil diajukan! Admin akan segera mereview permohonan kamu.');
        setSelectedRoom(null);
        setStep(1);
        setView('home');
        setFormData({ fasilitas_id: '', tanggal: '', waktu_mulai: '', durasi: '1', tujuan: '', nama: '', nim: '', email: '', telepon: '' });
      })
      .catch((err) => {
        if (err.response?.status === 409) {
          // Jadwal bentrok dengan booking yang sudah disetujui
          alert(err.response.data.message || 'Jadwal bentrok! Silakan pilih waktu lain.');
        } else if (err.response?.status === 422) {
          // Validasi gagal (ada field yang belum diisi / format salah)
          alert('Data belum lengkap atau format salah. Periksa kembali isian kamu.');
        } else {
          // Server tidak merespons
          alert('Gagal mengirim booking. Pastikan server backend sedang berjalan.');
        }
      })
      .finally(() => setLoadingBooking(false));
  };

  const handleApprove = (id) => {
    axios.put(`${API_BASE}/admin/bookings/${id}/status`, { status: 'approved' })
      .then(() => fetchBookings())
      .catch(() => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'approved' } : b)));
  };

  // Buka popup alasan penolakan
  const openRejectModal = (booking) => {
    setRejectTarget(booking);
    setRejectReason('');
  };

  // Kirim penolakan beserta alasannya
  const submitReject = () => {
    if (!rejectReason.trim()) {
      alert('Mohon isi alasan penolakan terlebih dahulu.');
      return;
    }
    const id = rejectTarget.id;
    const emailUser = rejectTarget.email;
    axios.put(`${API_BASE}/admin/bookings/${id}/status`, { status: 'rejected', alasan_penolakan: rejectReason })
      .then(() => fetchBookings())
      .catch(() => setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected', alasan_penolakan: rejectReason } : b)))
      .finally(() => {
        // Notifikasi (simulasi pengiriman email ke pemohon)
        alert(`Booking ditolak. Notifikasi beserta alasan telah dikirim ke email pemohon: ${emailUser}`);
        setRejectTarget(null);
        setRejectReason('');
      });
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    axios.post(`${API_BASE}/login`, { email: loginData.username, password: loginData.password })
      .then(() => {
        setIsAdminLoggedIn(true);
        setLoginData({ username: '', password: '' });
      })
      .catch(err => {
        if (err.response?.data?.message) setLoginError(err.response.data.message);
        else setLoginError('Gagal terhubung ke server.');
      });
  };

  // ==========================================
  // FILTER RUANGAN
  // ==========================================
  const filteredRuangan = ruangan.filter((r) => {
    const matchSearch = r.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.gedung.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      activeCategory === 'all' ||
      (activeCategory === 'kelas' && r.nama.toLowerCase().includes('kelas')) ||
      (activeCategory === 'lab'   && r.nama.toLowerCase().includes('lab'));
    return matchSearch && matchCategory;
  });

  // ==========================================
  // HELPERS
  // ==========================================
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':  return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 font-semibold';
      case 'approved': return 'bg-green-500/20 text-green-700 border-green-500/30 font-semibold';
      case 'rejected': return 'bg-red-500/20 text-red-700 border-red-500/30 font-semibold';
      case 'selesai':  return 'bg-slate-500/20 text-slate-600 border-slate-400/30 font-semibold';
      default:         return 'bg-gray-500/20 text-gray-700 border-gray-500/30 font-semibold';
    }
  };
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':  return 'Menunggu';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      case 'selesai':  return 'Selesai';
      default:         return status || 'Menunggu';
    }
  };

  // Cek apakah tanggal booking sudah lewat (sebelum hari ini)
  const isExpired = (tanggal) => {
    if (!tanggal) return false;
    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);
    const tglBooking = new Date(tanggal);
    return tglBooking < hariIni;
  };

  // Status yang ditampilkan: approved + tanggal lewat = "selesai"
  const getEffectiveStatus = (booking) => {
    const s = booking.status || 'pending';
    if (s === 'approved' && isExpired(booking.tanggal)) return 'selesai';
    return s;
  };

  // ==========================================
  // NAVBAR
  // ==========================================
  const Navbar = () => (
    <nav className="bg-white/95 border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm shadow-sm overflow-visible">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <button onClick={() => setView('home')} className="flex items-center hover:opacity-80 transition-opacity shrink-0">
            <img src={logo} alt="Binus Space Logo" className="h-10 sm:h-14 md:h-16 w-auto object-contain scale-[1.5] origin-left" />
          </button>
          <div className="flex items-center gap-2 sm:gap-6">
            <button onClick={() => setView('home')} className={`text-sm sm:text-base font-medium transition-colors ${view === 'home' ? 'text-blue-700 font-bold' : 'text-slate-600 hover:text-blue-700'}`}>Home</button>
            <button onClick={() => setView('booking')} className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all ${view === 'booking' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}>
              <span className="hidden sm:inline">Booking Ruangan</span>
              <span className="sm:hidden">Booking</span>
              <Users size={18} />
            </button>
            <button onClick={() => setView('admin')} className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all ${view === 'admin' ? 'bg-blue-700 text-white shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}>
              <ShieldCheck size={18} />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  // ==========================================
  // FOOTER
  // ==========================================
  const Footer = () => (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-12">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-8 md:gap-12">
          <div className="md:col-span-2">
            <div className="mb-4 md:mb-6 pl-2 md:pl-0">
              <img src={logo} alt="Binus Space Logo" className="h-10 md:h-12 w-auto object-contain scale-125 md:scale-[1.5] origin-left" />
            </div>
            <p className="text-slate-600 max-w-md leading-relaxed text-sm md:text-base mt-2 md:mt-4">
              Platform booking ruangan kampus yang memudahkan mahasiswa dan dosen untuk meminjam ruangan kelas dan lab secara online.
            </p>
          </div>
          <div className="pt-2 md:pt-0 border-t border-slate-100 md:border-0 mt-2 md:mt-0">
            <h3 className="font-semibold mb-4 text-slate-900 text-lg mt-4 md:mt-0">Kontak</h3>
            <ul className="space-y-4 md:space-y-3 text-slate-600 text-sm md:text-base">
              <li className="flex items-start gap-3"><MapPin size={20} className="mt-0.5 flex-shrink-0 text-blue-600" /><span>Kampus Binus, Alam Sutera</span></li>
              <li className="flex items-center gap-3"><Phone size={20} className="text-blue-600" /><span>(021) 1234-5678</span></li>
              <li className="flex items-center gap-3"><Mail size={20} className="text-blue-600" /><span>info@binusspace.ac.id</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 mt-10 md:mt-12 pt-6 md:pt-8 text-center text-slate-500 text-xs md:text-sm">
          <p>&copy; 2026 Binus Space. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );

  // ==========================================
  // CONTENT DATA
  // ==========================================
  const features = [
    { icon: Search,      title: 'Cek Ketersediaan', description: 'Lihat ruangan yang tersedia dengan mudah — cari berdasarkan nama, gedung, atau tipe ruangan.' },
    { icon: Calendar,    title: 'Booking Jadwal',    description: 'Pesan ruangan kapan saja, di mana saja. Isi data diri, pilih waktu, dan ajukan dalam hitungan menit.' },
    { icon: CheckCircle, title: 'Approval System',   description: 'Admin mereview dan menyetujui permohonan booking melalui dashboard khusus secara cepat dan transparan.' },
  ];

  const stepsData = [
    { number: '01', title: 'Pilih Ruangan',     description: 'Browse dan cari ruangan yang sesuai dari daftar kelas dan lab yang tersedia.' },
    { number: '02', title: 'Tentukan Jadwal',    description: 'Pilih tanggal dan waktu yang diinginkan sesuai kebutuhan kamu.' },
    { number: '03', title: 'Lengkapi Data',      description: 'Isi nama, NIM/NIP, dan tujuan peminjaman dengan lengkap.' },
    { number: '04', title: 'Tunggu Persetujuan', description: 'Admin akan mereview permohonan dan memperbarui status booking kamu.' },
  ];

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="min-h-screen font-sans flex flex-col bg-slate-50 overflow-x-hidden">
      <style>{`
        ::-webkit-scrollbar { display: none; }
        html, body { -ms-overflow-style: none; scrollbar-width: none; }
        input[type="time"]::-webkit-datetime-edit-ampm-field { display: none; }
        input[type="time"] { -webkit-text-fill-color: unset; }
      `}</style>
      <Navbar />

      <div className="flex-grow flex flex-col">

        {/* === HOME === */}
        {view === 'home' && (
          <div className="bg-white">
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-cover bg-right bg-no-repeat" style={{ backgroundImage: `linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0) 100%), url(${backgroundRuangKelas})` }}></div>
              <div className="relative max-w-7xl mx-auto px-8 pt-24 pb-20 md:pt-32 md:pb-28 text-left">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">Platform Booking Ruangan Kampus</div>
                  <h1 className="text-5xl md:text-6xl font-bold mb-6 text-slate-900 leading-tight">Peminjaman Ruangan <br /> Kampus <span className="text-blue-600">Lebih Mudah</span></h1>
                  <p className="text-xl text-slate-600 mb-10 leading-relaxed">Binus Space memudahkan mahasiswa dan dosen untuk mengecek ketersediaan dan meminjam ruangan kelas atau lab secara mandiri, kapan saja, di mana saja.</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => setView('booking')} className="group flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg bg-blue-600 text-white hover:bg-blue-700 transition-all">
                      Mulai Booking Sekarang <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 rounded-lg font-semibold text-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-all">
                      Pelajari Lebih Lanjut
                    </button>
                  </div>
                  <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl">
                    <div><div className="text-3xl font-bold text-blue-600">{ruangan.length || 2}</div><div className="text-sm text-slate-600 mt-1">Ruangan Tersedia</div></div>
                    <div><div className="text-3xl font-bold text-blue-600">24/7</div><div className="text-sm text-slate-600 mt-1">Akses Online</div></div>
                    <div><div className="text-3xl font-bold text-blue-600">Instan</div><div className="text-sm text-slate-600 mt-1">Notifikasi Real-time</div></div>
                  </div>
                </div>
              </div>
            </div>

            <div id="features" className="bg-slate-50 py-20 border-t border-slate-100">
              <div className="max-w-7xl mx-auto px-8">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold mb-4 text-slate-900">Fitur Unggulan</h2>
                  <p className="text-xl text-slate-600 max-w-2xl mx-auto">Platform lengkap untuk memudahkan proses peminjaman ruangan kampus</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="bg-white border border-slate-200 rounded-xl p-8 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
                        <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                          <Icon size={28} className="text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white py-20 border-t border-slate-100">
              <div className="max-w-7xl mx-auto px-8">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-bold mb-4 text-slate-900">Cara Kerja</h2>
                  <p className="text-xl text-slate-600 max-w-2xl mx-auto">Proses booking ruangan yang simple dan efisien</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {stepsData.map((s, index) => (
                    <div key={index} className="relative">
                      <div className="text-center">
                        <div className="text-6xl font-bold mb-4 opacity-20 text-blue-600">{s.number}</div>
                        <h3 className="text-xl font-semibold mb-3 text-blue-600">{s.title}</h3>
                        <p className="text-slate-600 leading-relaxed">{s.description}</p>
                      </div>
                      {index < stepsData.length - 1 && <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-transparent -translate-x-1/2"></div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === BOOKING === */}
        {view === 'booking' && (
          <div className="bg-slate-100 flex-grow pb-20">
            <div className="max-w-7xl mx-auto px-8 pt-10">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Booking Ruangan</h2>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input type="text" placeholder="Cari ruangan berdasarkan nama, deskripsi, atau gedung..." className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="flex gap-3 mb-6">
                {[{ key: 'all', label: 'Semua Ruangan' }, { key: 'kelas', label: 'Kelas' }, { key: 'lab', label: 'Lab' }].map(({ key, label }) => (
                  <button key={key} onClick={() => setActiveCategory(key)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${activeCategory === key ? 'bg-blue-800 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>{label}</button>
                ))}
              </div>
              <p className="text-slate-500 mb-4 text-sm font-medium">Ditemukan {filteredRuangan.length} ruangan</p>
              <div className="flex flex-col gap-6">
                {filteredRuangan.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 font-medium">Tidak ada ruangan yang cocok dengan pencarian</div>
                ) : filteredRuangan.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row transition hover:shadow-md">
                    <div className="md:w-1/3 h-56 md:h-auto relative">
                      <img src={r.nama === 'Lab Komputer A' ? LabKomputerA : Ruangkelas301} alt={r.nama} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 md:w-2/3 flex flex-col justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-blue-700 mb-2">{r.nama}</h3>
                        <div className="flex items-center gap-2 text-slate-600 text-sm mb-1"><Users size={16} /> Kapasitas: {r.kapasitas} orang</div>
                        <div className="text-slate-500 text-sm mb-4">Gedung {r.gedung} - Lantai {r.lantai}</div>
                        <p className="text-slate-600 text-sm mb-4 leading-relaxed">Ruang kelas standar dengan fasilitas lengkap untuk mendukung perkuliahan dan diskusi kelompok yang interaktif.</p>
                        <div className="flex gap-2 mb-6">
                          <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 border border-slate-200"><Wifi size={14} /> WiFi</span>
                          <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 border border-slate-200"><Monitor size={14} /> Projector</span>
                        </div>
                      </div>
                      <button onClick={() => {
                        setSelectedRoom(r);
                        setFormData({ ...formData, fasilitas_id: r.nama });
                        setStep(1);
                        // Ambil jadwal yang sudah di-approve untuk ruangan ini
                        axios.get(`${API_BASE}/ruangan/${encodeURIComponent(r.nama)}/booked`)
                          .then(res => setBookedSlots(res.data))
                          .catch(() => setBookedSlots([]));
                      }} className="w-fit bg-blue-800 text-white font-semibold px-8 py-2.5 rounded-lg hover:bg-blue-900 transition-colors">Booking Sekarang</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Booking */}
            {selectedRoom && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative flex flex-col">
                  <h3 className="text-2xl font-bold text-slate-900 mb-8">Booking {selectedRoom.nama}</h3>
                  <div className="flex items-center justify-between mb-8 text-sm font-medium">
                    {[{ label: 'Pilih Waktu' }, { label: 'Info Pemohon' }, { label: 'Konfirmasi' }].map((s, i) => (
                      <React.Fragment key={i}>
                        <div className={`flex items-center gap-2 ${step >= i + 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                          <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs ${step >= i + 1 ? 'bg-blue-600' : 'bg-slate-300'}`}>{i + 1}</div>
                          {s.label}
                        </div>
                        {i < 2 && <div className="h-px bg-slate-200 flex-grow mx-4"></div>}
                      </React.Fragment>
                    ))}
                  </div>

                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                        <div className="grid grid-cols-3 gap-2">
                          <select className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={formData.tanggal ? formData.tanggal.split('/')[0] : ''} onChange={(e) => { const p = formData.tanggal ? formData.tanggal.split('/') : ['','','']; p[0] = e.target.value; setFormData({ ...formData, tanggal: p.join('/') }); }}>
                            <option value="">Hari</option>
                            {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <select className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={formData.tanggal ? formData.tanggal.split('/')[1] : ''} onChange={(e) => { const p = formData.tanggal ? formData.tanggal.split('/') : ['','','']; p[1] = e.target.value; setFormData({ ...formData, tanggal: p.join('/') }); }}>
                            <option value="">Bulan</option>
                            {[['01','Januari'],['02','Februari'],['03','Maret'],['04','April'],['05','Mei'],['06','Juni'],['07','Juli'],['08','Agustus'],['09','September'],['10','Oktober'],['11','November'],['12','Desember']].map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                          </select>
                          <select className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={formData.tanggal ? formData.tanggal.split('/')[2] : ''} onChange={(e) => { const p = formData.tanggal ? formData.tanggal.split('/') : ['','','']; p[2] = e.target.value; setFormData({ ...formData, tanggal: p.join('/') }); }}>
                            <option value="">Tahun</option>
                            {Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() + i)).map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Waktu Mulai</label>
                          <input type="time" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={formData.waktu_mulai} onChange={(e) => setFormData({ ...formData, waktu_mulai: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Durasi</label>
                          <select className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" value={formData.durasi} onChange={(e) => setFormData({ ...formData, durasi: e.target.value })}>
                            <option value="1">1 Jam</option>
                            <option value="2">2 Jam</option>
                            <option value="3">3 Jam</option>
                          </select>
                        </div>
                      </div>

                      {/* --- DAFTAR JADWAL SUDAH TERISI (APPROVED) --- */}
                      {(() => {
                        // Konversi tanggal pilihan user (DD/MM/YYYY) ke format DB (YYYY-MM-DD) untuk dicocokkan
                        let tanggalDB = '';
                        if (formData.tanggal && formData.tanggal.split('/').length === 3) {
                          const [d, m, y] = formData.tanggal.split('/');
                          if (d && m && y) tanggalDB = `${y}-${m}-${d}`;
                        }
                        // Tampilkan slot untuk tanggal terpilih (atau semua slot jika tanggal belum dipilih)
                        const slotTampil = tanggalDB
                          ? bookedSlots.filter(s => s.tanggal === tanggalDB)
                          : bookedSlots;

                        if (slotTampil.length === 0) return null;
                        return (
                          <div className="mt-2 p-4 border border-red-200 bg-red-50 rounded-xl">
                            <h4 className="text-sm font-bold text-red-700 flex items-center gap-2 mb-3">
                              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                              Jadwal Sudah Terisi {tanggalDB ? `(${formData.tanggal})` : '(semua tanggal)'}
                            </h4>
                            <ul className="text-sm text-red-600 space-y-1.5 ml-4 list-disc">
                              {slotTampil.map((slot, idx) => (
                                <li key={idx} className="font-medium">
                                  {slot.tanggal} — jam {slot.waktu_mulai} ({slot.durasi} jam)
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-red-500 mt-3 italic">*Pilih waktu di luar jadwal di atas, karena slot tersebut sudah disetujui.</p>
                          </div>
                        );
                      })()}

                      <div className="flex justify-end gap-3 mt-8">
                        <button onClick={() => setSelectedRoom(null)} className="px-6 py-2.5 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg">BATAL</button>
                        <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">LANJUT</button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <input type="text" placeholder="Nama Lengkap *" className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} />
                      <input type="text" placeholder="NIM / NIP *" className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500" value={formData.nim} onChange={(e) => setFormData({ ...formData, nim: e.target.value })} />
                      <input type="email" placeholder="Email *" className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                      <input type="text" placeholder="Nomor Telepon *" className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500" value={formData.telepon} onChange={(e) => setFormData({ ...formData, telepon: e.target.value })} />
                      <textarea placeholder="Tujuan Peminjaman *" rows="3" className="w-full p-3 border border-slate-300 rounded-lg focus:border-blue-500" value={formData.tujuan} onChange={(e) => setFormData({ ...formData, tujuan: e.target.value })}></textarea>
                      <div className="flex justify-end gap-3 mt-8">
                        <button onClick={() => setStep(1)} className="px-6 py-2.5 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg">KEMBALI</button>
                        <button onClick={() => setStep(3)} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">LANJUT</button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="flex flex-col flex-grow">
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-sm space-y-3 mb-6">
                        <div className="grid grid-cols-3"><span className="text-slate-500">Ruangan:</span><span className="col-span-2 font-medium">{selectedRoom.nama}</span></div>
                        <div className="grid grid-cols-3"><span className="text-slate-500">Tanggal:</span><span className="col-span-2 font-medium">{formData.tanggal || '-'}</span></div>
                        <div className="grid grid-cols-3"><span className="text-slate-500">Waktu:</span><span className="col-span-2 font-medium">{formData.waktu_mulai || '-'} ({formData.durasi} Jam)</span></div>
                        <hr className="my-2 border-slate-200" />
                        <div className="grid grid-cols-3"><span className="text-slate-500">Pemohon:</span><span className="col-span-2 font-medium">{formData.nama || '-'} ({formData.nim})</span></div>
                        <div className="grid grid-cols-3"><span className="text-slate-500">Email:</span><span className="col-span-2 font-medium">{formData.email || '-'}</span></div>
                        <div className="grid grid-cols-3"><span className="text-slate-500">Telepon:</span><span className="col-span-2 font-medium">{formData.telepon || '-'}</span></div>
                        <div className="grid grid-cols-3"><span className="text-slate-500">Tujuan:</span><span className="col-span-2 font-medium">{formData.tujuan || '-'}</span></div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setStep(2)} className="px-6 py-2.5 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg">KEMBALI</button>
                        <button onClick={handleBooking} disabled={loadingBooking} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed">
                          {loadingBooking ? 'Mengirim...' : 'KONFIRMASI BOOKING'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === ADMIN === */}
        {view === 'admin' && (
          <div className="bg-slate-50 flex-grow pb-20">
            {!isAdminLoggedIn ? (
              <div className="flex flex-col items-center justify-center pt-24 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
                  <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center">
                      <Lock size={32} className="text-blue-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Portal Staff Admin</h2>
                  <p className="text-center text-slate-500 text-sm mb-8">Silakan masuk untuk mengelola persetujuan ruangan</p>
                  <form onSubmit={handleAdminLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                      <input type="email" required placeholder="admin@binus.ac.id" className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none" value={loginData.username} onChange={(e) => setLoginData({ ...loginData, username: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                      <input type="password" required className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
                    </div>
                    {loginError && <p className="text-red-600 text-sm font-medium bg-red-50 border border-red-100 rounded-lg px-4 py-2">{loginError}</p>}
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all mt-4">Masuk Sistem</button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="max-w-7xl mx-auto px-8 pt-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2 text-slate-900">Admin Panel - Persetujuan Booking</h1>
                    <p className="text-slate-600">Kelola dan setujui permintaan peminjaman ruangan</p>
                  </div>
                  <button onClick={() => setIsAdminLoggedIn(false)} className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-semibold rounded-lg transition-colors border border-red-100">
                    <LogOut size={18} /> Keluar
                  </button>
                </div>
                <div className="flex gap-3 mb-6 flex-wrap">
                  {['all','pending','approved','selesai','rejected'].map((status) => (
                    <button key={status} onClick={() => setAdminFilter(status)} className={`px-4 py-2 rounded-lg transition-all font-medium ${adminFilter === status ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'}`}>
                      {status === 'all' && 'Semua'}{status === 'pending' && 'Menunggu'}{status === 'approved' && 'Disetujui'}{status === 'selesai' && 'Selesai'}{status === 'rejected' && 'Ditolak'}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  {bookings.filter(b => adminFilter === 'all' || getEffectiveStatus(b) === adminFilter).map((booking) => {
                    const currentStatus = getEffectiveStatus(booking);
                    return (
                      <div key={booking.id} className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                          <div>
                            <h3 className="text-xl font-bold mb-2 text-blue-700">{booking.fasilitas_id}</h3>
                            <span className={`inline-block px-3 py-1 rounded-md text-xs border ${getStatusColor(currentStatus)}`}>{getStatusText(currentStatus)}</span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">Diajukan: {booking.created_at || '-'}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 bg-slate-50 rounded-lg">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm"><User size={16} className="text-blue-600" /><span className="text-slate-600 w-20">Pemohon:</span><span className="font-semibold text-slate-900">{booking.nama}</span></div>
                            <div className="flex items-center gap-2 text-sm pl-6"><span className="text-slate-600 w-20">NIM/NIP:</span><span className="text-slate-900">{booking.nim}</span></div>
                            <div className="flex items-center gap-2 text-sm pl-6"><span className="text-slate-600 w-20">Email:</span><span className="text-slate-900">{booking.email}</span></div>
                            <div className="flex items-center gap-2 text-sm pl-6"><span className="text-slate-600 w-20">Telepon:</span><span className="text-slate-900">{booking.telepon}</span></div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm"><Calendar size={16} className="text-blue-600" /><span className="text-slate-600 w-20">Tanggal:</span><span className="font-semibold text-slate-900">{booking.tanggal}</span></div>
                            <div className="flex items-center gap-2 text-sm"><Clock size={16} className="text-blue-600" /><span className="text-slate-600 w-20">Waktu:</span><span className="text-slate-900">{booking.waktu_mulai} ({booking.durasi} jam)</span></div>
                            <div className="flex items-center gap-2 text-sm"><MapPin size={16} className="text-blue-600" /><span className="text-slate-600 w-20">Tipe:</span><span className="text-slate-900">{booking.fasilitas_id.includes('Lab') ? 'Lab' : 'Kelas'}</span></div>
                          </div>
                        </div>
                        <div className="mb-5 pb-4 border-b border-slate-100">
                          <p className="text-sm text-slate-500 mb-1 font-medium flex items-center gap-2"><FileText size={16} className="text-blue-600" /> Tujuan Peminjaman:</p>
                          <p className="text-sm text-slate-800 bg-white p-3 border border-slate-200 rounded-lg leading-relaxed">{booking.tujuan}</p>
                        </div>
                        {currentStatus === 'pending' && (
                          <div className="flex gap-3 mt-4">
                            <button onClick={() => handleApprove(booking.id)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow"><Check size={18} /> Setujui</button>
                            <button onClick={() => openRejectModal(booking)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-all bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow"><X size={18} /> Tolak</button>
                          </div>
                        )}
                        {currentStatus === 'approved' && <div className="text-center p-3 bg-green-50 rounded-lg text-green-700 font-semibold border border-green-100">✓ Booking telah disetujui</div>}
                        {currentStatus === 'selesai' && <div className="text-center p-3 bg-slate-100 rounded-lg text-slate-600 font-semibold border border-slate-200">✓ Booking selesai (jadwal telah berlalu)</div>}
                        {currentStatus === 'rejected' && (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                            <p className="text-center text-red-700 font-semibold mb-1">✗ Booking ditolak</p>
                            {booking.alasan_penolakan && (
                              <p className="text-sm text-red-600 text-center"><span className="font-medium">Alasan:</span> {booking.alasan_penolakan}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {bookings.filter(b => adminFilter === 'all' || (b.status || 'pending') === adminFilter).length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500 font-medium">Tidak ada booking dengan status ini</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* === POPUP ALASAN PENOLAKAN === */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-11 w-11 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                <X size={22} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Tolak Permohonan Booking</h3>
            </div>
            <p className="text-sm text-slate-500 mb-5">
              Booking <span className="font-semibold text-slate-700">{rejectTarget.fasilitas_id}</span> oleh <span className="font-semibold text-slate-700">{rejectTarget.nama}</span>. Alasan penolakan akan dikirimkan ke email pemohon.
            </p>

            <label className="block text-sm font-semibold text-slate-700 mb-2">Alasan Penolakan</label>
            <textarea
              rows="4"
              placeholder="Contoh: Ruangan sedang dalam perbaikan pada tanggal tersebut..."
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all outline-none resize-none"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>

            <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
              <Mail size={14} />
              <span>Notifikasi akan dikirim ke: {rejectTarget.email}</span>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors">BATAL</button>
              <button onClick={submitReject} className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                <Mail size={16} /> Kirim & Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
