import { useEffect, useMemo, useState } from "react";
import {
  LS_KEY_TR_EN,
  LS_KEY_TR_VI,
  LS_KEY_TTL_EN,
  LS_KEY_TTL_VI,
  cleanDisplayText,
} from "../components/BlogDetail/constants";
import type { BlogDetailData, LanguageCode } from "../../../shared/types";

interface UseBlogTranslationOptions {
  blog: BlogDetailData | null;
  blogId: string | undefined;
  language: LanguageCode;
}

export function useBlogTranslation({
  blog,
  blogId,
  language,
}: UseBlogTranslationOptions) {
  const [translatedHtml, setTranslatedHtml] = useState<Record<"en" | "vi", string>>({
    en: "",
    vi: "",
  });
  const [translatedTitle, setTranslatedTitle] = useState<Record<"en" | "vi", string>>({
    en: "",
    vi: "",
  });
  const [translating, setTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);

  useEffect(() => {
    setTranslating(false);
    setTranslationProgress(0);
    setTranslatedHtml({ en: "", vi: "" });
    setTranslatedTitle({ en: "", vi: "" });
  }, [blogId]);

  useEffect(() => {
    if (!blog?.content || language === "ja" || !blogId) {
      return;
    }

    const currentBlogId = blogId;
    const htmlKey = (language === "en" ? LS_KEY_TR_EN : LS_KEY_TR_VI) + `:${currentBlogId}`;
    const titleKey =
      (language === "en" ? LS_KEY_TTL_EN : LS_KEY_TTL_VI) + `:${currentBlogId}`;
    const cachedHtml = localStorage.getItem(htmlKey);
    const cachedTitle = localStorage.getItem(titleKey);

    if (cachedHtml && cachedTitle) {
      setTranslatedHtml((previous) => ({
        ...previous,
        [language]: cachedHtml,
      }));
      setTranslatedTitle((previous) => ({
        ...previous,
        [language]: cachedTitle,
      }));
      return;
    }

    let cancelled = false;

    const translate = async () => {
      try {
        setTranslating(true);
        setTranslationProgress(0);

        const translationModule = await import("../../translation/api/GeminiTranslate");
        const titleTranslator =
          language === "en"
            ? translationModule.translateJapaneseToEnglish
            : translationModule.translateTitleToVietnamese;

        const contentTranslator =
          language === "en"
            ? translationModule.translateJapaneseToEnglish
            : translationModule.translateJapaneseToVietnamese;

        const translatedTitleResult = await titleTranslator(blog.title || "", undefined);
        if (cancelled) {
          return;
        }

        setTranslationProgress(20);

        let translatedContentResult = "";
        let chunkCount = 0;
        const handleChunk = (translatedChunk: string, isLast: boolean) => {
          if (!translatedChunk || cancelled) {
            return;
          }

          translatedContentResult += translatedChunk.replace(/```html/g, "").replace(/```/g, "").trim();
          chunkCount += 1;
          setTranslationProgress(Math.min(20 + chunkCount * 15, 80));

          if (isLast) {
            setTranslatedHtml((previous) => ({
              ...previous,
              [language]: translatedContentResult,
            }));
            localStorage.setItem(htmlKey, translatedContentResult);
          }
        };

        await contentTranslator(blog.content, handleChunk);
        if (cancelled) {
          return;
        }

        const safeTitle = translatedTitleResult.trim();
        if (safeTitle) {
          setTranslatedTitle((previous) => ({
            ...previous,
            [language]: safeTitle,
          }));
          localStorage.setItem(titleKey, safeTitle);
        }
        setTranslationProgress(100);
      } catch (error) {
        console.error("Translation failed:", error);
      } finally {
        if (!cancelled) {
          setTranslating(false);
          setTranslationProgress(0);
        }
      }
    };

    void translate();

    return () => {
      cancelled = true;
    };
  }, [blog?.content, blog?.title, blogId, language]);

  const displayTitle = useMemo(() => {
    if (language !== "en" && language !== "vi") {
      return blog?.title;
    }

    return cleanDisplayText(translatedTitle[language]) || blog?.title;
  }, [blog?.title, language, translatedTitle]);

  const displayContent = useMemo(() => {
    if ((language !== "en" && language !== "vi") || translating || !translatedHtml[language]) {
      return blog?.content;
    }

    return cleanDisplayText(translatedHtml[language]);
  }, [blog?.content, language, translatedHtml, translating]);

  return {
    displayTitle,
    displayContent,
    translatedHtml,
    translatedTitle,
    translating,
    translationProgress,
  };
}
