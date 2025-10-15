import React, { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, query } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import AddMedicineForm from "../components/AddMedicineForm";
import MedicineCard from "../components/MedicineCard";
import SOSButton from "../components/SOSButton";

export default function PatientDashboard(){
  const [user, setUser] = useState(null);
  const [meds, setMeds] = useState([]);

  useEffect(()=> {
    const unsubAuth = onAuthStateChanged(auth, u => { setUser(u); });
    return () => unsubAuth();
  },[]);

  useEffect(()=> {
    if(!user) return;
    const q = query(collection(db,"medicines", user.uid, "items"));
    const unsub = onSnapshot(q, snapshot => {
      setMeds(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  },[user]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Patient Dashboard</h1>
      <div className="mb-4">
        <AddMedicineForm user={user}/>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {meds.map(m => <MedicineCard key={m.id} med={m} user={user} />)}
      </div>
      <div className="fixed bottom-6 right-6">
        <SOSButton user={user}/>
      </div>
    </div>
  );
}
