import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";

export const useAnalytics = () => {
  // บันทึกการเริ่มต้นใช้งานแอพ
  const logAppSession = async (userId = 'anonymous') => {
    try {
      await addDoc(collection(db, "app_sessions"), {
        userId,
        startTime: serverTimestamp(),
        platform: navigator.platform,
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error("Error logging app session:", error);
    }
  };

  // บันทึกการใช้งานฟีเจอร์
  const logFeatureUsage = async (userId = 'anonymous', featureName, details = {}) => {
    try {
      await addDoc(collection(db, "feature_usage"), {
        userId,
        featureName,
        details,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error logging feature usage:", error);
    }
  };

  // ดึงข้อมูลการใช้งานแอพทั้งหมด
  const getAppSessions = async (limitCount = 100) => {
    try {
      const sessionsQuery = query(
        collection(db, "app_sessions"),
        orderBy("startTime", "desc"),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(sessionsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error fetching app sessions:", error);
      return [];
    }
  };

  // ดึงข้อมูลการใช้งานฟีเจอร์
  const getFeatureUsage = async (limitCount = 100) => {
    try {
      const usageQuery = query(
        collection(db, "feature_usage"),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(usageQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error fetching feature usage:", error);
      return [];
    }
  };

  return { 
    logAppSession, 
    logFeatureUsage, 
    getAppSessions, 
    getFeatureUsage 
  };
};