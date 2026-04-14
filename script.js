const keys = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
let lastTimestamp = null;

function getRandomKey() {
  return keys[Math.floor(Math.random() * keys.length)];
}

function targetRandomKey() {
  const key = document.getElementById(getRandomKey());
  key.classList.add("selected");
}

document.addEventListener("keyup", event => {
  const keyPressed = event.key.toUpperCase();
  const keyElement = document.getElementById(keyPressed);
  const highlightedKey = document.querySelector(".selected");

  if (keyElement) {
    keyElement.classList.add("hit");
    keyElement.addEventListener("animationend", () => keyElement.classList.remove("hit"), { once: true });
  }

  if (highlightedKey && keyPressed === highlightedKey.id) {
    const now = Date.now();
    if (lastTimestamp !== null) {
      const cpm = Math.round(60000 / (now - lastTimestamp));
      document.getElementById("cpm-value").textContent = cpm;
    }
    lastTimestamp = now;
    highlightedKey.classList.remove("selected");
    targetRandomKey();
  }
});

targetRandomKey();
