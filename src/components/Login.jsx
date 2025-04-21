// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // true = login, false = signup
  const [name, setName] = useState('');
  const { login, signup, loginWithGoogle, error, setError } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // เคลียร์ error เมื่อเปลี่ยนโหมด
  useEffect(() => {
    setError('');
  }, [isLogin, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    
    if (!isLogin && !name) {
      setError('กรุณากรอกชื่อผู้ใช้');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      if (isLogin) {
        // เข้าสู่ระบบ
        await login(email, password);
        navigate('/');
      } else {
        // สมัครสมาชิก
        await signup(email, password, name);
        navigate('/');
      }
    } catch (error) {
      console.error("Auth error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      console.error("Google login error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-100 to-orange-300 p-4">
      <div className="w-full max-w-md">
        {/* โลโก้และชื่อแอป */}
        <div className="text-center mb-8">
          <div className="inline-block text-5xl mb-2">🏀</div>
          <h1 className="text-3xl font-bold text-orange-700">SmartBasketPlan</h1>
          <p className="text-gray-600">กระดานกลยุทธ์บาสเกตบอลอัจฉริยะ</p>
        </div>
        
        {/* ฟอร์มล็อกอิน */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* แถบเลือกโหมด */}
          <div className="flex bg-gray-100 border-b">
            <button 
              className={`flex-1 py-3 font-medium ${isLogin ? 'bg-white text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setIsLogin(true)}
            >
              เข้าสู่ระบบ
            </button>
            <button 
              className={`flex-1 py-3 font-medium ${!isLogin ? 'bg-white text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setIsLogin(false)}
            >
              สมัครสมาชิก
            </button>
          </div>
          
          {/* ข้อความแสดงข้อผิดพลาด */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 text-sm">
              <p>{error}</p>
            </div>
          )}
          
          {/* ฟอร์ม */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* ชื่อผู้ใช้ (แสดงเฉพาะโหมดสมัครสมาชิก) */}
            {!isLogin && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">
                  ชื่อผู้ใช้
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="ชื่อผู้ใช้ของคุณ"
                  disabled={loading}
                />
              </div>
            )}
            
            {/* อีเมล */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="อีเมลของคุณ"
                disabled={loading}
                required
              />
            </div>
            
            {/* รหัสผ่าน */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-700 text-sm font-medium" htmlFor="password">
                  รหัสผ่าน
                </label>
                
                {isLogin && (
                  <Link to="/forgot-password" className="text-sm text-orange-600 hover:text-orange-800">
                    ลืมรหัสผ่าน?
                  </Link>
                )}
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="รหัสผ่านของคุณ"
                disabled={loading}
                required
              />
            </div>
            
            {/* ปุ่มส่งฟอร์ม */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition duration-200 ease-in-out transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังดำเนินการ...
                </span>
              ) : (
                isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'
              )}
            </button>
          </form>
          
          {/* ตัวเลือกล็อกอินด้วย Google */}
          <div className="px-6 pb-6">
            <div className="relative flex items-center my-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-sm">หรือ</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-md py-2 px-4 text-gray-700 hover:bg-gray-50 transition duration-200 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                />
              </svg>
              ดำเนินการต่อด้วย Google
            </button>
          </div>
        </div>
        
        {/* ข้อความช่วยเหลือด้านล่าง */}
        <div className="text-center mt-6 text-gray-600">
          <p>มีปัญหาในการเข้าสู่ระบบ? <a href="mailto:support@smartbasketplan.com" className="text-orange-600 hover:text-orange-800">ติดต่อฝ่ายสนับสนุน</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;