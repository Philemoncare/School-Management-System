import { Injectable } from '@nestjs/common';

@Injectable()
export class TemplateService {
  /**
   * Renders a template string by replacing variables in {{var_name}} format.
   * @param template The template string
   * @param variables Key-value pairs for replacement
   */
  render(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(.+?)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      return variables[trimmedKey] !== undefined ? String(variables[trimmedKey]) : match;
    });
  }
}
