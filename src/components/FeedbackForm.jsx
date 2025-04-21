import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import { translations } from '../i18n/translations'; // นำเข้า translations

const FeedbackForm = ({ language = 'th' }) => { // รับค่าภาษาจาก props
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // ใช้ translations ตามภาษาที่ได้รับ
  const t = translations[language] || translations.th;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!feedback.trim()) {
      setError('กรุณากรอกข้อเสนอแนะ');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const user = auth.currentUser;

      await addDoc(collection(db, "feedback"), {
        userId: user ? user.uid : 'anonymous',
        userEmail: user ? user.email : 'ไม่ระบุ',
        rating,
        feedback,
        category,
        timestamp: serverTimestamp(),
        status: 'new'
      });

      setSubmitted(true);
      setFeedback('');
      setRating(5);
      setCategory('general');
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setError('เกิดข้อผิดพลาดในการส่งข้อเสนอแนะ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewFeedback = () => {
    setSubmitted(false);
    setError(null);
  };

  if (submitted) {
    return (
      <div className="feedback-success bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg shadow-md max-w-md mx-auto mt-10 text-center">
        <div className="bg-white p-8 rounded-lg shadow-inner">
          <div className="text-5xl mb-4">🏀</div>
          <h2 className="text-2xl font-bold text-orange-600 mb-4">{t.feedbackThankYou || 'ขอบคุณสำหรับข้อเสนอแนะ!'}</h2>
          <p className="text-gray-700 mb-6">{t.feedbackReceived || 'เราได้รับข้อเสนอแนะของคุณเรียบร้อยแล้ว และจะนำไปพัฒนาแอปให้ดียิ่งขึ้น'}</p>
          <div className="flex flex-col space-y-3">
            <button onClick={handleNewFeedback} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-full transition-all">
              {t.sendMoreFeedback || 'ส่งข้อเสนอแนะเพิ่มเติม'}
            </button>
            <button onClick={() => navigate('/')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-full transition-all">
              {t.backToHome || 'กลับสู่หน้าหลัก'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-form-container bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg shadow-md max-w-md mx-auto mt-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-orange-600">{t.sendFeedback || 'ส่งข้อเสนอแนะ'}</h2>
        <div className="text-3xl">🏀</div>
      </div>

      {/* แสดงข้อความ error ถ้ามี */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="feedback-form space-y-5">
        <div className="form-group">
          <label htmlFor="category" className="block text-gray-700 font-medium mb-2">{t.category || 'หมวดหมู่'}:</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={submitting}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
          >
            <option value="general">{t.categoryGeneral || 'ทั่วไป'}</option>
            <option value="bug">{t.categoryBug || 'แจ้งปัญหา'}</option>
            <option value="feature">{t.categoryFeature || 'ขอฟีเจอร์เพิ่มเติม'}</option>
            <option value="improvement">{t.categoryImprovement || 'ข้อเสนอแนะเพื่อปรับปรุง'}</option>
          </select>
        </div>

        {/* ส่วนอื่นๆ ของฟอร์ม */}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-1/3 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-full focus:outline-none transition-all"
            disabled={submitting}
          >
            {t.back || 'กลับ'}
          </button>

          <button
            type="submit"
            className="w-2/3 py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 transition-all"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.sending || 'กำลังส่ง...'}
              </span>
            ) : t.sendFeedback || 'ส่งข้อเสนอแนะ'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
