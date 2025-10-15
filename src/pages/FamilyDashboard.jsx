import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// FamilyDashboard.jsx
// - Allows a family member to link to a patient using the patient's careCode
// - Shows live medicines for the linked patient
// - Shows today's logs (Taken/Missed/Skipped) and a simple adherence percentage
// - Lets the family send a quick message to the patient (stored in Firestore)

export default function FamilyDashboard() {
  const [user, setUser] = useState(null);
  const [careCodeInput, setCareCodeInput] = useState('');
  const [linkedPatient, setLinkedPatient] = useState(null); // { id, email, careCode }
  const [meds, setMeds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to medicines & today's logs once a patient is linked
  useEffect(() => {
    if (!linkedPatient) return;

    // medicines path: medicines/{patientId}/items
    const medsColl = collection(db, 'medicines', linkedPatient.id, 'items');
    const unsubMeds = onSnapshot(medsColl, (snap) => {
      setMeds(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // logs path (prototype): logs/{patientId}/{YYYY-MM-DD}
    const dayId = new Date().toISOString().split('T')[0];
    const logsColl = collection(db, 'logs', linkedPatient.id, dayId);
    const unsubLogs = onSnapshot(logsColl, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubMeds();
      unsubLogs();
    };
  }, [linkedPatient]);

  async function linkToPatient() {
    setStatusMsg('Searching patient...');
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('careCode', '==', careCodeInput));
      const snap = await getDocs(q);
      if (snap.empty) {
        setStatusMsg('No patient found with that code.');
        return;
      }
      const docSnap = snap.docs[0];
      const patient = { id: docSnap.id, ...docSnap.data() };

      // Save link info (optional) - add family id to patient's document for quick lookup
      if (user) {
        try {
          const patientRef = doc(db, 'users', patient.id);
          await updateDoc(patientRef, { familyIds: arrayUnion(user.uid) });
        } catch (e) {
          // ignore update errors during prototype
          console.warn('Could not update patient doc with family link', e);
        }
      }

      setLinkedPatient(patient);
      setStatusMsg('Linked to patient: ' + (patient.email || patient.careCode));
    } catch (err) {
      console.error(err);
      setStatusMsg('Error linking to patient');
    }
  }

  async function sendMessageToPatient() {
    if (!linkedPatient || !user) return setStatusMsg('Link to a patient first');
    if (!message.trim()) return setStatusMsg('Enter a message');
    try {
      await addDoc(collection(db, 'messages', linkedPatient.id, 'inbox'), {
        from: user.uid,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      });
      setMessage('');
      setStatusMsg('Message sent');
    } catch (e) {
      console.error(e);
      setStatusMsg('Could not send message');
    }
  }

  function computeAdherenceFromLogs(logArray) {
    if (!logArray || logArray.length === 0) return { pct: 100, taken: 0, total: 0 };
    const total = logArray.length;
    const taken = logArray.filter((l) => l.status === 'Taken').length;
    const pct = Math.round((taken / total) * 100);
    return { pct, taken, total };
  }

  const todayAdherence = computeAdherenceFromLogs(logs);

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Family Dashboard</h1>

        <div className="mb-4 p-4 bg-white rounded shadow">
          <div className="mb-2 text-sm text-slate-600">Link to a patient using their CareCode</div>
          <div className="flex gap-2">
            <input
              className="p-2 border rounded w-full"
              placeholder="Enter patient's CareCode (e.g. CCABC12)"
              value={careCodeInput}
              onChange={(e) => setCareCodeInput(e.target.value.toUpperCase())}
            />
            <button onClick={linkToPatient} className="bg-indigo-600 text-white px-4 rounded">Link</button>
          </div>
          <div className="mt-2 text-sm text-slate-500">{statusMsg}</div>
        </div>

        {!linkedPatient ? (
          <div className="p-6 bg-white rounded shadow text-slate-600">No patient linked yet — link using their CareCode to view medicines and logs.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-white rounded shadow">
                <div className="text-sm text-slate-500">Patient</div>
                <div className="font-semibold">{linkedPatient.email || linkedPatient.careCode}</div>
                <div className="text-xs text-slate-400 mt-1">Code: {linkedPatient.careCode}</div>
              </div>

              <div className="p-4 bg-white rounded shadow">
                <div className="text-sm text-slate-500">Today's adherence</div>
                <div className="text-xl font-bold mt-2">{todayAdherence.pct}%</div>
                <div className="text-sm text-slate-400">{todayAdherence.taken}/{todayAdherence.total} taken</div>
              </div>

              <div className="p-4 bg-white rounded shadow">
                <div className="text-sm text-slate-500">Quick actions</div>
                <div className="flex flex-col gap-2 mt-2">
                  <button onClick={() => setStatusMsg('Requesting a quick check-in...')} className="p-2 bg-blue-600 text-white rounded">Request Check-in</button>
                  <button onClick={() => setStatusMsg('Reminder sent (demo)')} className="p-2 bg-green-600 text-white rounded">Send Reminder</button>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded shadow">
                <h3 className="font-semibold mb-2">Medicines</h3>
                {meds.length === 0 ? (
                  <div className="text-sm text-slate-500">No medicines found for this patient.</div>
                ) : (
                  <div className="space-y-2">
                    {meds.map((m) => (
                      <div key={m.id} className="p-2 border rounded flex justify-between items-center">
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-slate-500">{m.dosage} • {m.time || '—'}</div>
                        </div>
                        <div className="text-sm text-slate-400">{m.duration || ''}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-white rounded shadow">
                <h3 className="font-semibold mb-2">Today's Logs</h3>
                {logs.length === 0 ? (
                  <div className="text-sm text-slate-500">No logs for today yet.</div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((l) => (
                      <div key={l.id} className="p-2 border rounded flex justify-between items-center">
                        <div>
                          <div className="font-medium">{l.medName || l.medicineId}</div>
                          <div className="text-xs text-slate-500">{new Date(l.timestamp).toLocaleTimeString()} • {l.status}</div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${l.status==='Taken'?'bg-green-100': l.status==='Missed'?'bg-red-100':'bg-yellow-100'}`}>
                          {l.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded shadow">
              <h3 className="font-semibold mb-2">Send quick message to patient</h3>
              <div className="flex gap-2">
                <input value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Message" className="p-2 border rounded w-full" />
                <button onClick={sendMessageToPatient} className="bg-indigo-600 text-white px-4 rounded">Send</button>
              </div>
              <div className="mt-2 text-sm text-slate-500">{statusMsg}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
