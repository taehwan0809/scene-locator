// src/server.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const cors = require('cors');
const imageHandler = require('./imageHandler');
const visionHandler = require('./visionHandler');  // 새로 추가한 Vision API 모듈

const app = express();
const port = 3000;
require('dotenv').config();

// Multer 설정
const upload = multer({ dest: 'uploads/' });

// 폴더 생성 (이미 존재하지 않으면)
imageHandler.ensureUploadDirExists();

app.use(cors({
  origin:'http://localhost:5500'
}));

const staticPath = path.join(__dirname, "..", "public");
console.log("Static directory:", staticPath);
app.use(express.static(path.join(__dirname, "..", "public")));


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

// 파일 업로드 및 촬영 장소 추측 (Vision API 사용)
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).send('파일을 업로드해야 합니다.');
    }
    console.log('업로드된 파일:', req.file);

    // 이미지 저장 처리
    const imagePath = imageHandler.saveImage(file);

    // Vision API를 통해 랜드마크 감지 호출
    const landmarkData = await visionHandler.detectLandmarks(imagePath);
    console.log('랜드마크 감지 결과:', landmarkData);

    // 데이터베이스에 저장 (원하는 대로 사용)
    db.insertLocation("드라마 이름", "장면 설명", landmarkData.location, landmarkData.confidence_score);

    // 처리 후 이미지 삭제
    imageHandler.deleteImage(imagePath);

    
    // 결과 반환
    res.json(landmarkData);
  } catch (error) {
    console.error('서버 에러 발생:', error);
    res.status(500).send('서버 에러 발생');
  }
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
