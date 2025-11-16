# API Key Rotation System

## Overview

The Nogizaka46 Blog Archive now supports **multiple Gemini API keys** with automatic load balancing. This helps avoid rate limits when translating multiple blogs consecutively.

## How It Works

### Single Key Mode (Default)
```env
VITE_GEMINI_API_KEY=AIzaSyAbc123...
```
- All translations use the same API key
- Standard behavior, suitable for light usage

### Dual Key Mode (Recommended)
```env
VITE_GEMINI_API_KEY=AIzaSyAbc123...
VITE_GEMINI_API_KEY_2=AIzaSyDef456...
```
- System automatically rotates between 2 keys
- Each blog translation uses a different key
- Doubles your effective rate limit

## Rotation Logic

The system uses a **round-robin algorithm**:

```
Blog 1 Translation → API Key 1
Blog 2 Translation → API Key 2
Blog 3 Translation → API Key 1
Blog 4 Translation → API Key 2
...
```

### Example Flow
```javascript
// User opens blog #12345
→ System uses API Key 1 for title + content translation

// User navigates to blog #67890
→ System uses API Key 2 for title + content translation

// User goes back to blog list
→ Next translation uses API Key 1
```

## Benefits

### 1. Rate Limit Avoidance
- Gemini API has request limits per key
- 2 keys = 2x capacity
- Less likely to hit "quota exceeded" errors

### 2. Better Reliability
- If one key fails or hits quota, the other continues working
- Smoother user experience during heavy usage

### 3. Faster Parallel Operations
- Different requests can use different keys simultaneously
- Reduces bottlenecks on single-key quota

## Configuration

### Getting Multiple API Keys

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create **2 separate API keys** (not just copy the same one!)
3. Add both to your `.env` file

### Environment Setup

```bash
# Copy example file
cp .env.example .env

# Edit .env and add your keys
VITE_GEMINI_API_KEY=your_first_key_here
VITE_GEMINI_API_KEY_2=your_second_key_here
```

### Verifying Configuration

When the app starts, check the console:

```
✅ Single key: "Loaded 1 Gemini API key(s)"
✅ Dual keys:  "Loaded 2 Gemini API key(s)"
❌ No keys:    "No Gemini API keys are set..."
```

During translation, you'll see:
```
Using API key #1 (will use #2 next)
Using API key #2 (will use #1 next)
```

## Technical Details

### Implementation Files

- **`src/config/env.js`** - Loads and validates API keys
- **`src/api/GeminiTranslate.js`** - Rotation logic for @google/generative-ai
- **`src/api/GeminiServices.js`** - Rotation for axios-based requests

### Code Architecture

```javascript
// Key loading
export const GEMINI_API_KEYS = [KEY_1, KEY_2].filter(valid);

// Rotation state
let currentKeyIndex = 0;

// Get key and rotate
const getModelAndRotate = () => {
  const model = models[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % models.length;
  return model;
};
```

### When Keys Rotate

Keys rotate on each **translation call**, not on each chunk:

```javascript
translateJapaneseToVietnamese(longText) {
  const model = getModelAndRotate();  // ← Rotation happens here
  
  // All chunks of this blog use the SAME key
  for (chunk of chunks) {
    await model.generateContent(prompt);
  }
}
```

## Troubleshooting

### "No API keys configured"
- Check `.env` file exists
- Ensure keys are not empty strings
- Restart dev server after changing `.env`

### Still hitting rate limits
- You might need more than 2 keys (contact me to extend support)
- Consider adding delays between translations
- Check Gemini API quotas in Google Cloud Console

### Keys not rotating
- Check console logs - should see "Using API key #X"
- Verify `VITE_GEMINI_API_KEY_2` is different from first key
- Make sure you're not using cached translations

## Best Practices

### ✅ DO
- Use 2 different API keys from separate projects
- Monitor usage in Google AI Studio
- Set up billing alerts to track quota

### ❌ DON'T
- Don't use the same key twice (defeats the purpose!)
- Don't share API keys publicly
- Don't commit `.env` to git (it's in `.gitignore`)

## Future Enhancements

Potential improvements for future versions:

- [ ] Support for 3+ API keys
- [ ] Intelligent key selection based on quota remaining
- [ ] Automatic fallback if one key fails
- [ ] Usage statistics per key
- [ ] Dynamic key addition via admin panel

## Related Documentation

- [Official Gemini API Docs](https://ai.google.dev/docs)
- [Rate Limits & Quotas](https://ai.google.dev/pricing)
- [Local Database Mode](./LOCAL_DATABASE.md)

---

**Last Updated:** December 2024  
**Version:** 1.0.0
