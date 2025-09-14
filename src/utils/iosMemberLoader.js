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
   * Method 2.5: Try iOS-specific workaround with different headers
   */
  async tryIOSWorkaround(memberCode) {
    console.log(`iOS: Trying iOS workaround for member ${memberCode}`);
    try {
      // Try with different User-Agent and headers
      const response = await fetch(
        `https://www.nogizaka46.com/s/n46/api/list/member?callback=res`,
        {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept: "*/*",
            "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
          },
          mode: "cors",
          credentials: "omit",
        }
      );

      console.log("iOS: Workaround response status:", response.status);
      console.log("iOS: Workaround response ok:", response.ok);

      if (response.ok) {
        const data = await response.text();
        console.log("iOS: Workaround data length:", data.length);
        console.log("iOS: Workaround data preview:", data.substring(0, 200));

        const jsonStr = data.replace(/^res\(/, "").replace(/\);?$/, "");
        console.log(
          "iOS: Workaround parsed JSON string length:",
          jsonStr.length
        );

        const api = JSON.parse(jsonStr);
        console.log("iOS: Workaround API data length:", api.data?.length || 0);

        const member = api.data.find(
          (m) => String(m.code) === String(memberCode)
        );
        console.log("iOS: Found member in workaround method:", member);

        if (member) {
          console.log("iOS: Workaround method successful:", member);
          this.setCachedMember(memberCode, member);
          this.resetRetryCount(memberCode);
          return member;
        } else {
          console.log("iOS: Member not found in workaround method data");
        }
      } else {
        console.log(
          "iOS: Workaround failed - response not ok:",
          response.status
        );
      }
      return null;
    } catch (error) {
      console.warn("iOS: Workaround method failed with error:", error);
      console.warn("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      return null;
    }
  }

  /**
   * Method 2.6: Try iOS-specific no-cors method (bypass CORS completely)
   */
  async tryIOSNoCors(memberCode) {
    console.log(`iOS: Trying iOS no-cors method for member ${memberCode}`);
    try {
      // Use no-cors mode to bypass CORS restrictions completely
      const response = await fetch(
        `https://www.nogizaka46.com/s/n46/api/list/member?callback=res`,
        {
          method: "GET",
          mode: "no-cors", // This bypasses CORS completely
          credentials: "omit",
        }
      );

      console.log("iOS: No-cors response status:", response.status);
      console.log("iOS: No-cors response ok:", response.ok);
      console.log("iOS: No-cors response type:", response.type);

      // With no-cors, we can't read the response body directly
      // But we can try to use the proxy service instead
      console.log("iOS: No-cors method - falling back to proxy service");

      // Try proxy service as fallback
      const proxyResponse = await fetch(
        "/api/proxy?url=" +
          encodeURIComponent(
            "https://www.nogizaka46.com/s/n46/api/list/member?callback=res"
          ),
        {
          method: "GET",
          headers: {
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
          },
          mode: "cors",
          credentials: "omit",
        }
      );

      console.log("iOS: Proxy fallback response status:", proxyResponse.status);
      console.log("iOS: Proxy fallback response ok:", proxyResponse.ok);

      if (proxyResponse.ok) {
        const data = await proxyResponse.text();
        console.log("iOS: Proxy fallback data length:", data.length);
        console.log(
          "iOS: Proxy fallback data preview:",
          data.substring(0, 200)
        );

        const jsonStr = data.replace(/^res\(/, "").replace(/\);?$/, "");
        console.log(
          "iOS: Proxy fallback parsed JSON string length:",
          jsonStr.length
        );

        const api = JSON.parse(jsonStr);
        console.log(
          "iOS: Proxy fallback API data length:",
          api.data?.length || 0
        );

        const member = api.data.find(
          (m) => String(m.code) === String(memberCode)
        );
        console.log("iOS: Found member in proxy fallback method:", member);

        if (member) {
          console.log("iOS: Proxy fallback method successful:", member);
          this.setCachedMember(memberCode, member);
          this.resetRetryCount(memberCode);
          return member;
        } else {
          console.log("iOS: Member not found in proxy fallback method data");
        }
      } else {
        console.log(
          "iOS: Proxy fallback failed - response not ok:",
          proxyResponse.status
        );
      }
      return null;
    } catch (error) {
      console.warn("iOS: No-cors method failed with error:", error);
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
      const testUrl =
        "/api/proxy?url=" +
        encodeURIComponent(
          "https://www.nogizaka46.com/s/n46/api/list/member?callback=res"
        );

      console.log("iOS: Testing proxy URL:", testUrl);

      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
        },
        mode: "cors",
        credentials: "omit",
      });

      console.log("iOS: Proxy test response status:", response.status);
      console.log("iOS: Proxy test response ok:", response.ok);
      console.log(
        "iOS: Proxy test response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const data = await response.text();
        console.log("iOS: Proxy test data length:", data.length);
        console.log("iOS: Proxy test data preview:", data.substring(0, 200));

        // Test if data can be parsed
        try {
          const jsonStr = data.replace(/^res\(/, "").replace(/\);?$/, "");
          const api = JSON.parse(jsonStr);
          console.log(
            "iOS: Proxy test - parsed API data length:",
            api.data?.length || 0
          );
          console.log(
            "iOS: Proxy test - sample members:",
            api.data
              ?.slice(0, 3)
              .map((m) => ({ code: m.code, name: m.name })) || []
          );
          return true;
        } catch (parseError) {
          console.warn("iOS: Proxy test - data parsing failed:", parseError);
          return false;
        }
      } else {
        console.log(
          "iOS: Proxy test failed - response not ok:",
          response.status
        );
        return false;
      }
    } catch (error) {
      console.warn("iOS: Proxy test failed with error:", error);
      console.warn("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      return false;
    }
  }

  /**
   * Method 4.5: Test direct proxy call with iOS-specific debugging
   */
  async testDirectProxyCall() {
    console.log("iOS: Testing direct proxy call...");
    try {
      // Test the proxy endpoint directly
      const proxyUrl =
        "/api/proxy?url=" +
        encodeURIComponent(
          "https://www.nogizaka46.com/s/n46/api/list/member?callback=res"
        );

      console.log("iOS: Direct proxy URL:", proxyUrl);

      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        },
        mode: "cors",
        credentials: "omit",
      });

      console.log("iOS: Direct proxy response status:", response.status);
      console.log("iOS: Direct proxy response ok:", response.ok);
      console.log("iOS: Direct proxy response type:", response.type);
      console.log(
        "iOS: Direct proxy response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const data = await response.text();
        console.log("iOS: Direct proxy data length:", data.length);
        console.log("iOS: Direct proxy data preview:", data.substring(0, 300));

        // Try to parse the data
        try {
          const jsonStr = data.replace(/^res\(/, "").replace(/\);?$/, "");
          const api = JSON.parse(jsonStr);
          console.log(
            "iOS: Direct proxy - parsed API data length:",
            api.data?.length || 0
          );
          console.log(
            "iOS: Direct proxy - sample members:",
            api.data
              ?.slice(0, 5)
              .map((m) => ({ code: m.code, name: m.name })) || []
          );
          return { success: true, data: api };
        } catch (parseError) {
          console.warn("iOS: Direct proxy - data parsing failed:", parseError);
          return { success: false, error: parseError };
        }
      } else {
        console.log(
          "iOS: Direct proxy failed - response not ok:",
          response.status
        );
        return { success: false, error: `Response not ok: ${response.status}` };
      }
    } catch (error) {
      console.warn("iOS: Direct proxy call failed with error:", error);
      return { success: false, error: error };
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

    // Test proxy service first with enhanced debugging
    console.log("iOS: Testing proxy service before attempting member load...");
    const proxyWorking = await this.testProxyService();

    // Also test direct proxy call for debugging
    console.log("iOS: Testing direct proxy call for debugging...");
    const directProxyResult = await this.testDirectProxyCall();
    console.log("iOS: Direct proxy test result:", directProxyResult);

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

    // Method 2.5: iOS workaround
    if (!member) {
      console.log("iOS: Trying iOS workaround method...");
      member = await this.tryIOSWorkaround(memberCode);
    }

    // Method 2.6: iOS no-cors method
    if (!member) {
      console.log("iOS: Trying iOS no-cors method...");
      member = await this.tryIOSNoCors(memberCode);
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
