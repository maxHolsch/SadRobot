// Video to play once when the user clicks "Talk to Sad Robot" (one-shot)
// NOTE: change this if you want a different intro clip.
const intro_video = "intro.mp4";

// --- 4-item playlist ---
const playlist = [
  { src: "sad_long.mp4" },
  { src: "neutral_stitched_1.mp4" },
  { src: "neutral_stitched_1.mp4" },
  { src: "happier_stitched_1.mp4" },
];

// Talking-mode playlist (toggle with setTalking)
// By default using same sources; replace entries with talking-specific clips if available
const playlist_talking = [
  { src: "sad_front_talking.mp4" },
  { src: "neutral_stitched_1.mp4" },
  { src: "neutral_stitched_1.mp4" },
  { src: "happier_stitched_1.mp4" },
];

class VideoMixer {
  constructor(stage) {
    this.vids = Array.from(stage.querySelectorAll('video'));
    this.front = 0; // visible element index
    this.currentIdx = 0; // active playlist index
    this._isTalking = false; // internal state
    this.playlistStarted = false;
    this._talkingTimer = null; // timeout id for auto-exit talking mode

    // Make intro_video available globally for other modules
    window.sadRobot = { intro_video };
  }

  activePlaylist() {
    return this._isTalking ? playlist_talking : playlist;
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
  async crossfadeTo(targetIdx, { durationMs = 800 } = {}) {
    const pl = this.activePlaylist();
    console.log(`[VideoMixer] crossfadeTo: targetIdx=${targetIdx}, durationMs=${durationMs}, playlist=`, pl);
    targetIdx = Math.max(0, Math.min(targetIdx, pl.length - 1));
    // if (targetIdx === this.currentIdx) return;

    const frontVid = this.vids[this.front];
    const back = 1 - this.front;
    const backVid = this.vids[back];

    this.setSource(backVid, pl[targetIdx]);
    await Promise.all([this.waitForMetadata(frontVid).catch(()=>{}), this.waitForMetadata(backVid).catch(()=>{})]);
    await this.waitForReady(backVid);

    const targetTime = Math.min(backVid.duration || Infinity, frontVid.currentTime || 0);
    await this.seekTo(backVid, targetTime);
    await backVid.play().catch(()=>{});
    backVid.classList.add("on-top");

    console.log(`[VideoMixer] crossfading to idx=${targetIdx} (time=${targetTime.toFixed(2)}s)`);
    const fadeIn  = backVid.animate([{opacity:0},{opacity:1}], { duration: durationMs, easing:"linear", fill:"forwards" });
    const fadeOut = frontVid.animate([{opacity:1},{opacity:0}], { duration: durationMs, easing:"linear", fill:"forwards" });
    await Promise.all([fadeIn.finished, fadeOut.finished]).catch(()=>{});
    console.log(`[VideoMixer] crossfade to idx=${targetIdx} complete`);

    frontVid.pause();
    frontVid.classList.remove("active");
    backVid.classList.add("active");
    backVid.classList.remove("on-top");

    this.front = back;
    this.currentIdx = targetIdx;

    // optional: preload something for next time (here we preload the previous front as next, no-op if same)
    const newBack = 1 - this.front;
    const preloadIdx = (this.currentIdx + 1) % pl.length;
    this.setSource(this.vids[newBack], pl[preloadIdx]);
  }

  // Initialize playlist buffers but do NOT start playback automatically.
  // This satisfies: "when we first load the page, no video is playing".
  initPlaylistBuffers() {
    const pl = this.activePlaylist();
    // clamp currentIdx to active playlist
    this.currentIdx = Math.max(0, Math.min(this.currentIdx, pl.length - 1));
    // set front source but don't play
    this.setSource(this.vids[this.front], pl[this.currentIdx]);
    // prime back buffer with next
    const back = 1 - this.front;
    this.setSource(this.vids[back], pl[(this.currentIdx + 1) % pl.length]);
  }

  // Start actual playlist playback (called after one-shot completes or when user explicitly starts)
  async beginPlaylist() {
    if (this.playlistStarted) return;
    this.playlistStarted = true;
    const pl = this.activePlaylist();
    // ensure currentIdx is valid
    this.currentIdx = Math.max(0, Math.min(this.currentIdx, pl.length - 1));
    try {
      await this.waitForReady(this.vids[this.front]).catch(()=>{});
      // Ensure the front video will loop when playlist starts
      try { this.vids[this.front].loop = true; } catch (e) {}
      this.vids[this.front].classList.add("active");
      await this.vids[this.front].play().catch(()=>{});
    } catch (e) {
      console.warn("beginPlaylist: failed to auto-play front video", e);
    }
    // prime back buffer again
    const back = 1 - this.front;
    this.setSource(this.vids[back], pl[(this.currentIdx + 1) % pl.length]);
  }

  // Helper: play a single non-looping one-shot video on screen using the back buffer
  async playOneShot(src) {
    const frontVid = this.vids[this.front];
    const backVid = this.vids[1 - this.front];

    // Pause any playing videos
    try { frontVid.pause(); } catch (e) {}
    try { backVid.pause(); } catch (e) {}

    // Load one-shot into back buffer
    this.setSource(backVid, { src });
    backVid.loop = false;
    await this.waitForReady(backVid).catch(()=>{});
    await this.seekTo(backVid, 0).catch(()=>{});

    // Bring back buffer on top and play
    backVid.classList.add('on-top');
    backVid.classList.add('active');
    frontVid.classList.remove('active');
    try { await backVid.play(); } catch(e) { console.warn('playOneShot: play() rejected', e); }

    // Wait for end
    await new Promise((resolve) => {
      const onEnd = () => { backVid.removeEventListener('ended', onEnd); resolve(); };
      backVid.addEventListener('ended', onEnd);
    });

    // Cleanup: hide the one-shot. Do not change front index here — beginPlaylist will restore.
    backVid.classList.remove('active', 'on-top');
    // Restore looping for this buffer so subsequent playlist playback loops normally
    try { backVid.loop = true; } catch (e) {}
    // Mark playlist as not started so beginPlaylist will restart it
    this.playlistStarted = false;
  }

  // Public API
  play() {
    return this.vids[this.front].play();
  }

  pause() {
    return this.vids[this.front].pause();
  }

  goTo(idx, opts) {
    return this.crossfadeTo(idx, opts);
  }

  currentIndex() {
    return this.currentIdx;
  }

  // Public getter for talking state
  get isTalking() {
    return this._isTalking;
  }

  // Handle an incoming message (string or message object) and estimate how long
  // talking-mode should be enabled. Returns the estimated duration in ms.
  handleMessage(msg) {
    // Extract text from either a raw string or a message object (e.g. { message: '...' })
    const text = typeof msg === 'string' ? msg : (msg && (msg.message || msg.text || '')) || '';
    if (!text || !text.trim()) return 0;

    // Estimate speaking duration from word count + sentence pauses.
    const words = (text.trim().match(/\S+/g) || []).length;
    const sentences = (text.match(/[.!?]+/g) || []).length;

    // Typical speaking rate ~150 wpm -> 2.5 words/sec
    const wordsPerSec = 2.5;
    const baseMs = (words / wordsPerSec) * 1000;

    // Add ~600ms per sentence-ending punctuation to allow natural pauses
    const pauseMs = sentences * 600;

    // Small padding and sensible bounds
    let durationMs = Math.round(baseMs + pauseMs + 500);
    durationMs = Math.max(durationMs, 1500);    // minimum 1.5s
    durationMs = Math.min(durationMs, 30000);   // maximum 30s

    // Enter talking mode and schedule exit after durationMs
    try {
      this.setTalking(true);
      if (this._talkingTimer) {
        clearTimeout(this._talkingTimer);
        this._talkingTimer = null;
      }
      this._talkingTimer = setTimeout(() => {
        try { this.setTalking(false); } catch (e) { /* ignore */ }
        this._talkingTimer = null;
      }, durationMs);
    } catch (e) {
      console.warn('handleMessage: failed to schedule talking state', e);
    }

    return durationMs;
  }

  // Toggle talking-mode playlist
  setTalking(flag) {
    console.log(`[VideoMixer] setTalking: ${flag}`);
    const newVal = !!flag;
    if (newVal === this._isTalking) return;
    this._isTalking = newVal;

    // Clamp current index to new playlist length and update UI slider max if present
    const pl = this.activePlaylist();
    this.currentIdx = Math.max(0, Math.min(this.currentIdx, pl.length - 1));
    const picker = document.getElementById('picker');
    if (picker) {
      picker.max = pl.length;
      // Ensure displayed value is still valid
      if (parseInt(picker.value, 10) > pl.length) {
        picker.value = String(this.currentIdx + 1);
      }
      const pickerval = document.getElementById('pickerval');
      if (pickerval) pickerval.textContent = picker.value;
    }

    // Crossfade to the (possibly clamped) current index in the newly selected playlist
    this.crossfadeTo(this.currentIdx, { durationMs: 300 }).catch(()=>{});
    console.log(`[VideoMixer] switched to ${this.isTalking ? 'talking' : 'normal'} playlist, currentIdx=${this.currentIdx}`);
    // If talking mode was turned off manually, clear any pending auto-exit timer
    if (!this._isTalking && this._talkingTimer) {
      clearTimeout(this._talkingTimer);
      this._talkingTimer = null;
    }
  }
}

export { VideoMixer, intro_video };