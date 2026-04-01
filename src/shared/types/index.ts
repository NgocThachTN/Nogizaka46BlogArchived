import type { Dispatch, SetStateAction } from "react";

export type LanguageCode = "ja" | "en" | "vi";
export type ThemeMode = "light" | "dark";

export type StateSetter<T> = Dispatch<SetStateAction<T>>;

export interface PageProps {
  language: LanguageCode;
  setLanguage: StateSetter<LanguageCode>;
  themeMode: ThemeMode;
  setThemeMode: StateSetter<ThemeMode>;
}

export interface CacheEntry<T> {
  data: T;
  ts: number;
}

export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

export interface MemberSummary {
  code: string;
  name: string;
  english_name?: string;
  englishName?: string;
  kana?: string;
  nameHiragana?: string;
  img?: string;
  image?: string;
  cate?: string;
  groupcode?: string;
  graduation?: string;
  graduationDate?: string;
  birthday?: string;
  blood?: string;
  constellation?: string;
  height?: string;
  intro?: Array<{ key?: string; value?: string }>;
  tag?: string[];
  link?: string;
  isGraduated?: boolean;
  hasLocalData?: boolean;
  [key: string]: unknown;
}

export type MemberDetail = MemberSummary;

export interface MemberGenerationGroup {
  gen: string;
  items: MemberDetail[];
}

export interface BlogSummary {
  id: string;
  title: string;
  date: string;
  link: string;
  thumbnail: string;
  author: string;
  memberCode?: string;
  originalUrl?: string;
  [key: string]: unknown;
}

export interface BlogDetailData extends BlogSummary {
  content: string;
  memberImage?: string | null;
  arti_code?: string;
  artiCode?: string;
  originalUrl?: string;
}
