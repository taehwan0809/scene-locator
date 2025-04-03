const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// DB 파일 경로 (src 폴더 내에 locations.db)
const dbPath = path.join(__dirname, 'locations.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 실패:', err.message);
  } else {
    console.log('데이터베이스 연결 성공');
  }
});

// 테이블 생성 함수: locations와 posts 테이블 생성
const createTables = () => {
  // 촬영 장소 정보 테이블 (locations)
  const sqlLocations = `
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drama_name TEXT NOT NULL,
      scene_description TEXT,
      location TEXT,
      confidence_score REAL
    );
  `;
  db.run(sqlLocations, (err) => {
    if (err) {
      console.error('locations 테이블 생성 실패:', err.message);
    } else {
      console.log('locations 테이블 생성 성공');
    }
  });

  // 게시글 테이블 (posts)
  const sqlPosts = `
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location TEXT,
      imageUrl TEXT,
      description TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  db.run(sqlPosts, (err) => {
    if (err) {
      console.error('posts 테이블 생성 실패:', err.message);
    } else {
      console.log('posts 테이블 생성 성공');
    }
  });
};

// 테이블 생성 실행
createTables();

// locations 테이블에 데이터 삽입 함수
const insertLocation = (dramaName, sceneDescription, location, confidenceScore) => {
  const sql = `
    INSERT INTO locations (drama_name, scene_description, location, confidence_score)
    VALUES (?, ?, ?, ?);
  `;
  db.run(sql, [dramaName, sceneDescription, location, confidenceScore], function(err) {
    if (err) {
      console.error('데이터 삽입 실패:', err.message);
    } else {
      console.log(`새로운 촬영 장소 정보 삽입됨. ID: ${this.lastID}`);
    }
  });
};

// locations 테이블에서 특정 드라마의 장소 조회 함수
const getLocationsByDrama = (dramaName, callback) => {
  const sql = `SELECT * FROM locations WHERE drama_name = ?`;
  db.all(sql, [dramaName], (err, rows) => {
    if (err) {
      console.error('데이터 조회 실패:', err.message);
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
};

// posts 테이블에 게시글 삽입 함수
function insertPost(location, imageUrl, description) {
  const stmt = db.prepare("INSERT INTO posts (location, imageUrl, description) VALUES (?, ?, ?)");
  stmt.run(location, imageUrl, description, function(err) {
    if (err) {
      console.error("게시글 삽입 실패:", err.message);
    } else {
      console.log(`게시글 삽입됨. ID: ${this.lastID}`);
    }
  });
  stmt.finalize();
}

// 특정 장소의 게시글 조회 함수
function getPostsByLocation(location, callback) {
  const sql = "SELECT * FROM posts WHERE location = ? ORDER BY createdAt DESC";
  db.all(sql, [location], (err, rows) => {
    if (err) {
      console.error("게시글 조회 오류:", err);
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

module.exports = {
  insertLocation,
  getLocationsByDrama,
  insertPost,
  getPostsByLocation,
};
