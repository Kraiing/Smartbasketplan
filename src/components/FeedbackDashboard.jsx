import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";

const FeedbackDashboard = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, new, in-progress, resolved

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      
      try {
        const feedbackQuery = query(
          collection(db, "feedback"),
          orderBy("timestamp", "desc")
        );
        
        const snapshot = await getDocs(feedbackQuery);
        const feedbackData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // แปลงเวลาเป็นวัตถุ Date
          timestamp: doc.data().timestamp?.toDate()
        }));
        
        setFeedback(feedbackData);
        setError(null);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        setError("ไม่สามารถโหลดข้อเสนอแนะได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeedback();
  }, []);

  const updateFeedbackStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "feedback", id), {
        status: newStatus
      });
      
      // อัปเดตสถานะในตัวแปร feedback
      setFeedback(prev => 
        prev.map(item => 
          item.id === id ? {...item, status: newStatus} : item
        )
      );
    } catch (error) {
      console.error("Error updating feedback status:", error);
      alert("ไม่สามารถอัปเดตสถานะได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // กรองข้อเสนอแนะตามสถานะ
  const filteredFeedback = filter === 'all' 
    ? feedback 
    : feedback.filter(item => item.status === filter);

  return (
    <div className="feedback-dashboard">
      <h1>ข้อเสนอแนะทั้งหมด</h1>
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="filter-controls">
        <span>กรองตามสถานะ: </span>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            ทั้งหมด
          </button>
          <button 
            className={filter === 'new' ? 'active' : ''} 
            onClick={() => setFilter('new')}
          >
            ใหม่
          </button>
          <button 
            className={filter === 'in-progress' ? 'active' : ''} 
            onClick={() => setFilter('in-progress')}
          >
            กำลังดำเนินการ
          </button>
          <button 
            className={filter === 'resolved' ? 'active' : ''} 
            onClick={() => setFilter('resolved')}
          >
            เสร็จสิ้น
          </button>
        </div>
      </div>
      
      {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
      ) : filteredFeedback.length === 0 ? (
        <p>ไม่พบข้อเสนอแนะ</p>
      ) : (
        <div className="feedback-list">
          {filteredFeedback.map((item) => (
            <div key={item.id} className={`feedback-item status-${item.status}`}>
              <div className="feedback-header">
                <div className="user-info">
                  <span className="email">{item.userEmail || 'ไม่ระบุอีเมล'}</span>
                  <span className="date">
                    {item.timestamp ? item.timestamp.toLocaleString('th-TH') : 'ไม่ระบุเวลา'}
                  </span>
                </div>
                <div className="feedback-meta">
                  <span className={`category category-${item.category}`}>
                    {item.category === 'general' && 'ทั่วไป'}
                    {item.category === 'bug' && 'แจ้งปัญหา'}
                    {item.category === 'feature' && 'ขอฟีเจอร์'}
                    {item.category === 'improvement' && 'ข้อเสนอแนะ'}
                  </span>
                  <span className="rating">คะแนน: {item.rating}/5</span>
                </div>
              </div>
              
              <div className="feedback-content">
                {item.feedback}
              </div>
              
              <div className="feedback-actions">
                <div className="status-badge">
                  สถานะ: 
                  <span className={`status status-${item.status}`}>
                    {item.status === 'new' && 'ใหม่'}
                    {item.status === 'in-progress' && 'กำลังดำเนินการ'}
                    {item.status === 'resolved' && 'เสร็จสิ้น'}
                  </span>
                </div>
                
                <div className="status-buttons">
                  <button 
                    onClick={() => updateFeedbackStatus(item.id, 'new')}
                    disabled={item.status === 'new'}
                  >
                    ตั้งเป็นใหม่
                  </button>
                  <button 
                    onClick={() => updateFeedbackStatus(item.id, 'in-progress')}
                    disabled={item.status === 'in-progress'}
                  >
                    กำลังดำเนินการ
                  </button>
                  <button 
                    onClick={() => updateFeedbackStatus(item.id, 'resolved')}
                    disabled={item.status === 'resolved'}
                  >
                    เสร็จสิ้น
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackDashboard;