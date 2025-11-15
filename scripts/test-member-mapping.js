// Test script to verify member code mapping
// Run: node scripts/test-member-mapping.js

import { loadGraduatedMember } from '../src/utils/graduatedMembersLoader.js';

const TEST_CODES = [
    { code: "36758", expected: "齋藤 飛鳥" },
    { code: "13470", expected: "生田 絵梨花" },
    { code: "38429", expected: "山下 美月" },
];

console.log("🔍 Testing member code mapping...\n");

for (const { code, expected } of TEST_CODES) {
    const member = await loadGraduatedMember(code);

    if (member) {
        const match = member.name === expected ? "✅" : "❌";
        console.log(`${match} Code ${code}:`);
        console.log(`   Expected: ${expected}`);
        console.log(`   Got: ${member.name}`);
        console.log(`   Folder: ${member.folder || 'N/A'}`);
        console.log(`   Image: ${member.img}\n`);
    } else {
        console.log(`❌ Code ${code}: NOT FOUND\n`);
    }
}

console.log("✅ Test completed!");
