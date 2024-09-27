const LOCALES = {
  ru: {
    loadingScreenText: "Мгновение, аватарка превращается в пиксели",
    emptyScreenText: "Хм, аватарка не нашлась, но можно загрузить",
    emptyScreenUploadButtonText: "Загрузить тогда",
    initialScreentUploadButtonText: "Загрузить другую",
    rangeLabel: "Насколько пиксельно",
    saveButtonDefault: "Сохранить для себя",
    saveButtonSuccess: "Готово, ищите в чат-боте",
    saveButtonLoading: "Сохраняем...",
    saveButtonWaiting: "Необходимо немного подождать ❤️",
    saveButtonError: "Ошибка, попробуйте ещё раз",
    shareButton: "Пошерить в сторис",
    storyMessage: "Пикселизируй свое изображение!",
    storyLinkText: "Играй @NotPixel в Ноткоин",
    downloadTitle: "Картинка скачивается",
    downloadDescription: "Но если нет, можете её поторопить",
    downloadButton: "Давай, картинка!",
  },
  en: {
    loadingScreenText: "Just a moment, the pic is turning into pixels",
    emptyScreenText: "Hmm, no pic found, but you can upload one",
    emptyScreenUploadButtonText: "Upload then",
    initialScreentUploadButtonText: "Upload another one",
    rangeLabel: "How pixelated you want it",
    saveButtonDefault: "Save for myself",
    saveButtonSuccess: "Done, check the chat-bot",
    saveButtonLoading: "Saving...",
    saveButtonWaiting: "Need to wait for a while ❤️",
    saveButtonError: "Error, try again later",
    shareButton: "Share in my stories",
    storyMessage: "🏴 Pixel Season is ON! @notpixel",
    storyLinkText: "Ready for Pixel Season? 🏴 @notpixel",
    downloadTitle: "Pic is downloading",
    downloadDescription: "But if no, you can hurry it up",
    downloadButton: "Go, pic, go!",
  },
};

const loadingScreenText = document.querySelector(".loading-screen_text");
const emptyScreenText = document.querySelector(".empty-screen_text");
const emptyScreenUploadButtonText = document.querySelector(
  ".empty-screen_upload-button_text"
);
const initialScreentUploadButtonText = document.querySelector(
  ".initial-screen_upload-button_text"
);
const rangeLabel = document.querySelector(".initial-screen_range-text");
const shareButton = document.querySelector("#share-button");
const saveButton = document.querySelector("#save-button");

const locale = navigator.language.split("-")[0] || "en";
const appLanguage = LOCALES[locale] || LOCALES.en;

export const setLocalesTexts = () => {
  loadingScreenText.innerHTML = appLanguage.loadingScreenText;
  emptyScreenText.innerHTML = appLanguage.emptyScreenText;
  emptyScreenUploadButtonText.innerHTML =
    appLanguage.emptyScreenUploadButtonText;
  initialScreentUploadButtonText.innerHTML =
    appLanguage.initialScreentUploadButtonText;
  rangeLabel.innerHTML = appLanguage.rangeLabel;
  shareButton.innerHTML = appLanguage.shareButton;
  saveButton.innerHTML = appLanguage.saveButtonDefault;
};

export const getLocalesTexts = () => appLanguage;

export const setDownloadPageLocales = () => {
  document.querySelector(".download-screen_title").innerHTML =
    appLanguage.downloadTitle;
  document.querySelector(".download-screen_text").innerHTML =
    appLanguage.downloadDescription;
  document.querySelector(".download-screen_download-button").innerHTML =
    appLanguage.downloadButton;
};
