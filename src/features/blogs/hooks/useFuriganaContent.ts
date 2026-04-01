import { useEffect, useState } from "react";
import type { LanguageCode } from "../../../shared/types";

interface UseFuriganaContentOptions {
  blogId: string | undefined;
  content: string | undefined;
  language: LanguageCode;
}

export function useFuriganaContent({
  blogId,
  content,
  language,
}: UseFuriganaContentOptions) {
  const [showFurigana, setShowFurigana] = useState(false);
  const [furiganaContent, setFuriganaContent] = useState("");
  const [furiganaLoading, setFuriganaLoading] = useState(false);
  const [kuroshiroReady, setKuroshiroReady] = useState(false);
  const [kuroshiroInitializing, setKuroshiroInitializing] = useState(false);

  useEffect(() => {
    setShowFurigana(false);
    setFuriganaContent("");
  }, [blogId]);

  useEffect(() => {
    if (!content || language !== "ja") {
      setShowFurigana(false);
      setFuriganaContent("");
      return;
    }

    if (!showFurigana || furiganaContent) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setFuriganaLoading(true);

        const furiganaModule = await import("../lib/furiganaHelper");

        if (!kuroshiroReady && !kuroshiroInitializing) {
          setKuroshiroInitializing(true);
          await furiganaModule.initKuroshiro();
          if (!cancelled) {
            setKuroshiroReady(true);
            setKuroshiroInitializing(false);
          }
        }

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Furigana timeout")), 30000)
        );

        const html = await Promise.race([
          furiganaModule.addFuriganaToHtml(content),
          timeoutPromise,
        ]);

        if (!cancelled) {
          setFuriganaContent(html);
        }
      } catch (error) {
        console.error("Failed to generate furigana:", error);
        if (!cancelled) {
          setShowFurigana(false);
        }
      } finally {
        if (!cancelled) {
          setFuriganaLoading(false);
          setKuroshiroInitializing(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [content, furiganaContent, kuroshiroInitializing, kuroshiroReady, language, showFurigana]);

  return {
    showFurigana,
    setShowFurigana,
    furiganaContent,
    furiganaLoading,
    kuroshiroReady,
    kuroshiroInitializing,
  };
}
