import React  from "react";
import "../index.css";

import Image from "../assets/image.png";
import Logo from "../assets/logo.png";

import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useState } from "react";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-main">

      {/* ✅ LEFT: FORM */}
      <div className="login-right">
        <div className="login-right-container">

          {/* Logo */}
          <div className="login-logo">
            <img src={Logo} alt="Kassapos Logo" />
          </div>

          {/* Form */}
          <div className="login-center">
            <h2>Welcome Back</h2>
            <p>Sign in to your account</p>

            <form>
              <div className="input-group">
                <span className="input-icon">✉</span>
                <input type="email" placeholder="Email address" />
              </div>

              <div className="pass-input-div input-group">
                <span className="input-icon">🔑</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                />
                {showPassword
                  ? <FaEyeSlash onClick={() => setShowPassword(!showPassword)} />
                  : <FaEye onClick={() => setShowPassword(!showPassword)} />
                }
              </div>

              {/* Only ONE button */}
              <div className="login-center-buttons">
                <button type="button"
                 
                 >Log In →</button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* ✅ RIGHT: IMAGE */}
      <div className="login-left">
        <div className="login-left-overlay">

          <div className="login-left-brand">
            <div className="left-logo-ring">
              <span className="left-logo-letter">K</span>
            </div>
            <h1 className="left-brand-title">Kassapos</h1>
            <p className="left-brand-sub">Billing Solutions Platform</p>
          </div>

          <img
            src={Image}
            alt="Kassapos Illustration"
            className="login-hero-img"
          />

          <div className="left-floating-card left-card-1">
            <span className="lfc-icon">📦</span>
            <div>
              <div className="lfc-title">10,000+</div>
              <div className="lfc-sub">Invoices Generated</div>
            </div>
          </div>

          <div className="left-floating-card left-card-2">
            <span className="lfc-icon">🔒</span>
            <div>
              <div className="lfc-title">256-bit</div>
              <div className="lfc-sub">Encrypted & Secure</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Login;