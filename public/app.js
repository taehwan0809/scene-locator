// [1] 사진 업로드 및 결과 표시
document.getElementById('upload-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData();
  const imageInput = document.getElementById('image');
  const imageFile = imageInput.files[0];

  if (!imageFile) {
    alert("이미지를 선택해주세요.");
    return;
  }

  // 이미지 미리보기 설정
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById('preview-image').src = e.target.result;
    document.getElementById('preview-container').style.display = 'block';
  };
  reader.readAsDataURL(imageFile);
  
  formData.append('image', imageFile);

  try {
    // 서버로 이미지 전송
    const response = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('서버 오류');
    }

    const result = await response.json();
    console.log('서버 응답:', result);

    // 결과 표시
    document.getElementById('result').style.display = 'block';
    document.getElementById('location').textContent = `촬영 장소: ${result.location}`;
    document.getElementById('confidence').textContent = `신뢰도: ${result.confidence_score}`;

    // 지도 표시
    await displayMap(result.location);

    // 게시글 영역 표시 및 게시글 폼의 장소 필드에 결과값 자동 입력
    document.getElementById('posts-section').style.display = 'block';
    document.getElementById('post-location').value = result.location;
  
    // 게시글 목록 새로고침 (해당 장소 게시글 조회)
    loadPosts(result.location);
  } catch (error) {
    console.error('오류 발생:', error);
    alert('오류가 발생했습니다. 다시 시도해주세요.');
  }
});

// 지도 표시 함수 (지오코딩)
async function displayMap(address) {
  try {
    const GEOCODING_API_KEY = "AIzaSyBBpviVHUu1Yupsb4UeHTQruNQa5naxozY"; // 실제 키로 교체
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GEOCODING_API_KEY}`;

    const geoResponse = await fetch(geocodeUrl);
    const geoData = await geoResponse.json();

    if (geoData.status !== "OK" || geoData.results.length === 0) {
      throw new Error("지오코딩 결과 없음");
    }

    const location = geoData.results[0].geometry.location; // { lat, lng }

    const map = new google.maps.Map(document.getElementById("map"), {
      center: location,
      zoom: 15,
    });

    new google.maps.Marker({
      position: location,
      map: map,
      title: address,
    });
  } catch (error) {
    console.error("지도 표시 중 오류 발생:", error);
  }
}

// [2] 게시글 등록 기능 (DOMContentLoaded 내부)
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('post-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const fileInput = document.getElementById('post-imageFile');
    if (!fileInput.files[0]) {
      alert("인증샷 이미지를 선택해주세요!");
      return;
    }
    
    const locationInput = document.getElementById('post-location');
    const descriptionInput = document.getElementById('post-description');
    const postForm = document.getElementById('post-form');

    // FormData 객체 생성 (폼 내 모든 요소 자동 수집)
    const formData = new FormData(postForm);

    const locationValue = locationInput.value.trim();
    if (!locationValue) {
      alert("장소 정보가 없습니다. 사진 업로드 후 게시글을 작성해주세요.");
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/posts', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      alert(result.message || "게시글이 등록되었습니다.");
      
      // 폼 초기화
      fileInput.value = "";
      descriptionInput.value = "";
      
      // 게시글 목록 새로고침
      loadPosts(locationValue);
    } catch (error) {
      console.error('게시글 등록 오류:', error);
      alert('게시글 등록에 실패했습니다.');
    }
  });
});

// [3] 특정 장소의 게시글을 불러오는 함수
async function loadPosts(location) {
  try {
    const response = await fetch(`http://localhost:3000/posts?location=${encodeURIComponent(location)}`);
    const data = await response.json();
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = "";

    if (data.posts && data.posts.length > 0) {
      data.posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post-item');

        postDiv.innerHTML = `
          <strong>장소:</strong> ${post.location}<br>
          <strong>내용:</strong> ${post.description}<br>
          <strong>인증샷:</strong><br>
          <img src="${post.imageUrl}" alt="게시글 이미지" style="max-width: 100%; border-radius: 4px;">
          <br><small>${post.createdAt}</small>
          <br><button onclick="deletePost(${post.id}, '${post.location}')">삭제</button>
        `;
        postsContainer.appendChild(postDiv);
      });
    } else {
      postsContainer.innerHTML = "<p>등록된 게시글이 없습니다.</p>";
    }
  } catch (error) {
    console.error('게시글 불러오기 오류:', error);
  }
}

// 게시글 삭제 함수 (전역에서 호출 가능하도록)
async function deletePost(postId, location) {
  try {
    const response = await fetch(`http://localhost:3000/posts/${postId}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    alert(result.message || "게시글이 삭제되었습니다.");
    loadPosts(location);
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    alert('게시글 삭제에 실패했습니다.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
// [4] 전체 게시글 불러오는 함수
async function loadAllPosts() {
  try {
    const response = await fetch('http://localhost:3000/postsAll');
    const data = await response.json();
    const allPostsContainer = document.getElementById('all-posts-container');
    allPostsContainer.innerHTML = "";

    if (data.posts && data.posts.length > 0) {
      data.posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post-item');

        postDiv.innerHTML = `
          <strong>장소:</strong> ${post.location}<br>
          <strong>내용:</strong> ${post.description}<br>
          <strong>인증샷:</strong><br>
          <img src="${post.imageUrl}" alt="게시글 이미지"><br>
          <small>${post.createdAt}</small>
          <br><button onclick="deletePost(${post.id}, '${post.location}')">삭제</button>
        `;
        allPostsContainer.appendChild(postDiv);
      });
    } else {
      allPostsContainer.innerHTML = "<p>등록된 게시글이 없습니다.</p>";
    }
  } catch (error) {
    console.error('전체 게시글 불러오기 오류:', error);
  }
}
loadAllPosts();
});

async function deletePost(postId, location) {
  try {
    const response = await fetch(`http://localhost:3000/posts/${postId}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    alert(result.message || "게시글이 삭제되었습니다.");
    // 삭제 후, 전체 게시글과 해당 장소 게시글 새로고침
    loadAllPosts();
    loadPosts(location);
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    alert('게시글 삭제에 실패했습니다.');
  }
}

// [4] 전체 게시글 조회 엔드포인트
app.get('/postsAll', (req, res) => {
  db.getAllPosts((err, rows) => {
    if (err) {
      return res.status(500).json({ error: "전체 게시글 조회에 실패했습니다." });
    }
    res.json({ posts: rows });
  });
});