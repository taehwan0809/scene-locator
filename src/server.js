// src/server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const cors = require('cors');
const imageHandler = require('./imageHandler');
const visionHandler = require('./visionHandler');  // Vision API


const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const port = 3000;

// JSON 파싱 (Vision API 업로드 외의 텍스트 데이터 받을 때 필요)
// 하지만 게시글 등록 시에는 FormData로 파일+텍스트를 함께 받을 예정이므로,
// express.json() 대신 multer를 통해 multipart/form-data를 처리할 예정
// app.use(express.json());

// Multer 설정
// - /upload 경로(장면 업로드)는 기존대로 upload.single('image') 사용
// - /posts 경로(게시글 등록)도 별도의 미들웨어를 사용
const upload = multer({ dest: 'uploads/' });

// uploads 폴더 없으면 생성
imageHandler.ensureUploadDirExists();

app.use(cors({
  origin: 'http://localhost:5500'
}));

const staticPath = path.join(__dirname, "..", "public");
app.use(express.static(staticPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

// [1] 장면 업로드 + Vision API
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send('파일을 업로드해야 합니다.');

    const imagePath = imageHandler.saveImage(file);
    const landmarkData = await visionHandler.detectLandmarks("./src/"+ imagePath);

    db.insertLocation("드라마 이름", "장면 설명", landmarkData.location, landmarkData.confidence_score);
    imageHandler.deleteImage(imagePath); // Vision API 후 임시 파일 삭제

    res.json(landmarkData);
  } catch (error) {
    console.error('서버 에러 발생:', error);
    res.status(500).send('서버 에러 발생');
  }
});

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


// [2] 게시글 등록: 파일 + 텍스트 FormData로 받음
//    postImage: 업로드할 게시글 이미지 파일
//    location, description: 텍스트 데이터
const postUpload = multer({ dest: 'uploads/' }); // 게시글 이미지용 multer
app.post('/posts', postUpload.single('postImage'), (req, res) => {
  try {
    // text 필드
    const location = req.body.location;
    const description = req.body.description || "";

    // 파일 필드
    const file = req.file; // single('postImage')로 받음
    if (!location || !file) {
      return res.status(400).json({ error: "location과 postImage(파일)는 필수입니다." });
    }

    // 파일을 서버에 저장 (원본은 multer가 임시 저장)
    const savedPath = imageHandler.saveImage(file);

    // DB에 게시글 삽입 (imageUrl에 savedPath 저장)
    db.insertPost(location, savedPath, description);

    // 클라이언트에 성공 메시지
    res.status(201).json({ message: "게시글이 등록되었습니다." });
  } catch (error) {
    console.error("게시글 등록 오류:", error);
    res.status(500).json({ error: "게시글 등록에 실패했습니다." });
  }
});

// [3] 특정 장소 게시글 조회
app.get('/posts', (req, res) => {
  const { location } = req.query;
  if (!location) {
    return res.status(400).json({ error: "location 쿼리 파라미터가 필요합니다." });
  }
  db.getPostsByLocation(location, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "게시글 조회에 실패했습니다." });
    }
    res.json({ posts: rows });
  });
});

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
