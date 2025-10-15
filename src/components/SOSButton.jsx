import React from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../services/firebase";

export default function SOSButton({ user }){
  const sendSOS = async () => {
    if(!user) return alert("Login required");
    // for demo we use a static location or navigator.geolocation
    const loc = { lat: 12.9716, lng: 77.5946 }; // Bangalore example
    await addDoc(collection(db,"alerts",user.uid), {
      type: "SOS",
      location: loc,
      timestamp: new Date().toISOString()
    });
    alert("SOS sent to family & doctor (demo)");
  };

  return <button onClick={sendSOS} className="bg-red-600 text-white px-4 py-3 rounded-full shadow">SOS</button>;
}
