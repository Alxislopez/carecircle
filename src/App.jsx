import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PatientDashboard from "./pages/PatientDashboard";
import FamilyDashboard from "./pages/FamilyDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";

export default function App(){
  return (
    <Routes>
      <Route path="/" element={<Login/>}/>
      <Route path="/signup" element={<Signup />} />
      <Route path="/patient-dashboard" element={<PatientDashboard/>}/>
      <Route path="/family-dashboard" element={<FamilyDashboard/>}/>
      <Route path="/doctor-dashboard" element={<DoctorDashboard/>}/>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
