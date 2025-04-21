import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { auth } from '../firebase';

const AnalyticsDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [featureUsage, setFeatureUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getAppSessions, getFeatureUsage } = useAnalytics();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const sessionsData = await getAppSessions();
        const usageData = await getFeatureUsage();
        
        setSessions(sessionsData);
        setFeatureUsage(usageData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // คำนวณสถิติการใช้งาน
  const calculateStats = () => {
    // จำนวนผู้ใช้งานทั้งหมด (นับตาม userId ที่ไม่ซ้ำกัน)
    const uniqueUsers = new Set(sessions.map(session => session.userId)).size;
    
    // จำนวนครั้งที่แอพถูกใช้งาน
    const totalSessions = sessions.length;
    
    // ฟีเจอร์ที่ถูกใช้งานบ่อยที่สุด
    const featureCounts = featureUsage.reduce((counts, item) => {
      const feature = item.featureName;
      counts[feature] = (counts[feature] || 0) + 1;
      return counts;
    }, {});
    
    // เรียงลำดับฟีเจอร์ตามความถี่
    const sortedFeatures = Object.entries(featureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // 5 อันดับแรก
      
    return {
      uniqueUsers,
      totalSessions,
      sortedFeatures
    };
  };
  
  const stats = calculateStats();
  
  return (
    <div className="analytics-dashboard">
      <h1>Analytics Dashboard</h1>
      
      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : (
        <div className="dashboard-content">
          <div className="stats-section">
            <div className="stat-card">
              <h3>ผู้ใช้งานทั้งหมด</h3>
              <p className="stat-value">{stats.uniqueUsers}</p>
            </div>
            
            <div className="stat-card">
              <h3>จำนวนครั้งที่ใช้งาน</h3>
              <p className="stat-value">{stats.totalSessions}</p>
            </div>
          </div>
          
          <div className="feature-usage">
            <h2>ฟีเจอร์ยอดนิยม</h2>
            <ul className="feature-list">
              {stats.sortedFeatures.map(([feature, count]) => (
                <li key={feature} className="feature-item">
                  <span className="feature-name">{feature}</span>
                  <span className="feature-count">{count} ครั้ง</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="recent-sessions">
            <h2>การใช้งานล่าสุด</h2>
            <ul className="session-list">
              {sessions.slice(0, 10).map((session) => (
                <li key={session.id} className="session-item">
                  <span className="user-id">ผู้ใช้: {session.userId}</span>
                  <span className="timestamp">
                    {session.startTime?.toDate()?.toLocaleString('th-TH') || 'ไม่ระบุเวลา'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;