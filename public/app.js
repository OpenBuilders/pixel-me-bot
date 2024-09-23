import { getLocaleText, initAppText } from "./locales.js";

Telegram.WebApp.ready();
window.Telegram.WebApp.expand();
window.Telegram.WebApp.disableVerticalSwipes();

const BOT_URL = "";

const userId = Telegram.WebApp.initDataUnsafe.user.id;
const firstName = Telegram.WebApp.initDataUnsafe.user.first_name || "User";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const pixelSizeInput = document.getElementById("pixel-size");
const pixelSizeValue = document.getElementById("pixel-size-value");
let imageLoaded = false;
let img = new Image();

const SCREENS = ["initial-screen", "loading-screen", "empty-screen"];

function handleUploadButton(loading) {
  if (loading) {
    document.querySelector(
      ".initial-screen_upload-button_icon-spinner"
    ).style.opacity = 1;
    document.querySelector(
      ".initial-screen_upload-button_icon-spinner"
    ).style.visibility = "visible";
    document.querySelector(".initial-screen_upload-button").disabled = true;
    document.querySelector(
      ".empty-screen_upload-button_icon-spinner"
    ).style.opacity = 1;
    document.querySelector(
      ".empty-screen_upload-button_icon-spinner"
    ).style.visibility = "visible";
    document.querySelector(".empty-screen_upload-button").disabled = true;
  } else {
    document.querySelector(
      ".initial-screen_upload-button_icon-spinner"
    ).style.opacity = 0;
    document.querySelector(
      ".initial-screen_upload-button_icon-spinner"
    ).style.visibility = "hidden";
    document.querySelector(".initial-screen_upload-button").disabled = false;
    document.querySelector(
      ".empty-screen_upload-button_icon-spinner"
    ).style.opacity = 0;
    document.querySelector(
      ".empty-screen_upload-button_icon-spinner"
    ).style.visibility = "hidden";
    document.querySelector(".empty-screen_upload-button").disabled = false;
  }
}

function setActiveScreen(activeScreen) {
  SCREENS.forEach((screen) => {
    document.querySelector(`.${screen}`).classList.remove("active-screen");
  });

  document.querySelector(`.${activeScreen}`).classList.add("active-screen");
}

function preventDefaultTouch(event) {
  event.preventDefault();
}

canvas.addEventListener("touchstart", preventDefaultTouch, { passive: false });
canvas.addEventListener("touchmove", preventDefaultTouch, { passive: false });

document.addEventListener(
  "scroll",
  function () {
    window.scrollTo(0, 0);
  },
  { passive: false }
);

function savePhotoToLocal(photoBlob) {
  const reader = new FileReader();
  reader.onloadend = function () {
    localStorage.setItem("profilePhoto", reader.result);
  };
  reader.readAsDataURL(photoBlob);
}

function loadPhotoFromLocal() {
  const photoBase64 = localStorage.getItem("profilePhoto");
  if (photoBase64) {
    img.src = photoBase64;
    img.onload = () => {
      drawImageToCanvas(img);
      pixelateWithGrid();
    };
  } else {
    console.error("Фото профиля не найдено в локальном хранилище");
  }
}

async function saveProfilePhoto() {
  try {
    const response = await fetch(`/sendProfilePhoto?userId=${userId}`);
    const data = await response.json();

    if (data.success) {
      console.log("Фото профиля успешно сохранено на сервере:", data.filePath);
      return true;
    } else {
      console.error("Ошибка при сохранении фото профиля:", data.message);
      return false;
    }
  } catch (error) {
    console.error("Ошибка при запросе сохранения фото профиля:", error);
    return false;
  }
}

async function loadImage() {
  try {
    const response = await fetch(`/showProfilePhoto?userId=${userId}`);
    if (!response.ok) {
      throw new Error("Ошибка при получении фото профиля");
    }

    const blob = await response.blob();
    savePhotoToLocal(blob);

    const url = URL.createObjectURL(blob);

    await new Promise((resolve) => {
      img.src = url;
      img.onload = () => {
        resolve();
      };
    });

    drawImageToCanvas(img);
    pixelateWithGrid();
  } catch (error) {
    console.error("Ошибка при получении фото профиля:", error);
    document.getElementById("profile-photo").innerText =
      "Произошла ошибка при получении фото профиля.";
  }
}

async function handleProfilePhoto() {
  let visitCount = localStorage.getItem("visitCount");

  if (!visitCount) {
    console.log("Первый заход, загружаем фото с сервера...");
    const isProfilePhotoSaved = await saveProfilePhoto();
    if (isProfilePhotoSaved) {
      await loadImage();
    }
    localStorage.setItem("visitCount", 1);
  } else {
    visitCount = parseInt(visitCount, 10);

    if (visitCount >= 20) {
      console.log("20-й заход, обновляем фото...");
      const isProfilePhotoSaved = await saveProfilePhoto();
      if (isProfilePhotoSaved) {
        await loadImage();
      }
      localStorage.setItem("visitCount", 1);
    } else {
      console.log(`Заход номер: ${visitCount + 1}`);
      loadPhotoFromLocal();
      localStorage.setItem("visitCount", visitCount + 1);
    }
  }
}

function drawImageToCanvas(image) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const imageRatio = image.width / image.height;
  const maxWidth = window.innerWidth - 40;
  const maxHeight = window.innerHeight * 0.8;

  let canvasWidth, canvasHeight;

  if (imageRatio > 1) {
    canvasWidth = Math.min(maxWidth, image.width);
    canvasHeight = canvasWidth / imageRatio;
  } else {
    canvasHeight = Math.min(maxHeight, image.height);
    canvasWidth = canvasHeight * imageRatio;
  }

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  imageLoaded = true;
}

function getSaturation(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min;
}

function pixelateWithGrid() {
  if (!imageLoaded) return;

  const pixelSize = parseInt(pixelSizeInput.value, 10);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      if (x < canvas.width - 1 && y < canvas.height - 1) {
        const neighborIndex = ((y + 1) * canvas.width + (x + 1)) * 4;
        const neighborR = data[neighborIndex];
        const neighborG = data[neighborIndex + 1];
        const neighborB = data[neighborIndex + 2];

        const currentSaturation = getSaturation(r, g, b);
        const neighborSaturation = getSaturation(
          neighborR,
          neighborG,
          neighborB
        );

        if (Math.abs(currentSaturation - neighborSaturation) > 50) {
          const maxR = Math.max(r, neighborR);
          const maxG = Math.max(g, neighborG);
          const maxB = Math.max(b, neighborB);

          data[index] = maxR;
          data[index + 1] = maxG;
          data[index + 2] = maxB;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  for (let y = 0; y < canvas.height; y += pixelSize) {
    for (let x = 0; x < canvas.width; x += pixelSize) {
      const index = (y * canvas.width + x) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];

      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }
}

pixelSizeInput.addEventListener("input", () => {
  pixelSizeValue.textContent = pixelSizeInput.value;
  if (imageLoaded) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImageToCanvas(img);
    pixelateWithGrid();
  }
});

function uploadImage(event) {
  const file = event.target.files[0];
  if (file) {
    handleUploadButton(true);
    const reader = new FileReader();
    reader.onload = function (e) {
      img.src = e.target.result;
      img.onload = () => {
        canvas.style.borderRadius = "0";
        drawImageToCanvas(img);
        pixelateWithGrid();
        setActiveScreen("initial-screen");
        handleUploadButton(false);
      };
    };
    reader.readAsDataURL(file);
  }
}

document
  .getElementById("empty-uploader")
  .addEventListener("change", (event) => {
    uploadImage(event);
  });
document
  .getElementById("initial-uploader")
  .addEventListener("change", (event) => {
    uploadImage(event);
  });

const initData = Telegram.WebApp.initData;
const initDataUnsafe = Telegram.WebApp.initDataUnsafe || {};

async function sendImageToServer() {
  const button = document.getElementById("save-button");

  button.disabled = true;
  button.textContent = getLocaleText().saveButtonLoading;

  try {
    const image = canvas.toDataURL("image/jpeg");

    const response = await fetch("/sendProcessedImage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `initData ${initData}`,
      },
      body: JSON.stringify({
        image: image,
      }),
    });

    const data = await response.json();

    if (data.message === "Изображение отправлено!") {
      button.textContent = getLocaleText().saveButtonSuccess;
      setTimeout(() => {
        window.location.href = `https://t.me/Pixinotbot`;
        Telegram.WebApp.close();
      }, 1000);
    } else if (data.message && data.remainingTime) {
      button.innerHTML = getLocaleText().saveButtonWaiting;
      button.disabled = true;

      setTimeout(() => {
        button.textContent = "Get";
        button.disabled = false;
      }, data.remainingTime * 60 * 1000);
    }
  } catch (error) {
    console.error("Ошибка при отправке изображения:", error);
    button.textContent = getLocaleText().saveButtonError;
    button.disabled = false;
  }
}

function shareStory() {
  const webApp = window.Telegram.WebApp;
  if (webApp.version < "7.8") {
    return null;
  }

  webApp.shareToStory(img, {
    text: getLocaleText().storyMessage,
    widget_link: {
      url: BOT_URL,
      name: getLocaleText().storyLinkText,
    },
  });
}

document.getElementById("save-button").addEventListener("click", () => {
  sendImageToServer();
});

document.getElementById("share-button").addEventListener("click", shareStory);

async function main() {
  initAppText();
  setActiveScreen("loading-screen");
  await handleProfilePhoto();
  if (!imageLoaded) {
    setActiveScreen("empty-screen");
  } else {
    setActiveScreen("initial-screen");
  }
}

main();

// (async function () {

// })();
