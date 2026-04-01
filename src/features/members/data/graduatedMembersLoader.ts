import { shouldUseLocalDB } from "../lib/localData";
/**
 * Graduated Members Loader
 * Auto-detect graduated members from blogdb/ folder
 */

const LOCAL_DB_PATH = "/blogdb";

// Known graduated members with local data
export const GRADUATED_MEMBERS = [
    {
        code: "36758",
        folder: "asuka.saito",
        name: "齋藤 飛鳥",
        englishName: "Saito Asuka",
        generation: "1期生",
        graduationDate: "2023.01.28",
        tags: ["1期生", "選抜メンバー", "福神"],
    },
    {
        code: "13470",
        folder: "erika.ikuta",
        name: "生田 絵梨花",
        englishName: "Ikuta Erika",
        generation: "1期生",
        graduationDate: "2022.01.31",
        tags: ["1期生", "選抜メンバー", "十二福神"],
    },
    {
        code: "13471",
        folder: "nanase.nishino",
        name: "西野 七瀬",
        englishName: "Nishino Nanase",
        generation: "1期生",
        graduationDate: "2018.09.02",
        tags: ["1期生", "選抜メンバー", "福神"],
    },
    {
        code: "38429",
        folder: "mizuki.yamashita",
        name: "山下 美月",
        englishName: "Yamashita Mizuki",
        generation: "3期生",
        graduationDate: "2024.09.28",
        tags: ["3期生", "選抜メンバー"],
    },
    {
        code: "38433",
        folder: "momoko.oozono",
        name: "大園 桃子",
        englishName: "Oozono Momoko",
        generation: "3期生",
        graduationDate: "2020.09.30",
        tags: ["3期生", "選抜メンバー"],
    },
    {
        code: "13472",
        folder: "nanami.hashimoto",
        name: "橋本 奈々未",
        englishName: "Hashimoto Nanami",
        generation: "1期生",
        graduationDate: "2017.02.20",
        tags: ["1期生", "選抜メンバー", "福神"],
    },
];

export { shouldUseLocalDB };

/**
 * Load graduated member info from local database
 * @param {string} memberCode - Member code
 * @returns {Promise<Object|null>} Member info with local data
 */
export const loadGraduatedMember = async (memberCode) => {
    const member = GRADUATED_MEMBERS.find(m => m.code === memberCode);
    if (!member) return null;

    try {
        // Load member.json
        const response = await fetch(`${LOCAL_DB_PATH}/${member.folder}/member.json`);
        if (!response.ok) return null;

        const localData = await response.json();

        // Transform intro array to flat structure for compatibility
        const introMap: {
            birthday?: string;
            blood?: string;
            constellation?: string;
            height?: string;
        } = {};
        if (Array.isArray(localData.intro)) {
            localData.intro.forEach((item) => {
                if (!item || typeof item !== "object") return;
                const key = typeof item.key === "string" ? item.key : "";
                const value = item.value ?? "";
                if (!key) return;

                if (key === "生年月日") introMap.birthday = value;
                else if (key === "血液型") introMap.blood = value;
                else if (key === "星座") introMap.constellation = value;
                else if (key === "身長") introMap.height = value;
            });
        }

        return {
            code: member.code,
            name: localData.name || member.name,
            kana: localData.name_hiragana || "",
            englishName: member.englishName,
            english_name: member.englishName, // Keep original format "Saito Asuka" for consistency with API
            nameHiragana: localData.name_hiragana,
            img: `${LOCAL_DB_PATH}/${member.folder}/${localData.image}`,
            cate: member.generation,
            groupcode: member.generation,
            graduation: "YES",
            graduationDate: member.graduationDate,
            // Flattened intro fields
            birthday: introMap.birthday || "",
            blood: introMap.blood || "",
            constellation: introMap.constellation || "",
            height: introMap.height || "",
            intro: localData.intro || [],
            tag: localData.tag || member.tags,
            link: `https://www.nogizaka46.com/s/n46/artist/${member.code}`,
            isGraduated: true,
            hasLocalData: true,
        };
    } catch (error) {
        console.warn(`Failed to load graduated member ${memberCode}:`, error);
        return null;
    }
};

/**
 * Load all graduated members from local database
 * @returns {Promise<Array>} Array of graduated member objects
 */
export const loadAllGraduatedMembers = async () => {
    const results = await Promise.allSettled(
        GRADUATED_MEMBERS.map(m => loadGraduatedMember(m.code))
    );

    return results
        .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof loadGraduatedMember>>> => (
            result.status === "fulfilled" && Boolean(result.value && typeof result.value === "object")
        ))
        .map((result) => result.value)
        .filter(Boolean);
};

/**
 * Check if a member code is graduated
 * @param {string} memberCode - Member code
 * @returns {boolean}
 */
export const isGraduatedMember = (memberCode) => {
    return GRADUATED_MEMBERS.some(m => m.code === String(memberCode));
};

/**
 * Get graduation info for a member
 * @param {string} memberCode - Member code
 * @returns {Object|null} Graduation info
 */
export const getGraduationInfo = (memberCode) => {
    const member = GRADUATED_MEMBERS.find(m => m.code === String(memberCode));
    if (!member) return null;

    return {
        graduationDate: member.graduationDate,
        generation: member.generation,
        hasLocalData: true,
    };
};
