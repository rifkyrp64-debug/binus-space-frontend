import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [ruangan, setRuangan] = useState([])
  const [pesan, setPesan] = useState('')
  
  // State untuk menyimpan data ketikan form
  const [formData, setFormData] = useState({
    fasilitas_id: '1', // Default pilih Ruang Kelas 301
    tanggal: '',
    waktu_mulai: '',
    durasi: '2',
    tujuan: ''
  })

  // Mengambil data ruangan saat halaman pertama kali dibuka
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/ruangan')
      .then(response => setRuangan(response.data))
      .catch(error => console.error("Error ngambil data:", error))
  }, [])

  // Fungsi saat tombol "Booking Sekarang" ditekan
  const submitBooking = (e) => {
    e.preventDefault() // Mencegah halaman refresh
    setPesan('Memproses...')

    axios.post('http://127.0.0.1:8000/api/booking', formData)
      .then(response => {
        setPesan('✅ ' + response.data.message)
      })
      .catch(error => {
        if (error.response && error.response.status === 409) {
          setPesan('❌ ERROR: ' + error.response.data.message) // Konflik jadwal!
        } else {
          setPesan('❌ Gagal menghubungi server.')
        }
      })
  }

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Sistem Peminjaman Binus Space 🚀</h1>
      
      {/* Bagian List Ruangan */}
      <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px', marginBottom: '20px', color: 'black' }}>
        <h3>Daftar Ruangan:</h3>
        {ruangan.length === 0 ? <p>Loading data...</p> : (
          <ul>
            {ruangan.map(r => (
              <li key={r.id}><strong>{r.nama}</strong> ({r.kapasitas} org)</li>
            ))}
          </ul>
        )}
      </div>

      {/* Bagian Form Booking */}
      <h3>Form Uji Coba Booking</h3>
      <form onSubmit={submitBooking} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <select 
          onChange={(e) => setFormData({...formData, fasilitas_id: e.target.value})}
          style={{ padding: '8px' }}
        >
          {ruangan.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
        </select>
        
        <input 
          type="date" 
          required 
          onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
          style={{ padding: '8px' }}
        />
        
        <input 
          type="time" 
          required 
          onChange={(e) => setFormData({...formData, waktu_mulai: e.target.value})}
          style={{ padding: '8px' }}
        />
        
        <input 
          type="text" 
          placeholder="Tujuan peminjaman (ex: Rapat BEM)" 
          required 
          onChange={(e) => setFormData({...formData, tujuan: e.target.value})}
          style={{ padding: '8px' }}
        />
        
        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Ajukan Booking!
        </button>
      </form>

      {/* Notifikasi Hasil Booking */}
      {pesan && (
        <div style={{ marginTop: '20px', padding: '15px', border: '2px solid', borderColor: pesan.includes('✅') ? 'green' : 'red', borderRadius: '5px' }}>
          <strong>{pesan}</strong>
        </div>
      )}
    </div>
  )
}

export default App