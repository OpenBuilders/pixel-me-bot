import { setDownloadPageLocales, getLocalesTexts } from "./locales.js";

function setImage() {
  const urlParams = new URLSearchParams(window.location.search);
  const imgSrc = urlParams.get("src");

  const img = document.querySelector(".download-screen_image");

  if (imgSrc) {
    img.setAttribute("src", imgSrc);
  }
}

async function downloadImage() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const imgSrc = urlParams.get("src");
    const response = await fetch(imgSrc, { cache: "no-cache" });
    const blob = await response.blob();

    const reader = new FileReader();
    reader.onload = function () {
      const link = document.createElement("a");
      link.href = reader.result;
      link.download = `pixi_avatar_${new Date().getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    };
    reader.readAsDataURL(blob);
  } catch (error) {
    console.error("Error downloading image:", error);
  }
}

async function downloadImage0() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const imgSrc = urlParams.get("src");
    const image = await fetch(imgSrc);
    const imageBlog = await image.blob();
    const imageURL = URL.createObjectURL(imageBlog);

    const link = document.createElement("a");
    link.href = imageURL;
    link.download = `notpixi_avatar_${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading image:");
  }
}

async function main() {
  setDownloadPageLocales();
  setImage();
  await downloadImage();
}

document
  .querySelector(".download-screen_download-button")
  .addEventListener("click", async () => await downloadImage());

main();
