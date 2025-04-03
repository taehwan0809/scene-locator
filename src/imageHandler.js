// imageHandler.js
const fs = require('fs');
const path = require('path');

// 업로드된 파일이 저장되는 폴더 경로
const uploadDir = path.join(__dirname, 'uploads');

/**
 * 업로드된 이미지 파일을 지정된 폴더에 저장하는 함수
 * @param {Object} file - 업로드된 파일 객체 (Multer에서 제공)
 * @returns {string} - 저장된 파일의 경로
 */
function saveImage(file) {
  const ext = path.extname(file.originalname);  // 원본 파일명에서 확장자 추출
  const newFilename = file.filename + ext; 
  const targetPath = path.join(uploadDir, newFilename);
  fs.renameSync(file.path, targetPath);
  return '/uploads/' + newFilename;
}

/**
 * 파일 경로에 해당하는 이미지를 삭제하는 함수
 * @param {string} imagePath - 삭제할 이미지의 경로
 */
function deleteImage(imagePath) {
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);  // 파일 삭제
  }
}

/**
 * 파일이 저장된 폴더에 대한 확인 및 폴더 생성 함수
 */
function ensureUploadDirExists() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);  // 'uploads' 폴더가 없으면 생성
  }
}

// 모듈화
module.exports = {
  saveImage,
  deleteImage,
  ensureUploadDirExists,
};
