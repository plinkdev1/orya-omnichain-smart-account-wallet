import { ChainConfig } from '../types.js';
import { writeFile, ensureDirectoryExists } from '../utils/path-utils.js';

export interface GeneratedFile {
  path: string;
  content: string;
}

export abstract class BaseGenerator {
  protected chainKey: string;
  protected config: ChainConfig;
  protected adapterPath: string;

  constructor(chainKey: string, config: ChainConfig, adapterPath: string) {
    this.chainKey = chainKey;
    this.config = config;
    this.adapterPath = adapterPath;
  }

  abstract generate(): GeneratedFile[];

  protected createFile(relativePath: string, content: string): GeneratedFile {
    return {
      path: `${this.config.dirName}/${relativePath}`,
      content,
    };
  }

  writeFiles(files: GeneratedFile[]): void {
    ensureDirectoryExists(this.adapterPath);

    for (const file of files) {
      const fullPath = `${this.adapterPath}/${file.path.replace(`${this.config.dirName}/`, '')}`;
      writeFile(fullPath, file.content);
    }
  }

  protected interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return vars[key] || match;
    });
  }

  protected toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  protected toKebabCase(str: string): string {
    return str
      .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
      .toLowerCase();
  }
}
