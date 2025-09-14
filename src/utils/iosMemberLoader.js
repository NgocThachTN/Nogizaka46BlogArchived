// iOS-specific member loading utilities
// Handles member info loading with fallbacks and retry logic for iOS Safari

import {
  fetchMemberInfo,
  fetchMemberInfoByName,
} from "../services/blogService";

/**
 * iOS-specific member loading with comprehensive fallback strategies
 */
export class IOSMemberLoader {
  constructor() {
    this.retryCount = new Map(); // memberCode -> count
    this.cache = new Map(); // memberCode -> { member, timestamp }
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.MAX_RETRIES = 3;
  }

  /**
   * Check if device is iOS
   */
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  /**
   * Get retry count for a member code
   */
  getRetryCount(memberCode) {
    return this.retryCount.get(memberCode) || 0;
  }

  /**
   * Set retry count for a member code
   */
  setRetryCount(memberCode, count) {
    this.retryCount.set(memberCode, count);
  }

  /**
   * Reset retry count for a member code
   */
  resetRetryCount(memberCode) {
    this.retryCount.set(memberCode, 0);
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid(memberCode) {
    const cached = this.cache.get(memberCode);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  /**
   * Get cached member info
   */
  getCachedMember(memberCode) {
    const cached = this.cache.get(memberCode);
    return cached ? cached.member : null;
  }

  /**
   * Cache member info
   */
  setCachedMember(memberCode, member) {
    this.cache.set(memberCode, {
      member,
      timestamp: Date.now(),
    });
  }

  /**
   * Method 1: Try proxy-based fetchMemberInfo
   */
  async tryProxyMethod(memberCode) {
    console.log(`iOS: Trying proxy method for member ${memberCode}`);
    try {
      console.log("iOS: Calling fetchMemberInfo with memberCode:", memberCode);
      const member = await fetchMemberInfo(memberCode);
      console.log("iOS: fetchMemberInfo returned:", member);

      if (member) {
        console.log("iOS: Proxy method successful:", member);
        this.setCachedMember(memberCode, member);
        this.resetRetryCount(memberCode);
        return member;
      } else {
        console.log("iOS: Proxy method returned null - no member data");
      }
      return null;
    } catch (error) {
      console.warn("iOS: Proxy method failed with error:", error);
      console.warn("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      return null;
    }
  }

  /**
   * Method 2: Try direct fetch without proxy
   */
  async tryDirectMethod(memberCode) {
    console.log(`iOS: Trying direct method for member ${memberCode}`);
    try {
      console.log("iOS: Making direct fetch request...");
      const response = await fetch(
        `https://www.nogizaka46.com/s/n46/api/list/member?callback=res`,
        {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
          },
          mode: "cors",
          credentials: "omit",
        }
      );

      console.log("iOS: Direct fetch response status:", response.status);
      console.log("iOS: Direct fetch response ok:", response.ok);

      if (response.ok) {
        const data = await response.text();
        console.log("iOS: Direct fetch data length:", data.length);
        console.log("iOS: Direct fetch data preview:", data.substring(0, 200));

        const jsonStr = data.replace(/^res\(/, "").replace(/\);?$/, "");
        console.log("iOS: Parsed JSON string length:", jsonStr.length);

        const api = JSON.parse(jsonStr);
        console.log("iOS: API data length:", api.data?.length || 0);

        const member = api.data.find(
          (m) => String(m.code) === String(memberCode)
        );
        console.log("iOS: Found member in direct method:", member);

        if (member) {
          console.log("iOS: Direct method successful:", member);
          this.setCachedMember(memberCode, member);
          this.resetRetryCount(memberCode);
          return member;
        } else {
          console.log("iOS: Member not found in direct method data");
        }
      } else {
        console.log(
          "iOS: Direct fetch failed - response not ok:",
          response.status
        );
      }
      return null;
    } catch (error) {
      console.warn("iOS: Direct method failed with error:", error);
      console.warn("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      return null;
    }
  }

  /**
   * Method 3: Try fetch by name (fallback)
   */
  async tryNameMethod(memberName) {
    if (!memberName) return null;
    console.log(`iOS: Trying name method for member ${memberName}`);
    try {
      const member = await fetchMemberInfoByName(memberName);
      if (member) {
        console.log("iOS: Name method successful:", member);
        return member;
      }
      return null;
    } catch (error) {
      console.warn("iOS: Name method failed:", error);
      return null;
    }
  }

  /**
   * Method 4: Test proxy service directly
   */
  async testProxyService() {
    console.log("iOS: Testing proxy service...");
    try {
      const response = await fetch(
        "/api/proxy?url=" +
          encodeURIComponent(
            "https://www.nogizaka46.com/s/n46/api/list/member?callback=res"
          )
      );
      console.log("iOS: Proxy test response status:", response.status);
      console.log("iOS: Proxy test response ok:", response.ok);

      if (response.ok) {
        const data = await response.text();
        console.log("iOS: Proxy test data length:", data.length);
        console.log("iOS: Proxy test data preview:", data.substring(0, 200));
        return true;
      } else {
        console.log(
          "iOS: Proxy test failed - response not ok:",
          response.status
        );
        return false;
      }
    } catch (error) {
      console.warn("iOS: Proxy test failed with error:", error);
      return false;
    }
  }

  /**
   * Main loading method with all fallbacks
   */
  async loadMember(memberCode, memberName = null) {
    // Check cache first
    if (this.isCacheValid(memberCode)) {
      const cached = this.getCachedMember(memberCode);
      if (cached) {
        console.log("iOS: Using cached member:", cached);
        return cached;
      }
    }

    const currentRetryCount = this.getRetryCount(memberCode);

    // Reset retry count if it's too high (fix for stuck retry)
    if (currentRetryCount > this.MAX_RETRIES) {
      console.log(
        `iOS: Resetting retry count for member ${memberCode} (was ${currentRetryCount})`
      );
      this.resetRetryCount(memberCode);
    }

    const actualRetryCount = this.getRetryCount(memberCode);

    if (actualRetryCount >= this.MAX_RETRIES) {
      console.log(`iOS: Max retries reached for member ${memberCode}`);
      return null;
    }

    console.log(
      `iOS: Loading member ${memberCode} (attempt ${actualRetryCount + 1}/${
        this.MAX_RETRIES
      })`
    );

    // Test proxy service first
    console.log("iOS: Testing proxy service before attempting member load...");
    const proxyWorking = await this.testProxyService();

    // Try methods in order
    let member = null;

    // Method 1: Proxy (if working)
    if (!member && proxyWorking) {
      console.log("iOS: Proxy service is working, trying proxy method...");
      member = await this.tryProxyMethod(memberCode);
    } else if (!proxyWorking) {
      console.log("iOS: Proxy service not working, skipping proxy method...");
    }

    // Method 2: Direct fetch
    if (!member) {
      console.log("iOS: Trying direct method...");
      member = await this.tryDirectMethod(memberCode);
    }

    // Method 3: By name (if provided)
    if (!member && memberName) {
      console.log("iOS: Trying name method...");
      member = await this.tryNameMethod(memberName);
    }

    if (member) {
      this.setCachedMember(memberCode, member);
      this.resetRetryCount(memberCode);
      return member;
    } else {
      this.setRetryCount(memberCode, actualRetryCount + 1);
      return null;
    }
  }

  /**
   * Force retry with reset
   */
  async forceRetry(memberCode, memberName = null) {
    console.log(`iOS: Force retry for member ${memberCode}`);
    this.resetRetryCount(memberCode);
    this.cache.delete(memberCode); // Clear cache
    return this.loadMember(memberCode, memberName);
  }

  /**
   * Force reset retry count for a member
   */
  forceResetRetry(memberCode) {
    console.log(`iOS: Force reset retry count for member ${memberCode}`);
    this.resetRetryCount(memberCode);
    this.cache.delete(memberCode); // Clear cache
  }

  /**
   * Get debug info
   */
  getDebugInfo(memberCode) {
    return {
      memberCode,
      retryCount: this.getRetryCount(memberCode),
      hasCache: this.cache.has(memberCode),
      isCacheValid: this.isCacheValid(memberCode),
      cachedMember: this.getCachedMember(memberCode),
      isIOS: this.isIOS(),
    };
  }
}

// Create singleton instance
export const iosMemberLoader = new IOSMemberLoader();

/**
 * Hook for React components to use iOS member loading
 */
export function useIOSMemberLoader() {
  return {
    loadMember: (memberCode, memberName) =>
      iosMemberLoader.loadMember(memberCode, memberName),
    forceRetry: (memberCode, memberName) =>
      iosMemberLoader.forceRetry(memberCode, memberName),
    forceResetRetry: (memberCode) =>
      iosMemberLoader.forceResetRetry(memberCode),
    getDebugInfo: (memberCode) => iosMemberLoader.getDebugInfo(memberCode),
    isIOS: () => iosMemberLoader.isIOS(),
    getRetryCount: (memberCode) => iosMemberLoader.getRetryCount(memberCode),
    resetRetryCount: (memberCode) =>
      iosMemberLoader.resetRetryCount(memberCode),
  };
}
