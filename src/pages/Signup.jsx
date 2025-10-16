import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Patient",
    phone: "",
    emergencyContact: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (!formData.name || !formData.email || !formData.password) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
          emergencyContact: formData.emergencyContact
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert(`Signup successful! Your unique code is: ${data.uniqueCode}\nPlease save this code to link with doctors or family members.`);
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
        // Navigate based on role
        if (data.user.role === "Doctor") {
          navigate("/doctor-dashboard");
        } else if (data.user.role === "Family") {
          navigate("/family-dashboard");
        } else {
          navigate("/patient-dashboard");
        }
      } else {
        console.error("Signup error:", data);
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Network error: " + err.message + "\nPlease make sure the backend server is running on port 5000");
    }
  };

  const goToLogin = () => {
    navigate("/");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-xl p-6 w-96">
        <h2 className="text-xl font-bold mb-4 text-center">CareCircle - Sign Up</h2>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="border p-2 w-full mb-3 rounded"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="border p-2 w-full mb-3 rounded"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="border p-2 w-full mb-3 rounded"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            className="border p-2 w-full mb-3 rounded"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <select
            name="role"
            className="border p-2 w-full mb-3 rounded"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="Patient">Patient</option>
            <option value="Doctor">Doctor</option>
            <option value="Family">Family</option>
          </select>
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            className="border p-2 w-full mb-3 rounded"
            value={formData.phone}
            onChange={handleChange}
          />
          <input
            type="tel"
            name="emergencyContact"
            placeholder="Emergency Contact"
            className="border p-2 w-full mb-3 rounded"
            value={formData.emergencyContact}
            onChange={handleChange}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
          >
            Sign Up
          </button>
        </form>
        <button
          onClick={goToLogin}
          className="bg-green-500 text-white w-full py-2 rounded mt-3 hover:bg-green-600"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default Signup;