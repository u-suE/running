const map = L.map("map").setView([36.57, 140.64], 16);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const distanceEl = document.getElementById("distance");
const timeEl = document.getElementById("time");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");

let watchId = null;
let timerId = null;
let startTime = null;
let elapsedSeconds = 0;
let totalDistance = 0;

let positions = [];
let currentMarker = null;
let pathLine = null;

function updateTimeDisplay() {
  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");
  timeEl.textContent = `${minutes}:${seconds}`;
}

function updateDistanceDisplay() {
  distanceEl.textContent = (totalDistance / 1000).toFixed(2);
}

function showStatus(text) {
  statusEl.textContent = text;
}

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  return map.distance([lat1, lng1], [lat2, lng2]);
}

function updatePath() {
  if (pathLine) {
    map.removeLayer(pathLine);
  }

  if (positions.length >= 2) {
    pathLine = L.polyline(positions, {
      weight: 5
    }).addTo(map);
  }
}

function updateCurrentMarker(lat, lng) {
  if (currentMarker) {
    map.removeLayer(currentMarker);
  }

  currentMarker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup("現在地");
}

function handlePosition(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const newPoint = [lat, lng];

  if (positions.length > 0) {
    const lastPoint = positions[positions.length - 1];
    const moved = getDistanceMeters(lastPoint[0], lastPoint[1], lat, lng);

    // GPSぶれ対策: 5m未満は無視
    if (moved < 5) {
      return;
    }

    totalDistance += moved;
    updateDistanceDisplay();
  }

  positions.push(newPoint);
  updatePath();
  updateCurrentMarker(lat, lng);
  map.setView([lat, lng], 17);
}

function handlePositionError(error) {
  console.error("位置情報エラー:", error);

  let message = "位置情報を取得できませんでした";
  if (error.code === 1) {
    message = "位置情報の利用が拒否されました";
  } else if (error.code === 2) {
    message = "位置情報を取得できませんでした";
  } else if (error.code === 3) {
    message = "位置情報の取得がタイムアウトしました";
  }

  alert(message);
  showStatus("取得失敗");
}

function startRun() {
  if (!navigator.geolocation) {
    alert("このブラウザは位置情報に対応していません");
    return;
  }

  if (watchId !== null) {
    return;
  }

  showStatus("記録中");

  if (startTime === null) {
    startTime = Date.now() - elapsedSeconds * 1000;
  }

  timerId = setInterval(() => {
    elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    updateTimeDisplay();
  }, 1000);

  watchId = navigator.geolocation.watchPosition(
    handlePosition,
    handlePositionError,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

function stopRun() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }

  showStatus("停止中");
}

function resetRun() {
  stopRun();

  elapsedSeconds = 0;
  totalDistance = 0;
  startTime = null;
  positions = [];

  updateTimeDisplay();
  updateDistanceDisplay();
  showStatus("待機中");

  if (currentMarker) {
    map.removeLayer(currentMarker);
    currentMarker = null;
  }

  if (pathLine) {
    map.removeLayer(pathLine);
    pathLine = null;
  }
}

startBtn.addEventListener("click", startRun);
stopBtn.addEventListener("click", stopRun);
resetBtn.addEventListener("click", resetRun);

updateTimeDisplay();
updateDistanceDisplay();