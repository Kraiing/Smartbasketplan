import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut 
} from 'firebase/auth';
import { auth } from '../firebase';

// สร้าง Context
const AuthContext = createContext();

// Hook สำหรับใช้งาน AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider สำหรับครอบ Component ที่ต้องการใช้งาน AuthContext
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ล็อกอินด้วยอีเมลและรหัสผ่าน
  const login = async (email, password) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error);
      setError(mapAuthErrorToMessage(error.code));
      throw error;
    }
  };

  // สมัครสมาชิกด้วยอีเมลและรหัสผ่าน
  const signup = async (email, password) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Signup error:", error);
      setError(mapAuthErrorToMessage(error.code));
      throw error;
    }
  };

  // ล็อกอินด้วย Google
  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Google login error:", error);
      setError(mapAuthErrorToMessage(error.code));
      throw error;
    }
  };

  // ล็อกอินด้วย Apple
  const loginWithApple = async () => {
    try {
      setError(null);
      const provider = new OAuthProvider('apple.com');
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Apple login error:", error);
      setError(mapAuthErrorToMessage(error.code));
      throw error;
    }
  };

  // ล็อกเอาท์
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      setError(mapAuthErrorToMessage(error.code));
      throw error;
    }
  };

  // แปลงรหัสข้อผิดพลาดให้เป็นข้อความภาษาไทย
  const mapAuthErrorToMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'รูปแบบอีเมลไม่ถูกต้อง';
      case 'auth/user-disabled':
        return 'บัญชีนี้ถูกระงับการใช้งาน';
      case 'auth/user-not-found':
        return 'ไม่พบบัญชีผู้ใช้นี้';
      case 'auth/wrong-password':
        return 'รหัสผ่านไม่ถูกต้อง';
      case 'auth/email-already-in-use':
        return 'อีเมลนี้ถูกใช้งานแล้ว';
      case 'auth/weak-password':
        return 'รหัสผ่านไม่ปลอดภัยเพียงพอ';
      case 'auth/popup-closed-by-user':
        return 'การล็อกอินถูกยกเลิก';
      case 'auth/cancelled-popup-request':
        return 'มีการร้องขอหน้าต่างล็อกอินซ้ำ';
      case 'auth/popup-blocked':
        return 'หน้าต่างล็อกอินถูกบล็อก';
      default:
        return 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
    }
  };

  // ติดตามการเปลี่ยนแปลงสถานะการล็อกอิน
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    
    // คืนค่าฟังก์ชันยกเลิกการติดตามเมื่อ component unmount
    return unsubscribe;
  }, []);

  // ค่าที่ส่งไปยัง Context
  const value = {
    currentUser,
    login,
    signup,
    loginWithGoogle,
    loginWithApple,
    logout,
    error,
    setError,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};