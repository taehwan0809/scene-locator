document.getElementById('upload-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData();
  const imageInput = document.getElementById('image');
  const imageFile = imageInput.files[0];

  
  if (!imageFile) {
    alert("이미지를 선택해주세요.");
    return;
  }
  
  // 이미지 미리보기
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

    // 주소를 좌표로 변환하고 지도에 표시
    await displayMap(result.location);
  } catch (error) {
    console.error('오류 발생:', error);
    alert('오류가 발생했습니다. 다시 시도해주세요.');
  }
});

// 지도 표시 함수 (지오코딩)
async function displayMap(address) {
  try {
    const GEOCODING_API_KEY = "AIzaSyBBpviVHUu1Yupsb4UeHTQruNQa5naxozY";
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
