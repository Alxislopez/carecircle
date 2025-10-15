import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export default function AddMedicineForm({ user }){
  const [name,setName]=useState("");
  const [dosage,setDosage]=useState("");
  const [time,setTime]=useState("");

  const save = async () => {
    if(!user) return alert("login");
    await addDoc(collection(db, "medicines", user.uid, "items"), {
      name, dosage, time, createdAt: new Date().toISOString()
    });
    setName(""); setDosage(""); setTime("");
  };

  return (
    <div className="p-4 border rounded bg-white">
      <input className="w-full mb-2 p-2 border" placeholder="Medicine name" value={name} onChange={e=>setName(e.target.value)}/>
      <input className="w-full mb-2 p-2 border" placeholder="Dosage e.g., 500mg" value={dosage} onChange={e=>setDosage(e.target.value)}/>
      <input type="time" className="w-full mb-2 p-2 border" value={time} onChange={e=>setTime(e.target.value)}/>
      <button onClick={save} className="bg-indigo-600 text-white px-3 py-2 rounded">Add Medicine</button>
    </div>
  );
}
