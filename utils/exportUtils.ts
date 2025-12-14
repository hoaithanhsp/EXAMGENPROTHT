import MarkdownIt from 'markdown-it';
// @ts-ignore
import { asBlob } from 'html-docx-js-typescript';

// We intentionally DO NOT use katex plugin here.
// We want raw latex (e.g., $x^2$) to appear in the Word doc
// so teachers can use MathType or Word's LaTeX converter.
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true
});

export const exportToDoc = async (markdownContent: string, fileName: string) => {
  // Render Markdown to HTML 
  // Math will remain as $...$ text because we didn't add the katex plugin
  const htmlBody = md.render(markdownContent);

  // Basic styling for Word
  const css = `
    <style>
      body { 
        font-family: 'Times New Roman', serif; 
        font-size: 13pt; 
        line-height: 1.5; 
      }
      h1, h2, h3 { 
        font-weight: bold; 
        color: #000;
        margin-top: 1em;
        margin-bottom: 0.5em;
      }
      table { 
        border-collapse: collapse; 
        width: 100%; 
        margin-bottom: 20px; 
      }
      th, td { 
        border: 1px solid #000; 
        padding: 6px; 
        text-align: left; 
      }
      th { 
        background-color: #f2f2f2; 
      }
      p {
        margin-bottom: 1em;
      }
    </style>
  `;

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        ${css}
      </head>
      <body>
        ${htmlBody}
      </body>
    </html>
  `;

  try {
    // Generate DOCX Blob using html-docx-js-typescript
    const blob = await asBlob(fullHtml, {
      orientation: 'portrait',
      margins: { top: 720, right: 720, bottom: 720, left: 720 }
    });

    const url = URL.createObjectURL(blob as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("DOCX generation failed", error);
    alert("Không thể tạo file .docx. Vui lòng thử lại.");
  }
};