const LINKS = {
  appleMusic: {
    web: "https://music.apple.com/us/album/graduation/1451901307",
    scheme: "music://music.apple.com/us/album/graduation/1451901307",
    androidIntent: "intent://music.apple.com/us/album/graduation/1451901307#Intent;scheme=https;package=com.apple.android.music;end",
  },
  spotify: {
    web: "https://open.spotify.com/album/4SZko61aMnmgvNhfhgTuD3",
    scheme: "spotify:album:4SZko61aMnmgvNhfhgTuD3",
    androidIntent: "intent://album/4SZko61aMnmgvNhfhgTuD3#Intent;scheme=spotify;package=com.spotify.music;end",
  },
};

const mainScreen = document.querySelector("#mainScreen");
const textContent = document.querySelector("#textContent");
const buttonPanel = document.querySelector("#buttonPanel");
const appleMusicButton = document.querySelector("#appleMusicButton");
const spotifyButton = document.querySelector("#spotifyButton");
const appleMusicWebLink = document.querySelector("#appleMusicWebLink");
const spotifyWebLink = document.querySelector("#spotifyWebLink");

let sequenceStopped = false;

function fitGraduateNames() {
  document.querySelectorAll(".graduate-name").forEach((title) => {
    const words = Array.from(title.querySelectorAll("span"));
    const availableWidth = title.clientWidth;

    if (!availableWidth || words.length === 0) {
      return;
    }

    title.style.removeProperty("--name-size");

    const computedSize = Number.parseFloat(window.getComputedStyle(title).fontSize);
    const minimumSize = 28;
    let nextSize = computedSize;

    while (
      nextSize > minimumSize &&
      words.some((word) => word.scrollWidth > availableWidth + 1)
    ) {
      nextSize -= 1;
      title.style.setProperty("--name-size", `${nextSize}px`);
    }
  });
}

function getPreviewMode() {
  return new URLSearchParams(window.location.search).get("preview");
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function getDeviceType() {
  const userAgent = navigator.userAgent || navigator.vendor || "";
  const platform = navigator.platform || "";
  const hasTouchMac = platform === "MacIntel" && navigator.maxTouchPoints > 1;

  if (/iPad|iPhone|iPod/.test(userAgent) || hasTouchMac) {
    return "ios";
  }

  if (/Android/i.test(userAgent)) {
    return "android";
  }

  return "desktop";
}

function getAppleMusicAppLink() {
  const deviceType = getDeviceType();

  if (deviceType === "android") {
    return LINKS.appleMusic.androidIntent;
  }

  return LINKS.appleMusic.scheme;
}

function getSpotifyAppLink() {
  const deviceType = getDeviceType();

  if (deviceType === "android") {
    return LINKS.spotify.androidIntent;
  }

  return LINKS.spotify.scheme;
}

function resetReveal() {
  mainScreen.classList.remove("is-hidden");
  textContent.classList.remove("is-visible");
  buttonPanel.classList.remove("is-visible");
  window.requestAnimationFrame(fitGraduateNames);
}

function showText() {
  textContent.classList.add("is-visible");
  window.requestAnimationFrame(fitGraduateNames);
}

function showButtons() {
  buttonPanel.classList.add("is-visible");
}

function tryOpenApp(url, timeout) {
  let appOpened = false;

  return new Promise((resolve) => {
    let timeoutId;
    let settled = false;

    const cleanup = () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleAppOpenSignal);
      window.removeEventListener("pagehide", handleAppOpenSignal);
      window.clearTimeout(timeoutId);
    };

    const finish = (opened) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(opened);
    };

    const handleAppOpenSignal = () => {
      appOpened = true;
      sequenceStopped = true;
      finish(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleAppOpenSignal();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleAppOpenSignal);
    window.addEventListener("pagehide", handleAppOpenSignal);

    timeoutId = window.setTimeout(() => {
      finish(appOpened);
    }, timeout);

    try {
      window.location.href = url;
    } catch (error) {
      appOpened = false;
    }
  });
}

async function startAutoSequence() {
  sequenceStopped = false;
  resetReveal();

  await startRevealSequence();
  if (document.hidden) {
    return;
  }

  await startAppAttempts();
  if (!document.hidden) {
    showButtons();
  }
}

async function startAppAttempts() {
  tryOpenApp(getSpotifyAppLink(), 1000);
  await wait(1000);

  if (document.hidden) {
    return;
  }

  await tryOpenApp(getAppleMusicAppLink(), 1600);
}

async function startRevealSequence() {
  showText();
  await wait(1000);

  await wait(2000);
}

async function openAppleMusicAppFirst() {
  const opened = await tryOpenApp(getAppleMusicAppLink(), 1600);

  if (!opened && !document.hidden) {
    window.location.href = LINKS.appleMusic.web;
  }
}

async function openSpotifyAppFirst() {
  const opened = await tryOpenApp(getSpotifyAppLink(), 1600);

  if (!opened && !document.hidden) {
    window.location.href = LINKS.spotify.web;
  }
}

appleMusicButton.addEventListener("click", openAppleMusicAppFirst);
spotifyButton.addEventListener("click", openSpotifyAppFirst);
appleMusicWebLink.href = LINKS.appleMusic.web;
spotifyWebLink.href = LINKS.spotify.web;

window.addEventListener("resize", fitGraduateNames);
window.addEventListener("orientationchange", fitGraduateNames);
window.addEventListener("DOMContentLoaded", () => {
  fitGraduateNames();

  if (document.fonts) {
    document.fonts.ready.then(fitGraduateNames);
  }

  if (getPreviewMode() === "buttons" || getPreviewMode() === "fallback") {
    resetReveal();
    showText();
    showButtons();
    return;
  }

  if (getPreviewMode() === "text") {
    resetReveal();
    showText();
    return;
  }

  if (getPreviewMode() === "loading") {
    resetReveal();
    return;
  }

  startAutoSequence();
});
