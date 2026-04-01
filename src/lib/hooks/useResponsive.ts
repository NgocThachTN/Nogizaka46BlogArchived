import { useSyncExternalStore } from "react";

const MOBILE_QUERY = "(max-width: 767px)";

const getServerSnapshot = () => false;

const getClientSnapshot = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(MOBILE_QUERY).matches;
};

const subscribe = (onStoreChange: () => void) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  const listener = () => onStoreChange();
  mediaQuery.addEventListener("change", listener);

  return () => mediaQuery.removeEventListener("change", listener);
};

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}

export function useResponsive() {
  const isMobile = useIsMobile();

  return {
    isMobile,
  };
}
