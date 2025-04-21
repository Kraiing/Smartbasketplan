import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const { currentUser, logout } = useAuth();
  const [name, setName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // อัปเดตชื่อผู้ใช้
      if (name !== currentUser?.displayName) {
        await updateProfile(currentUser, { displayName: name });
      }

      // อัปเดตอีเมล
      if (email !== currentUser?.email) {
        await updateEmail(currentUser, email);
      }

      // อัปเดตรหัสผ่าน
      if (password) {
        await updatePassword(currentUser, password);
      }

      setMessage('อัปเดตโปรไฟล์เรียบร้อยแล้ว');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error("Update profile error:", error);
      setError('เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // การนำทางหลังล็อกเอาท์จะถูกจัดการโดย PrivateRoute
    } catch (error) {
      console.error("Logout error:", error);
      setError('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  // สร้างตัวอักษรแรกจากชื่อผู้ใช้
  const getInitials = () => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  }

  // กำหนดสีพื้นหลังสำหรับตัวอักษร
  const getRandomColor = () => {
    // สีส้มโทนต่างๆ
    const colors = ['#f97316', '#ea580c', '#c2410c', '#9a3412'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // ตรวจสอบว่า currentUser มีอยู่จริงก่อนการเข้าถึงข้อมูล
  if (!currentUser) {
    return (
      <div className="profile-container bg-gradient-to-r from-orange-50 to-orange-100 min-h-screen py-8 px-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-6 text-center">
          <p>กรุณาเข้าสู่ระบบก่อนเข้าถึงหน้าโปรไฟล์</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            ไปยังหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  // ตรวจสอบว่า providerData มีอยู่และไม่ว่างเปล่า
  const providerId = currentUser.providerData?.[0]?.providerId || 'unknown';
  const isPasswordAuth = providerId === 'password';

  return (
    <div className="profile-container bg-gradient-to-r from-orange-50 to-orange-100 min-h-screen py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* ส่วนหัวของโปรไฟล์ */}
        <div className="relative">
          {/* แถบส้มด้านบน */}
          <div className="h-32 bg-gradient-to-r from-orange-400 to-orange-500"></div>

          {/* ปุ่มย้อนกลับ */}
          <button
            onClick={handleBackToHome}
            className="absolute top-4 left-4 bg-white text-orange-500 hover:bg-orange-50 p-2 rounded-full shadow-md transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* อวตาร */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 top-32">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-3xl font-bold"
                style={{ backgroundColor: getRandomColor() }}
              >
                {getInitials()}
              </div>
            )}
          </div>
        </div>

        {/* ข้อมูลผู้ใช้ */}
        <div className="pt-16 px-6 text-center">
          <h2 className="text-xl font-bold text-gray-800">{name || 'ไม่ระบุชื่อ'}</h2>
          <p className="text-gray-500">{email}</p>
          <p className="text-sm text-gray-400 mt-1">
            เข้าสู่ระบบด้วย: {isPasswordAuth ? 'อีเมลและรหัสผ่าน' : 'Google'}
          </p>
        </div>

        {/* ข้อความแจ้งเตือน */}
        {error && (
          <div className="mx-6 mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="mx-6 mt-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
            <p>{message}</p>
          </div>
        )}

        {/* ฟอร์มแก้ไขโปรไฟล์ */}
        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">ชื่อ</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="ชื่อของคุณ"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">อีเมล</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="อีเมลของคุณ"
              disabled={loading || !isPasswordAuth}
            />
            {!isPasswordAuth && (
              <p className="text-xs text-gray-500 mt-1">
                ไม่สามารถเปลี่ยนอีเมลได้เนื่องจากคุณเข้าสู่ระบบด้วย Google
              </p>
            )}
          </div>

          {isPasswordAuth && (
            <>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">รหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="รหัสผ่านใหม่"
                  disabled={loading}
                />
              </div>

              {password && (
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="ยืนยันรหัสผ่านใหม่"
                    disabled={loading}
                  />
                </div>
              )}
            </>
          )}

          <div className="pt-4 flex flex-col space-y-3">
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
              disabled={loading}
            >
              {loading ? 'กำลังอัพเดต...' : 'อัพเดตโปรไฟล์'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              disabled={loading}
            >
              ออกจากระบบ
            </button>
          </div>
        </form>

        {/* ข้อมูลเพิ่มเติม */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">ข้อมูลบัญชี</h3>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>
              <span className="inline-block w-32 font-medium">วันที่สร้างบัญชี:</span>
              {currentUser.metadata?.creationTime && new Date(currentUser.metadata.creationTime).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </li>
            <li>
              <span className="inline-block w-32 font-medium">เข้าสู่ระบบครั้งล่าสุด:</span>
              {currentUser.metadata?.lastSignInTime && new Date(currentUser.metadata.lastSignInTime).toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
