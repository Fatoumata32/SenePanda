/**
 * Script to replace deprecated SafeAreaView from react-native
 * with SafeAreaView from react-native-safe-area-context
 *
 * Usage: node scripts/fix-safe-area-view.js
 */

const fs = require('fs');
const path = require('path');

const files = [
  'app/(tabs)/profile.tsx',
  'app/seller/add-product.tsx',
  'app/seller/shop-wizard.tsx',
  'app/(tabs)/index.tsx',
  'app/orders.tsx',
  'app/seller/orders.tsx',
  'app/checkout.tsx',
  'app/(tabs)/cart.tsx',
  'app/seller/products.tsx',
  'app/seller/setup.tsx',
  'app/product/[id].tsx',
  'app/(tabs)/explore.tsx',
];

let fixedCount = 0;

files.forEach((file) => {
  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if file uses SafeAreaView from react-native
  if (content.includes('SafeAreaView') && !content.includes("from 'react-native-safe-area-context'")) {
    // Replace import
    content = content.replace(
      /^(import\s+{[^}]*)(SafeAreaView)([^}]*}\s+from\s+'react-native';)/gm,
      (match, before, safeAreaView, after) => {
        // Remove SafeAreaView from react-native import
        const cleaned = (before + after)
          .replace(/,\s*,/g, ',')
          .replace(/{\s*,/g, '{')
          .replace(/,\s*}/g, '}');
        return cleaned;
      }
    );

    // Add new import for SafeAreaView if not already present
    if (!content.includes("from 'react-native-safe-area-context'")) {
      // Find the last import statement
      const lastImportMatch = content.match(/^import\s+.*?;/gm);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        content = content.replace(
          lastImport,
          lastImport + "\nimport { SafeAreaView } from 'react-native-safe-area-context';"
        );
      }
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${file}`);
    fixedCount++;
  } else {
    console.log(`⏭️  Skipped: ${file} (already using safe-area-context or no SafeAreaView)`);
  }
});

console.log(`\n✅ Done! Fixed ${fixedCount} files.`);
