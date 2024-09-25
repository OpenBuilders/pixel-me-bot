const fs = require('fs');
const path = require('path');
const app = require('./server');
const crypto = require('crypto');
const initializeBot = require('./botSingleton'); 
const bot = initializeBot(); // Получаем единственный экземпляр бота
const axios = require('axios');
const { uploadOriginalFile } = require('./doSpaceService');
const BOT_TOKEN = process.env.BOT_TOKEN;

// Botik - обработка команды /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    try {
        console.log(`Обработка команды /start для пользователя ${chatId}`);

        // Получаем фото профиля пользователя
        const userProfilePhotos = await bot.getUserProfilePhotos(chatId, { limit: 1 });

        if (userProfilePhotos.photos.length > 0) {
            // Получаем файл последнего фото профиля
            const fileId = userProfilePhotos.photos[0][0].file_id;

            // Запрашиваем путь к файлу через Telegram API
            const filePathResponse = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getFile`, {
                params: { file_id: fileId }
            });

            const filePath = filePathResponse.data.result.file_path;

            // Получаем изображение по file_path
            const fileResponse = await axios.get(`https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`, {
                responseType: 'arraybuffer'
            });

            const fileBuffer = Buffer.from(fileResponse.data, 'binary');

            // Сохраняем оригинальное фото профиля
            console.log('Сохранение фото профиля пользователя...');
            const fileUrl = await uploadOriginalFile(chatId, {
                buffer: fileBuffer,
                mimetype: 'image/jpeg',
                originalname: `${chatId}.jpg`, // Устанавливаем имя файла
            });

            console.log(`Фото профиля пользователя ${chatId} успешно сохранено. URL: ${fileUrl}`);
        } else {
            console.log(`Пользователь ${chatId} не имеет фото профиля.`);
        }

        // Отправляем сообщение с кнопкой "Start App"
        console.log('Отправка сообщения с кнопкой "Start App"...');
        await bot.sendMessage(chatId, 'Hello, friend! Head over to the miniapp and create your pixel avatar.', {
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: 'Start App',
                        web_app: { url: 'https://tugita.online' }
                    }]
                ]
            }
        });

        console.log('Сообщение с кнопкой "Start App" успешно отправлено.');
    } catch (error) {
        console.error('Ошибка при обработке команды /start:', error);
        await bot.sendMessage(chatId, 'Произошла ошибка при обработке вашего запроса.');
    }
});

module.exports = bot;

