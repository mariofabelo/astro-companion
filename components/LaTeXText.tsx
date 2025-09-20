'use client';

import { renderLatexInText } from '@/lib/latex';

interface LaTeXTextProps {
  text: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Component that renders text with LaTeX math expressions
 * Automatically detects and renders $...$ and $$...$$ expressions
 */
export default function LaTeXText({ 
  text, 
  className = '', 
  as: Component = 'span' 
}: LaTeXTextProps) {
  if (!text) return null;

  const renderedHtml = renderLatexInText(text);

  return (
    <Component 
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

