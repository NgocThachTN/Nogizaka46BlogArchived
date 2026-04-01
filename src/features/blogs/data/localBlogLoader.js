/**
 * Local Blog Database Loader
 * Reads blog data from local blogdb/ folder as fallback/exception
 * Priority: Local DB → Online API
 */

const LOCAL_DB_PATH = "/blogdb";

// Map English names to folder names
const MEMBER_FOLDER_MAP = {
    "asuka.saito": ["齋藤 飛鳥", "Saito Asuka"],
    "erika.ikuta": ["生田 絵梨花", "Ikuta Erika"],
    "nanase.nishino": ["西野 七瀬", "Nishino Nanase"],
    "mizuki.yamashita": ["山下 美月", "Yamashita Mizuki"],
    "momoko.oozono": ["大園 桃子", "Oozono Momoko"],
    "nanami.hashimoto": ["橋本 奈々未", "Hashimoto Nanami"],
};

/**
 * Check if local blog data exists for a member
 * @param {string} memberName - Member name (Japanese or English)
 * @returns {Promise<string|null>} Folder name or null
 */
export const getLocalMemberFolder = async (memberName) => {
    if (!memberName) return null;

    const normalized = memberName.trim();

    for (const [folder, names] of Object.entries(MEMBER_FOLDER_MAP)) {
        if (names.some(n => n === normalized || normalized.includes(n.split(" ")[1]))) {
            try {
                // Try to fetch member.json to verify folder exists
                const response = await fetch(`${LOCAL_DB_PATH}/${folder}/member.json`);
                if (response.ok) return folder;
            } catch {
                continue;
            }
        }
    }

    return null;
};

/**
 * Load member info from local database
 * @param {string} folderName - Folder name (e.g., "asuka.saito")
 * @returns {Promise<Object|null>} Member info
 */
export const loadLocalMemberInfo = async (folderName) => {
    try {
        const response = await fetch(`${LOCAL_DB_PATH}/${folderName}/member.json`);
        if (!response.ok) return null;

        const data = await response.json();
        return {
            name: data.name,
            nameHiragana: data.name_hiragana,
            intro: data.intro || [],
            image: `${LOCAL_DB_PATH}/${folderName}/${data.image}`,
            tag: data.tag || [],
        };
    } catch (error) {
        console.warn(`Failed to load local member info for ${folderName}:`, error);
        return null;
    }
};

/**
 * Load blog list from local database
 * @param {string} folderName - Folder name (e.g., "asuka.saito")
 * @returns {Promise<Array>} Array of blog entries
 */
export const loadLocalBlogs = async (folderName) => {
    try {
        const response = await fetch(`${LOCAL_DB_PATH}/${folderName}/result.json`);
        if (!response.ok) return [];

        const blogs = await response.json();

        // Check if it's array (valid data) or empty object/null
        if (!Array.isArray(blogs) || blogs.length === 0) {
            console.warn(`Local blog data empty for ${folderName}`);
            return [];
        }

        // Transform local format to app format
        return blogs.map((blog, index) => {
            // Extract first image from content as thumbnail
            const imgMatch = blog.content?.match(/src="(img\/[^"]+)"/);
            let thumbnailPath = "";

            if (imgMatch) {
                thumbnailPath = `${LOCAL_DB_PATH}/${folderName}/${imgMatch[1]}`;
            } else {
                // Fallback to Nogizaka46 logo if no image found
                thumbnailPath = "/images/Nogizaka46_logo.svg";
            }

            return {
                id: blog.url?.match(/detail\/(\d+)/)?.[1] || `local-${folderName}-${index}`,
                title: blog.title || "Untitled",
                date: blog.datetime || "",
                content: optimizeLocalContent(blog.content || "", folderName),
                link: blog.url || "",
                thumbnail: thumbnailPath,
                author: "", // Will be filled from member.json
                memberCode: "", // Will be mapped from folder name
                originalUrl: blog.url || "",
            };
        });
    } catch (error) {
        console.warn(`Failed to load local blogs for ${folderName}:`, error);
        return [];
    }
};

/**
 * Optimize local content - fix relative image paths
 * @param {string} content - HTML content
 * @param {string} folderName - Folder name for path resolution
 * @returns {string} Optimized content
 */
const optimizeLocalContent = (content, folderName) => {
    if (!content) return "";

    // Fix relative image paths: img/files/... → /blogdb/[folder]/img/files/...
    return content
        .replace(
            /src="img\//g,
            `src="${LOCAL_DB_PATH}/${folderName}/img/`
        )
        .replace(
            /src='img\//g,
            `src='${LOCAL_DB_PATH}/${folderName}/img/`
        );
};

/**
 * Load blog links from local database
 * @param {string} folderName - Folder name (e.g., "asuka.saito")
 * @returns {Promise<Array>} Array of link objects
 */
export const loadLocalLinks = async (folderName) => {
    try {
        const response = await fetch(`${LOCAL_DB_PATH}/${folderName}/link.json`);
        if (!response.ok) return [];

        return await response.json();
    } catch (error) {
        console.warn(`Failed to load local links for ${folderName}:`, error);
        return [];
    }
};

/**
 * Check if we should use local database
 * Conditions: 
 * 1. Environment variable flag enabled
 * 2. Development mode
 * 3. Member has local data available
 */
export const shouldUseLocalDB = () => {
    // Allow override via environment variable
    if (import.meta.env.VITE_USE_LOCAL_DB === "true") return true;

    // Auto-enable in development mode
    if (import.meta.env.DEV) return true;

    return false;
};

/**
 * Get member code from folder name (reverse mapping)
 * This requires fetching from online API or predefined mapping
 */
export const getMemberCodeFromFolder = (folderName) => {
    const CODE_MAP = {
        "asuka.saito": "36758",
        "erika.ikuta": "13470",
        "nanase.nishino": "13471",
        "mizuki.yamashita": "38429",
        "momoko.oozono": "38433",
        "nanami.hashimoto": "13472",
    };

    return CODE_MAP[folderName] || null;
};

/**
 * Get folder name from member code (forward mapping)
 */
export const getFolderFromMemberCode = (memberCode) => {
    const FOLDER_MAP = {
        "36758": "asuka.saito",
        "13470": "erika.ikuta",
        "13471": "nanase.nishino",
        "38429": "mizuki.yamashita",
        "38433": "momoko.oozono",
        "13472": "nanami.hashimoto",
    };

    return FOLDER_MAP[String(memberCode)] || null;
};
