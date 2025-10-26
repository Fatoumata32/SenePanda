/**
 * Script to fix MediaTypeOptions deprecated warning
 * and blob.arrayBuffer issues in image upload functions
 *
 * Usage: node scripts/fix-image-picker.js
 */

const fs = require('fs');
const path = require('path');

const files = [
  'app/seller/add-product.tsx',
  'app/seller/shop-wizard.tsx',
];

let fixedCount = 0;

files.forEach((file) => {
  const filePath = path.join(process.cwd(), file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Fix MediaTypeOptions
  if (content.includes('ImagePicker.MediaTypeOptions.Images')) {
    content = content.replace(
      /ImagePicker\.MediaTypeOptions\.Images/g,
      "['images']"
    );
    modified = true;
    console.log(`✅ Fixed MediaTypeOptions in: ${file}`);
  }

  // Fix blob.arrayBuffer in uploadImage function
  if (content.includes('blob.arrayBuffer()')) {
    // Add FileSystem import if not present
    if (!content.includes("import * as FileSystem from 'expo-file-system'")) {
      content = content.replace(
        /(import \* as ImagePicker from 'expo-image-picker';)/,
        "$1\nimport * as FileSystem from 'expo-file-system';"
      );
    }

    // Replace the uploadImage function implementation
    const uploadImageRegex = /(const uploadImage = async \(uri: string[^)]*\) => \{[\s\S]*?)(const response = await fetch\(uri\);[\s\S]*?const arrayBuffer = await blob\.arrayBuffer\(\);)([\s\S]*?return publicUrl;[\s\S]*?\};)/;

    content = content.replace(
      uploadImageRegex,
      `$1// Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      // Convert base64 to Uint8Array
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);$3`
    );

    modified = true;
    console.log(`✅ Fixed blob.arrayBuffer in: ${file}`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    fixedCount++;
  } else {
    console.log(`⏭️  No changes needed: ${file}`);
  }
});

console.log(`\n✅ Done! Fixed ${fixedCount} files.`);
