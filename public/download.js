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
    const image = await fetch(imgSrc);
    const imageBlog = await image.blob();
    const imageURL = URL.createObjectURL(imageBlog);

    const link = document.createElement("a");
    link.href = imageURL;
    link.download = "Pixi image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    document.querySelector(".download-screen_download-button").disabled = true;
    document.querySelector(".download-screen_download-button").innerHTML =
      getLocalesTexts().downloadButtonDone;
    document
      .querySelector(".download-screen_download-button")
      .classList.add("success");
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
