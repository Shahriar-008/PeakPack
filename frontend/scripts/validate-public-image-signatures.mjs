import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const publicDir = path.join(projectRoot, 'public');

const signatures = {
  '.png': ['89 50 4e 47 0d 0a 1a 0a'],
  '.jpg': ['ff d8 ff'],
  '.jpeg': ['ff d8 ff'],
  '.webp': ['52 49 46 46'],
};

function readHexPrefix(filePath, byteCount = 12) {
  const file = fs.readFileSync(filePath);
  return Array.from(file.slice(0, byteCount))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join(' ');
}

function hasValidSignature(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const allowed = signatures[extension];
  if (!allowed) return { valid: true };

  const hexPrefix = readHexPrefix(filePath);
  const valid = allowed.some((sig) => hexPrefix.startsWith(sig));
  return { valid, hexPrefix, allowed, extension };
}

function collectImageFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectImageFiles(fullPath));
      continue;
    }

    if (/\.(png|jpe?g|webp)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

const imageFiles = collectImageFiles(publicDir);
const failures = [];

for (const filePath of imageFiles) {
  const result = hasValidSignature(filePath);
  if (!result.valid) {
    failures.push({
      filePath,
      extension: result.extension,
      hexPrefix: result.hexPrefix,
      expected: result.allowed.join(' or '),
    });
  }
}

if (failures.length > 0) {
  console.error('Image signature validation failed.\n');
  for (const failure of failures) {
    const relativePath = path.relative(projectRoot, failure.filePath);
    console.error(`- ${relativePath}`);
    console.error(`  extension: ${failure.extension}`);
    console.error(`  expected signature: ${failure.expected}`);
    console.error(`  actual signature:   ${failure.hexPrefix}\n`);
  }
  process.exit(1);
}

console.log(`Validated ${imageFiles.length} public image files. Signatures match extensions.`);
