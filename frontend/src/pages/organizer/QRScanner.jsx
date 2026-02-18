import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function QRScanner() {
  const { id } = useParams();
  const [ticketInput, setTicketInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanHistory, setScanHistory] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    loadAttendance();
  }, [id]);

  const loadAttendance = async () => {
    try {
      const res = await api.get('/organizers/events/' + id + '/attendance');
      setAttendance(res.data);
    } catch (err) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (!ticketInput.trim()) {
      toast.error('Please enter a ticket ID');
      return;
    }

    try {
      const res = await api.post('/organizers/events/' + id + '/scan', {
        ticketId: ticketInput.trim()
      });

      setScanResult({ success: true, message: res.data.message, participant: res.data.participant });
      setScanHistory(prev => [{ ...res.data.participant, time: new Date().toLocaleTimeString(), success: true }, ...prev]);
      toast.success(res.data.message);
      loadAttendance();
    } catch (err) {
      const msg = err.response?.data?.message || 'Scan failed';
      const isDuplicate = err.response?.data?.duplicate;
      setScanResult({ success: false, message: msg, duplicate: isDuplicate });
      toast.error(msg);
    }

    setTicketInput('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleManualAttendance = async (regId, action) => {
    try {
      await api.put('/organizers/events/' + id + '/manual-attendance', {
        registrationId: regId,
        action: action
      });
      toast.success('Attendance ' + (action === 'mark' ? 'marked' : 'unmarked'));
      loadAttendance();
    } catch (err) {
      toast.error('Failed to update attendance');
    }
  };

  const handleExportAttendance = async () => {
    try {
      const res = await api.get('/organizers/events/' + id + '/attendance/export', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'attendance_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Export failed');
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div>
      <Link to={'/organizer/events/' + id} className="text-indigo-600 hover:underline text-sm mb-4 inline-block">&larr; Back to Event</Link>
      <h1 className="text-2xl font-bold mb-6">QR Scanner & Attendance</h1>

      {/* Scanner Section */}
      <div className="card mb-6 bg-gradient-to-r from-indigo-50 to-purple-50">
        <h2 className="text-lg font-semibold mb-3">Scan Ticket</h2>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder="Enter or scan Ticket ID (e.g., TKT-ABC123)"
            className="input-field flex-1"
            autoFocus
          />
          <button onClick={handleScan} className="btn-primary">Scan</button>
        </div>

        {scanResult && (
          <div className={`mt-3 p-3 rounded ${scanResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-medium ${scanResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {scanResult.success ? '✓' : '✗'} {scanResult.message}
            </p>
            {scanResult.participant && (
              <p className="text-sm text-gray-600 mt-1">
                {scanResult.participant.name} ({scanResult.participant.email})
              </p>
            )}
            {scanResult.duplicate && (
              <p className="text-sm text-orange-600 mt-1">Duplicate scan detected</p>
            )}
          </div>
        )}
      </div>

      {/* Attendance Stats */}
      {attendance && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-bold text-indigo-600">{attendance.total}</p>
            <p className="text-xs text-gray-500">Total Registered</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">{attendance.scannedCount}</p>
            <p className="text-xs text-gray-500">Checked In</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-amber-600">{attendance.notScannedCount}</p>
            <p className="text-xs text-gray-500">Not Yet Scanned</p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {attendance && attendance.total > 0 && (
        <div className="card mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Attendance Progress</span>
            <span>{Math.round((attendance.scannedCount / attendance.total) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: (attendance.scannedCount / attendance.total * 100) + '%' }}></div>
          </div>
        </div>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-3">Recent Scans</h2>
          <div className="space-y-2">
            {scanHistory.slice(0, 10).map((scan, i) => (
              <div key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                <div>
                  <span className="font-medium">{scan.name}</span>
                  <span className="text-gray-400 ml-2">{scan.ticketId}</span>
                </div>
                <span className="text-gray-500">{scan.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participant Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Not Scanned */}
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Not Yet Scanned</h2>
            <button onClick={handleExportAttendance} className="btn-secondary text-xs">Export CSV</button>
          </div>
          {attendance?.notScanned?.length === 0 ? (
            <p className="text-gray-400 text-sm">All participants checked in!</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {attendance?.notScanned?.map(reg => (
                <div key={reg._id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <p className="font-medium">{reg.userId?.firstName} {reg.userId?.lastName}</p>
                    <p className="text-gray-400 text-xs">{reg.ticketId}</p>
                  </div>
                  <button onClick={() => handleManualAttendance(reg._id, 'mark')}
                    className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100">
                    Mark Present
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Already Scanned */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Checked In</h2>
          {attendance?.scanned?.length === 0 ? (
            <p className="text-gray-400 text-sm">No one checked in yet</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {attendance?.scanned?.map(reg => (
                <div key={reg._id} className="flex justify-between items-center text-sm border-b pb-2">
                  <div>
                    <p className="font-medium">{reg.userId?.firstName} {reg.userId?.lastName}</p>
                    <p className="text-gray-400 text-xs">{reg.ticketId}</p>
                  </div>
                  <button onClick={() => handleManualAttendance(reg._id, 'unmark')}
                    className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100">
                    Unmark
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QRScanner;
