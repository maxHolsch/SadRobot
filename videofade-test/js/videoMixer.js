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
    this.currentIdx = 2; // Start with hopeful videos (index 2)
    this._isTalking = false; // internal state
    this._talkingTimer = null; // timeout id for auto-exit talking mode
    this._queuedIndex = null;
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
    
    console.log("Preloading. Switching. Current index: ", this.currentIdx);
    if (needsReload) {
      console.log("Preloading. Loading new video. Want: ", targetSrc, ". Have: ", this.backVideo.currentSrc);
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
    console.log("Preloading. Playing back video");
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

  // Start playing the hopeful listening video immediately
  async startHopefulVideo() {
    const pl = this.activePlaylist();
    
    // Load hopeful listening video (index 2) into front buffer
    this.setSource(this.frontVideo, pl[this.currentIdx]);
    await this.waitForReady(this.frontVideo).catch(()=>{});
    
    this.showVideo(this.frontVideo);
    console.log(`[VideoMixer ${new Date().toISOString()}] Starting hopeful video: ${pl[this.currentIdx].src}`);
    
    try { 
      await this.frontVideo.play(); 
    } catch(e) {
       console.warn('startHopefulVideo: play() rejected', e); 
    }

    // Preload the hopeful talking video in back buffer
    console.log(`[VideoMixer ${new Date().toISOString()}] Preloading hopeful talking video in back buffer...`);
    this.preloadInactiveVideo();
  }

  currentIndex() {
    return this.currentIdx;
  }

  queueNewCurrentIndex(idx) {
    this._queuedIndex = idx;
  }

  async preloadInactiveVideo() {
    const inactivePlaylist = this.inactivePlaylist();

    if(this._queuedIndex !== null) {
      this.currentIdx = this._queuedIndex;
      this._queuedIndex = null;
    }

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
    console.log('Preloading in back:', videoInfo.src);
    await this.waitForReady(this.backVideo).catch((e) => {
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

export { VideoMixer };