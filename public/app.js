import { setLocalesTexts, getLocalesTexts } from "./locales.js";

//app.js
Telegram.WebApp.ready();
window.Telegram.WebApp.expand();
window.Telegram.WebApp.disableVerticalSwipes();

const userId = Telegram.WebApp.initDataUnsafe.user.id;
// const firstName = Telegram.WebApp.initDataUnsafe.user.first_name || "User";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const pixelSizeInput = document.getElementById("pixel-size");
const pixelSizeValue = document.getElementById("pixel-size-value");
let imageLoaded = false;
let img = new Image();

const SCREENS = ["initial-screen", "loading-screen", "empty-screen"];

function setActiveScreen(activeScreen) {
  SCREENS.forEach((screen) => {
    document.querySelector(`.${screen}`).classList.remove("active-screen");
  });

  document.querySelector(`.${activeScreen}`).classList.add("active-screen");
}

// Предотвращаем перетаскивание и скроллинг
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

// Сохраняем фото в локальное хранилище
function savePhotoToLocal(photoBlob) {
  const reader = new FileReader();
  reader.onloadend = function () {
    localStorage.setItem("profilePhoto", reader.result); // Сохраняем фото в base64
  };
  reader.readAsDataURL(photoBlob);
}

// Загружаем фото из локального хранилища
function loadPhotoFromLocal() {
  const photoBase64 = localStorage.getItem("profilePhoto");
  if (photoBase64) {
    img.src = photoBase64;
    img.onload = () => {
      drawImageToCanvas(img);
    };
  } else {
    console.error("Фото профиля не найдено в локальном хранилище");
    return false; // Возвращаем false, если фото нет
  }
  return true; // Фото загружено успешно
}

// Загрузка изображения с сервера и сохранение в локальное хранилище
async function loadImageFromServer() {
  try {
    const response = await fetch(`/showProfilePhoto?userId=${userId}`);
    if (!response.ok) {
      throw new Error("Ошибка при получении фото профиля");
    }

    const blob = await response.blob();
    savePhotoToLocal(blob); // Сохраняем в локальное хранилище

    const url = URL.createObjectURL(blob);

    await new Promise((resolve) => {
      img.src = url;
      img.onload = () => {
        resolve();
      };
    });

    drawImageToCanvas(img);
  } catch (error) {
    console.error("Ошибка при получении фото профиля с сервера:", error);
    document.getElementById("profile-photo").innerText =
      "Произошла ошибка при получении фото профиля.";
  }
}

// Главная функция для загрузки фото профиля
async function loadProfilePhoto() {
  const isPhotoLoadedFromLocal = loadPhotoFromLocal();

  if (!isPhotoLoadedFromLocal) {
    console.log(
      "Фото не найдено в локальном хранилище, загружаем с сервера..."
    );
    await loadImageFromServer(); // Загружаем с сервера и сохраняем, если не найдено в локальном хранилище
  } else {
    console.log("Фото загружено из локального хранилища.");
  }
}

// Рисование изображения на канвасе
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

// Функция для получения насыщенности пикселя
function getSaturation(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min;
}

// Пикселизация изображения с сеткой
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

// Обработчик изменения размера пикселя
pixelSizeInput.addEventListener("input", () => {
  pixelSizeValue.textContent = pixelSizeInput.value;
  if (imageLoaded) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImageToCanvas(img);
    pixelateWithGrid();
  }
});

function handleUploadImage(event) {
  const file = event.target.files[0];
  if (file) {
    document
      .querySelector(".initial-screen_upload-button_icon-spinner")
      .classList.add("active-spinner");
    document
      .querySelector(".empty-screen_upload-button_icon-spinner")
      .classList.remove("active-spinner");
    const reader = new FileReader();
    reader.onload = function (e) {
      img.src = e.target.result;
      img.onload = () => {
        canvas.style.borderRadius = "0";
        drawImageToCanvas(img);
        pixelateWithGrid();
        setActiveScreen("initial-screen");
        document
          .querySelector(".initial-screen_upload-button_icon-spinner")
          .classList.remove("active-spinner");
        document
          .querySelector(".empty-screen_upload-button_icon-spinner")
          .classList.remove("active-spinner");
      };
    };
    reader.readAsDataURL(file);
  }
}

// Обработка загрузки изображения вручную
document
  .getElementById("empty-uploader")
  .addEventListener("change", (event) => {
    handleUploadImage(event);
  });
document
  .getElementById("initial-uploader")
  .addEventListener("change", (event) => {
    handleUploadImage(event);
  });

function shareStory() {
  const webApp = window.Telegram.WebApp;
  if (webApp.version < "7.8") {
    return null;
  }

  webApp.shareToStory(img, {
    text: getLocalesTexts().storyMessage,
    widget_link: {
      url: "https://t.me/notpixel_me_bot",
      name: getLocalesTexts().storyLinkText,
    },
  });
}
const initData = Telegram.WebApp.initData;
// const initDataUnsafe = Telegram.WebApp.initDataUnsafe || {};

// Отправка изображения на сервер
async function uploadImageToServer() {
  const canvas = document.getElementById("canvas");
  const val = { text: "image-name" };

  // Преобразуем содержимое canvas в Blob (файл)
  canvas.toBlob(async (blob) => {
    if (!blob) {
      alert("Ошибка при создании изображения.");
      return;
    }

    // Создаем FormData для отправки файла на сервер
    const formData = new FormData();
    formData.append("file", blob, `${val.text}.jpg`); // Параметр 'file', так как сервер ожидает 'file'

    try {
      // Отправляем изображение на сервер
      const response = await fetch("/uploadImage", {
        method: "POST",
        headers: {
          Authorization: `initData ${initData}`,
        },
        body: formData, // Отправляем файл с помощью FormData
      });

      // Обработка ответа от сервера
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log("Изображение успешно загружено на сервер:", data.fileUrl);
          Telegram.WebApp.openLink(data.fileUrl); // Открываем ссылку на изображение через Telegram.WebApp
        } else {
          console.error("Ошибка при загрузке изображения:", data.message);
          alert("Ошибка: " + data.message);
        }
      } else {
        console.error("Ошибка при загрузке изображения:", response.statusText);
        alert("Ошибка: " + response.statusText);
      }
    } catch (error) {
      console.error("Ошибка при отправке изображения:", error);
      alert("Ошибка при отправке изображения.");
    }
  }, "image/jpeg");
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

// Обработка нажатия на кнопку отправки
document
  .getElementById("save-button")
  .addEventListener("click", uploadImageToServer);

document.getElementById("share-button").addEventListener("click", shareStory);

async function main() {
  try {
    setLocalesTexts();
    setActiveScreen("loading-screen");
    await loadProfilePhoto();
    setActiveScreen("initial-screen");
  } catch (error) {
    setActiveScreen("empty-screen");
  }
}

await main();
