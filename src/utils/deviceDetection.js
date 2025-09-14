// Device detection utilities
export const isIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

// Check for iOS 18+ specific features
export const isIOS18Plus = () => {
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/OS (\d+)_/);
  return match && parseInt(match[1], 10) >= 18;
};

// Check for iPhone XS specifically
export const isIPhoneXS = () => {
  return (
    /iPhone/.test(navigator.userAgent) &&
    (navigator.userAgent.includes("iPhone12,1") ||
      navigator.userAgent.includes("iPhone12,2") ||
      navigator.userAgent.includes("iPhone12,3") ||
      navigator.userAgent.includes("iPhone12,4"))
  );
};

export const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Get appropriate User-Agent string
export const getUserAgent = () => {
  if (isIOS()) {
    return "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
  } else if (isMobile()) {
    return "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36";
  } else {
    return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
  }
};

// Check if we should use proxy (iOS Safari has stricter CORS)
export const shouldUseProxy = () => {
  return isIOS() || isSafari();
};
