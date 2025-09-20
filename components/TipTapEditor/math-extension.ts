import { Extension } from '@tiptap/core'
import { renderLatexInText } from '@/lib/latex'

export const MathExtension = Extension.create({
  name: 'math',
  
  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },
  
  addCommands() {
    return {
      insertMath: (latex: string) => ({ commands }: any) => {
        const rendered = renderLatexInText(`$${latex}$`)
        return commands.insertContent(rendered)
      },
    } as any
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-m': () => {
        // Simple shortcut to insert math - user can type LaTeX and it will be rendered
        return false // Let the user type $...$ naturally
      },
    }
  },
})
