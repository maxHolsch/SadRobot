// Video to play once when the user clicks "Talk to Sad Robot" (one-shot)
// NOTE: change this if you want a different intro clip.
const intro_video = "Sad-IntroA_grain.mp4";
const idle_video = "Sad-Idle_pingpong.mp4";

// --- 4-item playlist ---
const playlist = [
  { src: "SadListeningA_pingpong.mp4" },
  { src: "DownListeningA_pingpong.mp4" },
  { src: "HopefulListeningA_pingpong.mp4" },
];

// Talking-mode playlist (toggle with setTalking)
// By default using same sources; replace entries with talking-specific clips if available
const playlist_talking = [
  { src: "SadTalkingA_pingpong.mp4" },
  { src: "DownTalkingC_pingpong.mp4" },
  { src: "HopefulTalkingB_pingpong.mp4" },
];

class VideoMixer {
  constructor(stage) {
    this.vids = Array.from(stage.querySelectorAll('video'));
    this.front = 0; // visible element index
    this.currentIdx = 0; // active playlist index
    this._isTalking = false; // internal state
    this._talkingTimer = null; // timeout id for auto-exit talking mode

    // Make intro_video available globally for other modules
    window.sadRobot = { intro_video };
  }

  activePlaylist() {
    return this._isTalking ? playlist_talking : playlist;
  }

  inactivePlaylist() {
    return this._isTalking ? playlist : playlist_talking;
  }

  get frontVideo() {
    return this.vids[this.front];
  }

  get backVideo() {
    return this.vids[1 - this.front];
  }

  swapFrontBuffer() {
    this.front = 1 - this.front;
  }

  showVideo(video) {
    video.classList.add('active')
    video.classList.add('on-top');
  }

  hideVideo(video) {
    video.classList.remove('active', 'on-top');
  }

  swapVideos() {
    this.hideVideo(this.frontVideo);
    this.showVideo(this.backVideo);
    this.swapFrontBuffer();
  }

  // --- helpers ---
  setSource(video, { src }) {
    if (!src) return;
    const abs = new URL(src, location.href).href;
    if (video.currentSrc !== abs) video.src = abs;
    video.preload = "auto";
    // Ensure playlist videos loop by default. The one-shot player will explicitly disable looping.
    try { video.loop = true; } catch (e) {}
    try { video.load(); } catch {}
  }

  async waitForReady(video, { timeoutMs = 8000 } = {}) {
    if (video.readyState >= 2) return Promise.resolve(); // HAVE_CURRENT_DATA
    return new Promise((resolve, reject) => {
      const done = (fn) => {
        clearTimeout(t);
        ["canplay","loadeddata","loadedmetadata","canplaythrough","error"]
          .forEach(ev => video.removeEventListener(ev, handlers[ev]));
        fn();
      };
      const handlers = {
        canplay:        () => done(resolve),
        loadeddata:     () => done(resolve),
        loadedmetadata: () => done(resolve),
        canplaythrough: () => done(resolve),
        error:          () => done(() => reject(video.error || new Error("video error"))),
      };
      Object.keys(handlers).forEach(ev => video.addEventListener(ev, handlers[ev], { once:true }));
      try { video.load(); } catch {}
      const t = setTimeout(() => done(() => reject(new Error("timeout waiting for canplay"))), timeoutMs);
    });
  }

  async waitForMetadata(video, { timeoutMs = 4000 } = {}) {
    if (!isNaN(video.duration) && video.duration > 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const onOk = () => { cleanup(); resolve(); };
      const onErr = () => { cleanup(); reject(video.error || new Error("metadata error")); };
      const cleanup = () => {
        clearTimeout(timer);
        video.removeEventListener("loadedmetadata", onOk);
        video.removeEventListener("error", onErr);
      };
      video.addEventListener("loadedmetadata", onOk, { once:true });
      video.addEventListener("error", onErr, { once:true });
      try { video.load(); } catch {}
      const timer = setTimeout(() => { cleanup(); reject(new Error("timeout waiting for metadata")); }, timeoutMs);
    });
  }

  async seekTo(video, t) {
    const dur = isFinite(video.duration) ? video.duration : Infinity;
    t = Math.max(0, Math.min(t, dur));
    if (typeof video.fastSeek === "function") {
      try { await video.fastSeek(t); return; } catch {}
    }
    return new Promise((resolve) => {
      const onSeeked = () => { video.removeEventListener("seeked", onSeeked); resolve(); };
      video.addEventListener("seeked", onSeeked, { once:true });
      video.currentTime = t;
    });
  }

  // --- fade to a specific playlist index (sync by seconds) ---
  async switchExpressionVid( { durationMs = 800 } = {}) {
    const pl = this.activePlaylist();

    // Check if back buffer already has the right video loaded
    const targetSrc = new URL(pl[this.currentIdx].src, location.href).href;
    const needsReload = this.backVideo.currentSrc !== targetSrc;
    
    if (needsReload) {
      console.log(`[VideoMixer ${new Date().toISOString()}] Loading new video: ${pl[this.currentIdx].src}`);
      this.setSource(this.backVideo, pl[this.currentIdx]);
      await Promise.all([this.waitForMetadata(this.frontVideo).catch(()=>{}), this.waitForMetadata(this.backVideo).catch(()=>{})]);
      await this.waitForReady(this.backVideo);
    } else {
      console.log(`[VideoMixer ${new Date().toISOString()}] Video already loaded: ${pl[this.currentIdx].src}, readyState=${this.backVideo.readyState}`);
      // Video already loaded, just ensure it's ready
      if (this.backVideo.readyState < 2) {
        await this.waitForReady(this.backVideo).catch(()=>{});
      }
    }

    const targetTime = Math.min(this.backVideo.duration || Infinity, this.frontVideo.currentTime || 0);
    await this.seekTo(this.backVideo, targetTime);
    
    // Start back video and bring it on top for crossfade
    this.showVideo(this.backVideo);
    await this.backVideo.play().catch(()=>{});

    const fadeIn  = this.backVideo.animate([{opacity:0},{opacity:1}], { duration: durationMs, easing:"linear", fill:"forwards" });
    const fadeOut = this.frontVideo.animate([{opacity:1},{opacity:0}], { duration: durationMs, easing:"linear", fill:"forwards" });
    await Promise.all([fadeIn.finished, fadeOut.finished]).catch(()=>{});

    // Clean up: pause and hide old front video, remove layering from new front
    this.frontVideo.pause();
    this.hideVideo(this.frontVideo);
    this.backVideo.classList.remove('on-top'); // Keep 'active' but remove layering

    this.swapFrontBuffer();

    // Preload the corresponding video from the inactive playlist (same index)
    // This way when setTalking() is called, the video is already loaded
    this.preloadInactiveVideo();
  }

  // Play intro video followed immediately by looping idle video.
  // Preps the idle video while intro plays to eliminate black gap.
  // Then, loads talking playlist first video into back buffer for immediate use.
  async playIntroThenIdle(introSrc, idleSrc) {
    
    // Load and play intro in back buffer
    this.setSource(this.backVideo, { src: introSrc });
    this.backVideo.loop = false;
    await this.waitForReady(this.backVideo).catch(()=>{});

    // NOTE: Swapping pointers for clarity, from now on the video that's playing is the 'front'
    // ----
    this.swapVideos();
    
    console.log(`[VideoMixer ${new Date().toISOString()}] Intro video ready, starting playback...`);
    try { 
      await this.frontVideo.play(); 
    } catch(e) {
       console.warn('playIntroThenIdle: intro play() rejected', e); 
    }

    // While intro plays, prepare idle video in the front buffer
    this.setSource(this.backVideo, { src: idleSrc });

    // Wait for intro to end
    await new Promise((resolve) => {
      const onEnd = () => { this.frontVideo.removeEventListener('ended', onEnd); resolve(); };
      this.frontVideo.addEventListener('ended', onEnd);
    });

    // NOTE: Swapping pointers for clarity, from now on the video that's playing is the 'front'
    // ----
    this.swapVideos();
    
    try { 
      await this.frontVideo.play(); 
    } catch(e) { 
      console.warn('playIntroThenIdle: idle play() rejected', e); 
    }
    console.log(`[VideoMixer ${new Date().toISOString()}] Idle video playing!`);

    // Prepare the back buffer (which had the intro) with first video from talking playlist
    console.log(`[VideoMixer ${new Date().toISOString()}] Prepping back buffer with first talking playlist video...`);
    this.preloadInactiveVideo();
  }

  goTo(idx, opts) {
    this.currentIdx = idx;
    return this.switchExpressionVid(opts);
  }

  setCurrentIndex(idx) {
    this.currentIdx = idx;
    console.log(`[VideoMixer] currentIdx set to ${idx}`);

    // Make sure that we pre-load the appropriate video
    this.preloadInactiveVideo();
  }

  preloadInactiveVideo() {
    const inactivePlaylist = this.inactivePlaylist();
    if (this.currentIdx < 0 || this.currentIdx >= inactivePlaylist.length) {
      console.warn(`[VideoMixer] preloadVideoAtIndex: index ${this.currentIdx} out of bounds`);
      return;
    }
    const videoInfo = inactivePlaylist[this.currentIdx];
    if (!videoInfo || !videoInfo.src) {
      console.warn(`[VideoMixer] preloadVideoAtIndex: no video source at index ${this.currentIdx}`);
      return;
    }

    // Now do the pre-loading
    this.setSource(this.backVideo, videoInfo);
    this.waitForReady(this.backVideo).catch((e) => {
      console.warn(`[VideoMixer] preloadVideoAtIndex: waitForReady failed for index ${this.currentIdx}`, e);
    });
  }

  // Public getter for talking state
  get isTalking() {
    return this._isTalking;
  }

  // Toggle talking-mode playlist
  setTalking(flag) {

    const newVal = !!flag;
    if (newVal === this._isTalking) return;

    this._isTalking = newVal;

    // Crossfade to the current index in the newly selected playlist
    this.switchExpressionVid( { durationMs: 300 }).catch(()=>{});
  }
}

export { VideoMixer, intro_video, idle_video };