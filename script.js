// Simple Teachable Machine site loader
let model, maxPredictions, labelContainer, webcamEl, canvasEl, previewEl, predictionsEl, webcamStream;
const MODEL_URL = "./model/";
const MODEL_JSON = MODEL_URL + "model.json";
const METADATA_JSON = MODEL_URL + "metadata.json";

async function loadModel() {
  if (model) return model;
  try {
    model = await tmImage.load(MODEL_JSON, METADATA_JSON);
    maxPredictions = model.getTotalClasses();
    console.log("Model loaded. Classes:", maxPredictions);
    return model;
  } catch (err) {
    console.error("Failed to load model:", err);
    alert("Could not load the model files. Make sure 'model.json' and 'metadata.json' are in ./model/");
  }
}

function showPredictions(preds) {
  predictionsEl.innerHTML = "";
  preds
    .sort((a,b) => b.probability - a.probability)
    .forEach(p => {
      const li = document.createElement("li");
      li.textContent = `${p.className}: ${(p.probability * 100).toFixed(1)}%`;
      predictionsEl.appendChild(li);
    });
}

async function predictFromCanvas() {
  if (!model) await loadModel();
  const preds = await model.predict(canvasEl);
  showPredictions(preds);
}

async function drawImageToCanvas(imgOrVideo) {
  const ctx = canvasEl.getContext("2d");
  canvasEl.width = imgOrVideo.videoWidth || imgOrVideo.naturalWidth || 640;
  canvasEl.height = imgOrVideo.videoHeight || imgOrVideo.naturalHeight || 480;
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  ctx.drawImage(imgOrVideo, 0, 0, canvasEl.width, canvasEl.height);
}

async function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  previewEl.src = URL.createObjectURL(file);
  previewEl.onload = async () => {
    previewEl.style.display = "block";
    webcamEl.style.display = "none";
    await drawImageToCanvas(previewEl);
    canvasEl.style.display = "block";
    await loadModel();
    await predictFromCanvas();
  };
}

async function startWebcam() {
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    webcamEl.srcObject = webcamStream;
    webcamEl.style.display = "block";
    previewEl.style.display = "none";
    canvasEl.style.display = "block";
    await loadModel();
    // Animation loop
    const loop = async () => {
      if (!webcamStream) return;
      await drawImageToCanvas(webcamEl);
      await predictFromCanvas();
      requestAnimationFrame(loop);
    };
    loop();
  } catch (err) {
    console.error("Webcam error:", err);
    alert("Could not access the webcam. Try allowing camera permissions or use the file upload instead.");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  webcamEl = document.getElementById("webcam");
  previewEl = document.getElementById("preview");
  canvasEl = document.getElementById("canvas");
  predictionsEl = document.getElementById("predictions");

  document.getElementById("fileInput").addEventListener("change", handleFile);
  document.getElementById("webcamBtn").addEventListener("click", startWebcam);
});
