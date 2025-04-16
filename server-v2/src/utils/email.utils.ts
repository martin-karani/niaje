// src/utils/email.utils.ts
import fs from "fs/promises";
import path from "path";

const EMAIL_TEMPLATES_DIR = path.join(process.cwd(), "src/templates/emails");

/**
 * Load email template from file
 */
export async function loadEmailTemplate(templateName: string): Promise<string> {
  try {
    const filePath = path.join(EMAIL_TEMPLATES_DIR, `${templateName}.html`);
    const template = await fs.readFile(filePath, "utf-8");
    return template;
  } catch (error) {
    console.error(`Error loading email template '${templateName}':`, error);
    // Return a basic template in case of error
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>{{title}}</h1>
        <p>Hello {{name}},</p>
        <p>This is a system-generated email. The requested template could not be loaded.</p>
        <p>Please contact support for assistance.</p>
      </div>
    `;
  }
}
