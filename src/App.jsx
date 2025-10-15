import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import FamilyDashboard from "./pages/FamilyDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";

export default function App(){
  return (
    <Routes>
      <Route path="/" element={<Login/>}/>
      <Route path="/patient" element={<PatientDashboard/>}/>
      <Route path="/family" element={<FamilyDashboard/>}/>
      <Route path="/doctor" element={<DoctorDashboard/>}/>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
