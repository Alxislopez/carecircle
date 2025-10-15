import React from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../services/firebase";

export default function MedicineCard({ med, user }){
  const mark = async (status) => {
    if(!user) return;
    const dayId = new Date().toISOString().split("T")[0];
    await addDoc(collection(db,"logs",user.uid,dayId), {
      medicineId: med.id,
      medName: med.name,
      status,
      timestamp: new Date().toISOString()
    });
    alert(`Marked ${status}`);
  };

  return (
    <div className="p-3 border rounded bg-white flex justify-between items-center">
      <div>
        <div className="font-semibold">{med.name}</div>
        <div className="text-sm text-slate-500">{med.dosage} • {med.time}</div>
      </div>
      <div className="flex gap-2">
        <button onClick={()=>mark("Taken")} className="bg-green-600 text-white px-2 py-1 rounded">Taken</button>
        <button onClick={()=>mark("Missed")} className="bg-red-600 text-white px-2 py-1 rounded">Missed</button>
        <button onClick={()=>mark("Skipped")} className="bg-yellow-500 text-white px-2 py-1 rounded">Skip</button>
      </div>
    </div>
  );
}
