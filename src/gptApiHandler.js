// gptApiHandler.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// GPT API URL과 API 키를 환경 변수로 불러옵니다.
const gptApiUrl = 'https://api.openai.com/v1/chat/completions';
const gptApiKey = process.env.GPT_API_KEY;

/**
 * 이미지를 GPT API에 전송하여 촬영 장소를 추측하는 함수
 * @param {string} imagePath - 업로드된 이미지의 경로
 * @returns {Promise<Object>} - API 응답 객체
 */
async function getLocationFromImage(imagePath) {
  try {
    // FormData 객체 생성
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));

    // GPT API 호출
    const response = await axios.post(gptApiUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${gptApiKey}`,
      },
    });

    // 응답 데이터 반환
    return response.data;  // 예: 촬영 장소와 신뢰도 정보
  } catch (error) {
    console.error('GPT API 호출 중 에러 발생:', error);
    throw new Error('GPT API 호출 실패');
  }
}

module.exports = {
  getLocationFromImage,
};
