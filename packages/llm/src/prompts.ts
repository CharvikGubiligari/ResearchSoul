import * as fs from 'fs';
import * as path from 'path';

export interface PromptTemplate {
  name: string;
  content: string;
}

export function loadPromptTemplate(
  templatesDir: string,
  name: string,
): PromptTemplate {
  const filePath = path.join(templatesDir, `${name}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Prompt template not found: ${name}`);
  }
  return {
    name,
    content: fs.readFileSync(filePath, 'utf-8'),
  };
}

export function renderPrompt(
  template: string,
  variables: Record<string, string>,
): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) =>
      result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value),
    template,
  );
}
