const sqlite3 = require('sqlite3').verbose(); // SQLite3을 불러옵니다.
const path = require('path');

// 데이터베이스 파일 경로 지정
const dbPath = path.join(__dirname, 'locations.db'); // locations.db는 데이터베이스 파일의 이름입니다.
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('데이터베이스 연결 실패:', err.message);
  } else {
    console.log('데이터베이스 연결 성공');
  }
});

// 테이블 생성: 촬영 장소 정보 테이블
const createTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drama_name TEXT NOT NULL,
      scene_description TEXT,
      location TEXT,
      confidence_score REAL
    );
  `;
  
  db.run(sql, (err) => {
    if (err) {
      console.error('테이블 생성 실패:', err.message);
    } else {
      console.log('테이블 생성 성공');
    }
  });
};

// 데이터 삽입 함수
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

// 데이터 조회 함수: 예를 들어 특정 드라마의 장소를 조회하는 함수
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

// 테이블 생성 실행
createTable();

module.exports = { insertLocation, getLocationsByDrama };
