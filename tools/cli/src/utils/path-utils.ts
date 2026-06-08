import fs from 'fs';
import path from 'path';

export function getRepositoryRoot(): string {
  const __dirname = new URL('.', import.meta.url).pathname;
  return path.resolve(__dirname, '../../../..');
}

export function getAdaptersDirectory(): string {
  return path.join(getRepositoryRoot(), 'adapters');
}

export function getAdapterPath(dirName: string): string {
  return path.join(getAdaptersDirectory(), dirName);
}

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function directoryExists(dirPath: string): boolean {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

export function isDirectoryEmpty(dirPath: string): boolean {
  if (!directoryExists(dirPath)) return true;
  return fs.readdirSync(dirPath).length === 0;
}

export function writeFile(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  ensureDirectoryExists(dir);
  fs.writeFileSync(filePath, content, 'utf-8');
}

export function readTemplate(templatePath: string): string {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  return fs.readFileSync(templatePath, 'utf-8');
}

export function getExistingAdapters(): string[] {
  const adaptersDir = getAdaptersDirectory();
  if (!directoryExists(adaptersDir)) {
    return [];
  }
  return fs.readdirSync(adaptersDir).filter((name) => {
    const fullPath = path.join(adaptersDir, name);
    return fs.statSync(fullPath).isDirectory();
  });
}
