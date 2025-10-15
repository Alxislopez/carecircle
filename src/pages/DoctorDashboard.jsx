import React, {useEffect, useState} from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { CSVLink } from "react-csv";

export default function DoctorDashboard(){
  const [patients, setPatients] = useState([]); // will hold objects {uid, email, adherence}
  // For demo: fetch all users with role patient (small projects)
  useEffect(()=> {
    const q = query(collection(db,"users"));
    const unsub = onSnapshot(q,snap => {
      const pats = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u=>u.role==="patient");
      setPatients(pats);
    });
    return () => unsub();
  },[]);

  // compute mock adherence by reading logs (skipped for brevity: you can compute by counts)
  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Doctor Dashboard</h1>
      <div className="grid gap-3">
        {patients.map(p => (
          <PatientCard key={p.id} patient={p} />
        ))}
      </div>
    </div>
  );
}

function PatientCard({ patient }){
  // mock adherence percent for quick demo
  const adherence = Math.floor(Math.random()*40)+60; // 60-99
  const color = adherence >= 90 ? "bg-green-200" : adherence >= 70 ? "bg-yellow-200" : "bg-red-200";
  return (
    <div className={`${color} p-4 rounded`}>
      <div className="flex justify-between">
        <div>
          <div className="font-semibold">{patient.email}</div>
          <div className="text-sm">Adherence: {adherence}%</div>
        </div>
        <div>
          <button className="bg-blue-600 text-white px-3 py-1 rounded">View</button>
        </div>
      </div>
    </div>
  );
}
