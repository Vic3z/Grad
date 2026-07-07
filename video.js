const graduationVideo = document.querySelector("#graduationVideo");
const videoPlayFallback = document.querySelector("#videoPlayFallback");

function hideVideoFallback() {
  videoPlayFallback.classList.add("is-hidden");
}

function showVideoFallback() {
  videoPlayFallback.classList.remove("is-hidden");
}

async function playVideoWithAudio() {
  if (!graduationVideo) {
    return;
  }

  graduationVideo.muted = false;
  graduationVideo.volume = 1;

  try {
    await graduationVideo.play();
    hideVideoFallback();
  } catch (error) {
    showVideoFallback();
  }
}

videoPlayFallback.addEventListener("click", playVideoWithAudio);

window.addEventListener("DOMContentLoaded", playVideoWithAudio);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    playVideoWithAudio();
  }
});
