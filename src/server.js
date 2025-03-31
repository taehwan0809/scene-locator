const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const db = require('./db'); 
const cors = require('cors');
const gptApiHandler = require('./gptApiHandler');
const imageHandler = require('./imageHandler'); 

const app = express();
const port = 3000;
require('dotenv').config();
const gptApiKey = process.env.GPT_API_KEY;

// Multer 설정: 업로드된 파일을 'uploads/' 폴더에 저장
const upload = multer({ dest: 'uploads/' });

// 기본 라우트 설정
app.get('/', (req, res) => {
  res.send('드라마 촬영 장소 추측 웹 애플리케이션!');
});

// 파일 업로드 및 촬영 장소 추측
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;

    // 파일이 업로드되지 않으면 에러 반환
    if (!file) {
      return res.status(400).send('파일을 업로드해야 합니다.');
    }

    // 이미지 핸들러에서 디렉토리 확인 및 이미지 저장
    imageHandler.ensureUploadDirExists();
    const imagePath = imageHandler.saveImage(file);

    // GPT API 호출 준비 및 호출
    const locationData = await gptApiHandler.getLocationFromImage(imagePath);

    // GPT API 응답 처리 및 결과 반환
    const { drama_name, location, confidence_score } = locationData;

    // 데이터베이스에 저장
    db.insertLocation(drama_name, "장면 설명", location, confidence_score);

    // 처리 후 이미지 삭제
    imageHandler.deleteImage(imagePath);

    // 결과 반환
    res.json(locationData);
  } catch (error) {
    console.error('에러 발생:', error);
    res.status(500).send('서버 에러 발생');
  }
});

// express.static을 사용하여 public 폴더의 파일을 서빙
app.use(express.static('public'));

app.use(cors());

// 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
