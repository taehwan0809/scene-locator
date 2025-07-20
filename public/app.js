// [1] Google Maps API 스크립트 동적 로드 함수
async function loadGoogleMapsScript(callback) {
  try {
    const res = await fetch("http://localhost:3000/api/google-maps-key");
    const data = await res.json();
    const key = data.key;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = callback; // 콜백 함수 연결
    document.head.appendChild(script);
  } catch (err) {
    console.error("Google Maps API 키 로드 실패", err);
  }
}

// [2] 지도 표시 함수
async function displayMap(address) {
  try {
    const keyRes = await fetch("http://localhost:3000/api/google-maps-key");
    const { key: GEOCODING_API_KEY } = await keyRes.json();

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GEOCODING_API_KEY}`;
    const geoResponse = await fetch(geocodeUrl);
    const geoData = await geoResponse.json();

    if (geoData.status !== "OK" || geoData.results.length === 0) {
      throw new Error("지오코딩 결과 없음");
    }

    const location = geoData.results[0].geometry.location;

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

// [3] 사진 업로드 및 결과 처리
document.getElementById('upload-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const imageInput = document.getElementById('image');
  const imageFile = imageInput.files[0];

  if (!imageFile) {
    alert("이미지를 선택해주세요.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    document.getElementById('preview-image').src = e.target.result;
    document.getElementById('preview-container').style.display = 'block';
  };
  reader.readAsDataURL(imageFile);

  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('서버 오류');
    }

    const result = await response.json();
    console.log('서버 응답:', result);

    document.getElementById('result').style.display = 'block';
    document.getElementById('location').textContent = `촬영 장소: ${result.location}`;
    document.getElementById('confidence').textContent = `신뢰도: ${result.confidence_score}`;
    document.getElementById('posts-section').style.display = 'block';
    document.getElementById('post-location').value = result.location;

    // 📌 지도 로드 → displayMap 실행
    await loadGoogleMapsScript(() => displayMap(result.location));

    loadPosts(result.location);
  } catch (error) {
    console.error('오류 발생:', error);
    alert('오류가 발생했습니다. 다시 시도해주세요.');
  }
});

// [4] 게시글 등록
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('post-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const fileInput = document.getElementById('post-imageFile');
    const locationInput = document.getElementById('post-location');
    const descriptionInput = document.getElementById('post-description');
    const formData = new FormData(document.getElementById('post-form'));

    if (!fileInput.files[0]) {
      alert("인증샷 이미지를 선택해주세요!");
      return;
    }

    if (!locationInput.value.trim()) {
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
      fileInput.value = "";
      descriptionInput.value = "";
      loadPosts(locationInput.value.trim());
    } catch (error) {
      console.error('게시글 등록 오류:', error);
      alert('게시글 등록에 실패했습니다.');
    }
  });
});

// [5] 특정 장소의 게시글 불러오기
async function loadPosts(location) {
  try {
    const response = await fetch(`http://localhost:3000/posts?location=${encodeURIComponent(location)}`);
    const data = await response.json();
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = "";

    if (data.posts?.length) {
      data.posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post-item');
        postDiv.innerHTML = `
          <strong>장소:</strong> ${post.location}<br>
          <strong>내용:</strong> ${post.description}<br>
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

// [6] 게시글 삭제
async function deletePost(postId, location) {
  try {
    const response = await fetch(`http://localhost:3000/posts/${postId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    alert(result.message || "게시글이 삭제되었습니다.");
    loadPosts(location);
    loadAllPosts();
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    alert('게시글 삭제에 실패했습니다.');
  }
}

// [7] 전체 게시글 불러오기
document.addEventListener('DOMContentLoaded', () => {
  loadAllPosts();
});

async function loadAllPosts() {
  try {
    const response = await fetch('http://localhost:3000/postsAll');
    const data = await response.json();
    const allPostsContainer = document.getElementById('all-posts-container');
    allPostsContainer.innerHTML = "";

    if (data.posts?.length) {
      data.posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post-item');
        postDiv.innerHTML = `
          <strong>장소:</strong> ${post.location}<br>
          <strong>내용:</strong> ${post.description}<br>
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



