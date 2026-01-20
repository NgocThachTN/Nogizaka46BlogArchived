import { useState, useEffect, useCallback, useTransition } from "react";
import { getCachedBlogDetail, prefetchBlogDetail } from "../../services/blogService";

export const useBlogNavigation = (navigate, navIds) => {
    const [navLock, setNavLock] = useState(false);
    const [pendingNavId, setPendingNavId] = useState(null);
    const [_IS_PENDING, startTransition] = useTransition();

    // ---- SPEED-FOCUSED NAVIGATION ----
    const fastGo = useCallback(
        (targetId) => {
            if (!targetId || navLock) return;
            setNavLock(true);

            const cachedNext = getCachedBlogDetail(targetId);

            // Có cache → render ngay (optimistic)
            if (cachedNext) {
                setPendingNavId(null);
                // cuộn lên đầu để cảm giác chuyển trang tức thì
                window.scrollTo({ top: 0, behavior: "instant" });
                // điều hướng "nhẹ" để đồng bộ URL nhưng không chặn UI
                startTransition(() => navigate(`/blog/${targetId}`));
                // prefetch hàng xóm của target để lần sau nhanh
                prefetchBlogDetail(targetId);
                // Thả khoá nhẹ
                setTimeout(() => setNavLock(false), 180);
                return;
            }

            // Chưa có cache → hiển thị spinner nhỏ ở header, vẫn phản hồi ngay lập tức
            setPendingNavId(targetId);
            startTransition(() => navigate(`/blog/${targetId}`));
            // fetch nền sẽ setBlog trong effect [id]
            setTimeout(() => setNavLock(false), 280);
        },
        [navigate, navLock, startTransition]
    );

    // prefetch khi hover nút
    const onHoverPrefetch = (postId) => {
        if (postId) prefetchBlogDetail(postId);
    };

    // Keyboard ← →
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "ArrowLeft" && navIds.prevId) fastGo(navIds.prevId);
            if (e.key === "ArrowRight" && navIds.nextId) fastGo(navIds.nextId);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [navIds.prevId, navIds.nextId, fastGo]);

    return {
        fastGo,
        onHoverPrefetch,
        navLock,
        pendingNavId,
    };
};
