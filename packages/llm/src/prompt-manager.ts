import * as fs from 'fs';
import * as path from 'path';

/** PDF Module 24 — Prompt Management */
export interface PromptVersion {
  name: string;
  version: number;
  content: string;
  category: string;
  isActive: boolean;
}

export class PromptManager {
  private templates = new Map<string, PromptVersion[]>();

  constructor(private templatesDir: string) {
    this.loadFromDirectory(templatesDir);
  }

  loadFromDirectory(dir: string) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    for (const file of files) {
      const name = file.replace('.md', '');
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      this.register({ name, version: 1, content, category: 'default', isActive: true });
    }
  }

  register(prompt: PromptVersion) {
    const existing = this.templates.get(prompt.name) ?? [];
    existing.push(prompt);
    existing.sort((a, b) => b.version - a.version);
    this.templates.set(prompt.name, existing);
  }

  get(name: string, version?: number): PromptVersion {
    const versions = this.templates.get(name);
    if (!versions?.length) {
      throw new Error(`Prompt not found: ${name}`);
    }
    if (version !== undefined) {
      const found = versions.find((v) => v.version === version);
      if (!found) throw new Error(`Prompt version not found: ${name} v${version}`);
      return found;
    }
    const active = versions.find((v) => v.isActive) ?? versions[0];
    return active;
  }

  render(name: string, variables: Record<string, string>, version?: number): string {
    const template = this.get(name, version).content;
    return Object.entries(variables).reduce(
      (result, [key, value]) => result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value),
      template,
    );
  }

  list(): PromptVersion[] {
    return Array.from(this.templates.values()).flat().filter((v) => v.isActive);
  }

  /** A/B testing — select variant by ratio */
  selectVariant(name: string, ratio = 0.5): PromptVersion {
    const versions = this.templates.get(name) ?? [];
    if (versions.length <= 1) return this.get(name);
    return Math.random() < ratio ? versions[0] : versions[1];
  }
}
