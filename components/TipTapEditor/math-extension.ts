// TODO: Implement a math extension for LaTeX rendering
// This will be implemented in a future step when we add math functionality

import { Extension } from '@tiptap/core'

export const MathExtension = Extension.create({
  name: 'math',
  
  addOptions() {
    return {
      // Configuration options will go here
    }
  },
  
  addCommands() {
    return {
      // Math commands will be added here
    }
  },
  
  addKeyboardShortcuts() {
    return {
      // Keyboard shortcuts for math will be added here
    }
  }
})
