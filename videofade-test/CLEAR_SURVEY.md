# How to Clear Survey Data for Testing

## Quick Method: Browser Console

1. Open your browser's Developer Tools (F12 or Right-click → Inspect)
2. Go to the **Console** tab
3. Run one of these commands:

### Clear only survey data:
```javascript
localStorage.removeItem('surveyCompleted');
localStorage.removeItem('surveyCompletionTime');
location.reload();
```

### Clear all localStorage (if you want a clean slate):
```javascript
localStorage.clear();
location.reload();
```

## Method 2: Browser DevTools Application Tab

1. Open Developer Tools (F12)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Local Storage** in the left sidebar
4. Click on your website's URL
5. Find and delete:
   - `surveyCompleted`
   - `surveyCompletionTime`
6. Refresh the page

## Method 3: Add a Reset Button (Development Only)

You can add a temporary reset button to your page for easier testing during development.

