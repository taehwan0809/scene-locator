// src/visionHandler.js
require('dotenv').config();
const vision = require('@google-cloud/vision');
const path = require('path');


// 클라이언트 생성 (환경 변수 GOOGLE_APPLICATION_CREDENTIALS를 설정하거나, API 키를 직접 전달하는 방법이 있음)
// API 키를 직접 전달하는 REST 방식은 클라이언트 라이브러리에서는 권장되지 않으므로, 보통은 서비스 계정 키 파일을 사용합니다.
const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, "..", "credentials", "service-account.json"), // 서비스 계정 키 파일의 경로
});

// 랜드마크 감지 함수
async function detectLandmarks(imagePath) {
  try {
    const [result] = await client.landmarkDetection(imagePath);
    const landmarks = result.landmarkAnnotations;
    if (landmarks && landmarks.length > 0) {
      // 첫 번째 감지된 랜드마크를 반환하거나, 원하는 방식으로 처리
      return {
        location: landmarks[0].description,
        confidence_score: landmarks[0].score,
      };
    } else {
      return { location: '알 수 없음', confidence_score: 0 };
    }
  } catch (error) {
    console.error('Vision API 호출 중 오류 발생:', error);
    throw new Error('Vision API 호출 실패');
  }
}

module.exports = { detectLandmarks };
