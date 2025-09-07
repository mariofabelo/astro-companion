import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Renders LaTeX math expressions in text
 * Supports both inline ($...$) and display ($$...$$) math
 */
export function renderLatexInText(text: string): string {
  if (!text) return text;

  // Handle display math ($$...$$)
  let rendered = text.replace(/\$\$([^$]+)\$\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false,
      });
    } catch (error) {
      console.warn('LaTeX rendering error (display):', error);
      return match; // Return original text if rendering fails
    }
  });

  // Handle inline math ($...$)
  rendered = rendered.replace(/\$([^$]+)\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
    } catch (error) {
      console.warn('LaTeX rendering error (inline):', error);
      return match; // Return original text if rendering fails
    }
  });

  return rendered;
}

/**
 * Extracts LaTeX expressions from text and returns them as an array
 */
export function extractLatexExpressions(text: string): string[] {
  if (!text) return [];

  const expressions: string[] = [];
  
  // Extract display math ($$...$$)
  const displayMatches = text.match(/\$\$([^$]+)\$\$/g);
  if (displayMatches) {
    expressions.push(...displayMatches.map(match => match.slice(2, -2).trim()));
  }

  // Extract inline math ($...$)
  const inlineMatches = text.match(/\$([^$]+)\$/g);
  if (inlineMatches) {
    expressions.push(...inlineMatches.map(match => match.slice(1, -1).trim()));
  }

  return expressions;
}

/**
 * Checks if text contains LaTeX expressions
 */
export function hasLatexExpressions(text: string): boolean {
  if (!text) return false;
  return /\$[^$]+\$/.test(text);
}

/**
 * Renders a single LaTeX expression
 */
export function renderLatexExpression(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex.trim(), {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch (error) {
    console.warn('LaTeX rendering error:', error);
    return `$${latex}$`; // Return original expression if rendering fails
  }
}
