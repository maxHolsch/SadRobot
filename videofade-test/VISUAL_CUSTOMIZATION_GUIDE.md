# Visual Customization Guide
**Sad Robot Video Fade Demo**

This guide explains how to customize the visual appearance of your Sad Robot demo application. All visual changes are made in the `index.html` file.

---

## Table of Contents
1. [Project Architecture](#project-architecture)
2. [Component Overview](#component-overview)
3. [Visual Elements](#visual-elements)
4. [Common Customizations](#common-customizations)
5. [Advanced Customizations](#advanced-customizations)

---

## Project Architecture

### File Structure
```
videofade-test/
├── index.html              ← All HTML, CSS, and JavaScript (YOU EDIT THIS!)
├── server.js              ← Backend server (no visual changes here)
├── sad_stitched_1.mp4     ← Video: Sad emotion
├── neutral_stitched_1.mp4 ← Video: Neutral emotion
└── happier_stitched_1.mp4 ← Video: Happy emotion
```

### How Components Work Together
```
┌─────────────────────────────────────────────────────────┐
│                     index.html                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ HTML STRUCTURE (lines 100-118)                    │  │
│  │ - Video stage container                           │  │
│  │ - Video elements (v0, v1)                         │  │
│  │ - Controls (buttons, slider)                      │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ CSS STYLING (lines 7-96)                          │  │
│  │ - Colors, sizes, positions                        │  │
│  │ - Button styles and animations                    │  │
│  │ - Fullscreen behavior                             │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │ JAVASCRIPT BEHAVIOR (lines 119-732)               │  │
│  │ - Video crossfading logic                         │  │
│  │ - Emotion analysis system                         │  │
│  │ - Voice agent integration                         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Component Overview

### 1. Video Stage (`#stage`)
**Location:** Lines 11-17, 31-49
**Purpose:** Container that holds the two video layers

**Current Style:**
- Black background
- 16:9 aspect ratio
- Max width: 960px
- Centered on page

### 2. Video Elements (`#v0`, `#v1`)
**Location:** Lines 12-17, 101-102
**Purpose:** Two video layers that crossfade between emotions

**How Crossfading Works:**
- Two videos stack on top of each other
- Front video is visible (`.active` class, opacity: 1)
- Back video is hidden (opacity: 0)
- During transition, back video fades in while front fades out
- Videos are synced by timestamp

### 3. Black Box Overlay (`#blackBox`)
**Location:** Lines 19-29, 103
**Purpose:** Decorative black box in corner (covers video content)

**Current Style:**
- Position: Bottom-right corner
- Size: 20% width × 20% height
- Always on top (z-index: 10)

### 4. Control Panel (`#controls`)
**Location:** Lines 50-54, 106-117
**Purpose:** Interactive buttons and slider

**Elements:**
- Play/Pause buttons
- Fullscreen toggle
- Emotion slider (1-4)
- Voice agent button

### 5. Voice Agent Button (`#voiceAgentBtn`)
**Location:** Lines 56-85, 115
**Purpose:** Starts/stops conversation with the robot

**States:**
- Default: Purple gradient
- Active (connecting): Red gradient with pulse animation
- Connected: Green gradient

---

## Visual Elements

### Colors

#### Background Colors
**Location:** Lines 8-10
```css
html, body {
  background: black;  /* Change page background here */
}
```

**To change:**
- `background: #1a1a2e;` (dark blue-gray)
- `background: #0f0f1e;` (very dark blue)
- `background: linear-gradient(to bottom, #000, #1a1a2e);` (gradient)

#### Stage Background
**Location:** Line 11
```css
#stage {
  background: #000;  /* Video stage background */
}
```

#### Button Colors
**Location:** Lines 51-52
```css
button {
  background: #111;  /* Default button background */
  color: #eee;       /* Button text color */
  border: 1px solid #444;  /* Button border */
}

button:hover {
  background: #222;  /* Hover state */
}
```

**To change:** Modify these hex codes to your preferred colors

#### Voice Agent Button Colors
**Location:** Lines 57-81

**Default State (lines 59-60):**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
border: 2px solid #8b5cf6;
```

**Active State (lines 74-75):**
```css
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
border-color: #ef4444;
```

**Connected State (lines 79-80):**
```css
background: linear-gradient(135deg, #10b981 0%, #059669 100%);
border-color: #10b981;
```

---

## Common Customizations

### 1. Change Video Stage Size
**Location:** Line 11

**Current:**
```css
max-width: 960px;
```

**Options:**
```css
max-width: 1200px;  /* Larger stage */
max-width: 720px;   /* Smaller stage */
max-width: 100%;    /* Full width */
```

### 2. Change Video Aspect Ratio
**Location:** Line 11

**Current:**
```css
aspect-ratio: 16/9;  /* Widescreen */
```

**Options:**
```css
aspect-ratio: 4/3;   /* Traditional TV */
aspect-ratio: 1/1;   /* Square */
aspect-ratio: 21/9;  /* Ultrawide */
```

### 3. Resize/Remove Black Box Overlay
**Location:** Lines 19-29

**Current size:**
```css
width: 20%;   /* Change width percentage */
height: 20%;  /* Change height percentage */
```

**To remove entirely:** Delete lines 103 (`<div id="blackBox"></div>`)

**Change position:**
```css
/* Bottom-right (current) */
bottom: 0;
right: 0;

/* Top-right */
top: 0;
right: 0;

/* Bottom-left */
bottom: 0;
left: 0;

/* Top-left */
top: 0;
left: 0;

/* Centered at bottom */
bottom: 0;
left: 50%;
transform: translateX(-50%);
```

### 4. Change Crossfade Speed
**Location:** Lines 198, 216, 574

**Current:** `durationMs: 800` (0.8 seconds)

**To change:** Replace `800` with your desired milliseconds
```javascript
{ durationMs: 1500 }  // Slower (1.5 seconds)
{ durationMs: 400 }   // Faster (0.4 seconds)
{ durationMs: 2000 }  // Very slow (2 seconds)
```

### 5. Change Button Text
**Location:** Lines 107-115

**Examples:**
```html
<button id="play">▶ Play</button>
<button id="pause">⏸ Pause</button>
<button id="fullscreenBtn">🖵 Fullscreen</button>
<button id="voiceAgentBtn">🎙️ Start Voice Chat</button>
```

### 6. Customize Voice Agent Button Appearance

**Change gradient colors (line 59):**
```css
/* Blue to purple (current) */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Pink to purple */
background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);

/* Orange to red */
background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);

/* Cyan to blue */
background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
```

**Change hover effect (lines 68-72):**
```css
#voiceAgentBtn:hover {
  transform: translateY(-2px);  /* Lift amount (increase for more lift) */
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);  /* Shadow (adjust color and size) */
}
```

---

## Advanced Customizations

### 1. Add Custom Animations

**Example: Pulsing border on video stage**
Add to CSS section (after line 96):
```css
@keyframes borderPulse {
  0%, 100% { border-color: #444; }
  50% { border-color: #8b5cf6; }
}

#stage {
  border: 3px solid #444;
  animation: borderPulse 3s infinite;
}
```

### 2. Add Text Overlay on Video

**Add to HTML (after line 103):**
```html
<div id="textOverlay">Sad Robot</div>
```

**Add to CSS (after line 96):**
```css
#textOverlay {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 32px;
  font-weight: bold;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
  z-index: 15;
  pointer-events: none;
}
```

### 3. Change Video Playlist

**Location:** Lines 125-130

**Current:**
```javascript
const playlist = [
  { src: "sad_stitched_1.mp4" },       // Video 1 (Sad)
  { src: "neutral_stitched_1.mp4" },   // Video 2 (Neutral-Sad)
  { src: "neutral_stitched_1.mp4" },   // Video 3 (Neutral-Happy)
  { src: "happier_stitched_1.mp4" },   // Video 4 (Happy)
];
```

**To change:** Replace filenames with your own video files (must be in same folder)

**Example with 5 emotions:**
```javascript
const playlist = [
  { src: "very_sad.mp4" },
  { src: "sad.mp4" },
  { src: "neutral.mp4" },
  { src: "happy.mp4" },
  { src: "very_happy.mp4" },
];
```
⚠️ **Important:** Also update slider max value in line 112:
```html
<input id="picker" type="range" min="1" max="5" step="1" value="1" />
```

### 4. Customize Fullscreen Behavior

**Location:** Lines 31-49

**Current:** Fills entire screen

**To add padding in fullscreen:**
```css
#stage:fullscreen {
  max-width: 90%;     /* Add side padding */
  height: 90vh;       /* Add top/bottom padding */
  margin: auto;       /* Center */
}
```

### 5. Change Font

**Location:** Line 50

**Current:**
```css
font: 14px/1.4 system-ui, sans-serif;
```

**Options:**
```css
/* Monospace/tech look */
font-family: 'Courier New', monospace;

/* Modern sans-serif */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Custom Google Font (add link in <head>) */
font-family: 'Roboto', sans-serif;
```

### 6. Adjust Emotion Transition Behavior

**Minimum emotion duration (line 458):**
```javascript
const MIN_EMOTION_DURATION = 10000;  // 10 seconds
```
Change to control how often emotions can change.

**Random emotion interval (line 614):**
```javascript
startRandomEmotions(30000);  // 30 seconds
```
Change to control spontaneous emotion changes.

**Emotion mapping thresholds (lines 440-448):**
```javascript
if (comparative <= -0.5 || score <= -3) {
  return 1; // Very sad (adjust thresholds here)
} else if (comparative <= -0.1 || score <= -1) {
  return 2; // Slightly sad
} else if (comparative <= 0.5 || score <= 2) {
  return 3; // Slightly happy
} else {
  return 4; // Very happy
}
```
Adjust sentiment thresholds to make emotion detection more/less sensitive.

---

## Quick Reference: Line Numbers

| Element | Lines | Purpose |
|---------|-------|---------|
| CSS Styling | 7-96 | All visual styles |
| Background Color | 8-10 | Page background |
| Stage Container | 11-17 | Video container style |
| Video Elements | 12-17 | Video layer styling |
| Black Box Overlay | 19-29 | Corner overlay |
| Fullscreen Styles | 31-49 | Fullscreen behavior |
| Controls Panel | 50-54 | Button area style |
| Voice Agent Button | 56-85 | Special button styling |
| HTML Structure | 100-118 | Page layout |
| Video Playlist | 125-130 | Video source files |
| Crossfade Function | 198-231 | Transition logic |
| Emotion Analysis | 328-617 | Sentiment processing |
| Voice Integration | 619-731 | ElevenLabs connection |

---

**Happy customizing! 🎨**
