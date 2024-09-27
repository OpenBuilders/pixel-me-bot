//routes.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sharp = require("sharp");
const crypto = require("crypto");
const multer = require("multer");
const { uploadFile } = require("./doSpaceService");
const { uploadPixelatedFile } = require("./doSpaceService");

// Инициализация переменных и настроек
const BOT_TOKEN = process.env.BOT_TOKEN;

// Функция для валидации initData
function validateInitData(initData, botToken) {
  const params = initData.split("&");
  const data = {};
  for (const param of params) {
    const [key, value] = param.split("=");
    data[key] = decodeURIComponent(value);
  }

  const hash = data.hash;
  delete data.hash;

  const keys = Object.keys(data).sort();
  const dataCheckString = keys.map((key) => `${key}=${data[key]}`).join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return hmac === hash ? data : null;
}

// Главная страница
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Страница загрузки
router.get("/download", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "download.html"));
});

// Маршрут для загрузки фото профиля из CDN
router.get("/showProfilePhoto", async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "userId не указан." });
  }

  try {
    // Формируем URL для фото профиля пользователя
    const fileUrl = `https://cdn.joincommunity.xyz/api-clicker/tg/avatars/${userId}.jpg`;

    // Загружаем изображение напрямую с CDN
    const fileResponse = await axios.get(fileUrl, {
      responseType: "arraybuffer",
    });

    // Устанавливаем заголовок контента для изображения и отправляем данные клиенту
    res.set("Content-Type", "image/jpeg");
    res.send(fileResponse.data);
  } catch (error) {
    console.error(
      `Ошибка при получении фото профиля для userId ${userId}:`,
      error.message
    );
    res
      .status(404)
      .json({ success: false, message: "Фото профиля не найдено." });
  }
});

// Настройка multer для обработки файлов
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/uploadImage", upload.single("file"), async (req, res) => {
  const authHeader = req.headers.authorization;

  console.log("Запрос на загрузку изображения получен.");

  // Валидация авторизации
  if (!authHeader || !authHeader.startsWith("initData ")) {
    console.error("Ошибка: Отсутствует авторизация.");
    return res
      .status(401)
      .json({ success: false, message: "Отсутствует авторизация." });
  }

  console.log("Авторизация прошла успешно.");

  // Извлекаем initData и userId
  const initData = authHeader.split(" ")[1];
  const parsedInitData = JSON.parse(
    decodeURIComponent(
      initData
        .split("&")
        .find((param) => param.startsWith("user="))
        .split("=")[1]
    )
  );

  const userId = parsedInitData.id;
  console.log(`Извлечен userId: ${userId}`);

  const file = req.file;

  // Проверка наличия файла
  if (!file) {
    console.error("Ошибка: Файл не был загружен.");
    return res
      .status(400)
      .json({ success: false, message: "Файл не загружен." });
  }

  try {
    // Используем uploadPixelatedFile для загрузки файла
    console.log("Начинается загрузка файла в DigitalOcean Spaces...");
    const fileUrl = await uploadPixelatedFile(userId, file.buffer);
    console.log(`Файл успешно загружен в DigitalOcean Spaces. URL: ${fileUrl}`);

    // Возвращаем URL загруженного файла
    res.status(200).json({ success: true, fileUrl: fileUrl });
  } catch (error) {
    console.error("Ошибка при загрузке файла в DigitalOcean Spaces:", error);
    res
      .status(500)
      .json({ success: false, message: "Ошибка при загрузке файла." });
  }
});

module.exports = router;
