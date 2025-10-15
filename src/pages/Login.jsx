import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigate } from "react-router-dom";

function genCareCode() {
  return "CC" + Math.random().toString(36).slice(2,8).toUpperCase();
}

export default function Login(){
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [role,setRole]=useState("patient");
  const navigate = useNavigate();

  const signup = async () => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = res.user.uid;
    const careCode = genCareCode();
    await setDoc(doc(db,"users",uid), { email, role, careCode, createdAt: new Date().toISOString() });
    if(role==="patient") navigate("/patient");
    if(role==="family") navigate("/family");
    if(role==="doctor") navigate("/doctor");
  };

  const login = async () => {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    const uid = res.user.uid;
    const docSnap = await getDoc(doc(db,"users",uid));
    if(!docSnap.exists()) {
      alert("No profile found");
      return;
    }
    const user = docSnap.data();
    if(user.role==="patient") navigate("/patient");
    else if(user.role==="family") navigate("/family");
    else navigate("/doctor");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="p-8 bg-white rounded shadow w-96">
        <h2 className="text-xl font-bold mb-4">CareCircle - Login / Signup</h2>
        <input className="w-full mb-2 p-2 border" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input type="password" className="w-full mb-2 p-2 border" placeholder="password" value={pass} onChange={e=>setPass(e.target.value)}/>
        <select className="w-full mb-2 p-2 border" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="patient">Patient</option>
          <option value="family">Family</option>
          <option value="doctor">Doctor</option>
        </select>
        <div className="flex gap-2">
          <button onClick={signup} className="bg-green-600 text-white px-4 py-2 rounded">Sign up</button>
          <button onClick={login} className="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
        </div>
      </div>
    </div>
  );
}
