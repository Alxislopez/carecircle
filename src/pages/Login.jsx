import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Patient");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        if (data.user.role === "Doctor") navigate("/doctor-dashboard");
        else if (data.user.role === "Family") navigate("/family-dashboard");
        else navigate("/patient-dashboard");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const goToSignup = () => {
    navigate("/signup");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-xl p-6 w-80">
        <h2 className="text-xl font-bold mb-4 text-center">CareCircle - Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="border p-2 w-full mb-3 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-2 w-full mb-3 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select
            className="border p-2 w-full mb-4 rounded"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="Patient">Patient</option>
            <option value="Doctor">Doctor</option>
            <option value="Family">Family</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
        <button
          onClick={goToSignup}
          className="bg-green-500 text-white w-full py-2 rounded mt-3 hover:bg-green-600"
        >
          Go to Sign Up
        </button>
      </div>
    </div>
  );
};

export default Login;
