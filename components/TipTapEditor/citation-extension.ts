// TODO: Implement a Mention-like extension that inserts an inline citation node with attrs { key, label }
// This will be implemented in a future step when we add citation functionality

import { Extension } from '@tiptap/core'

export const CitationExtension = Extension.create({
  name: 'citation',
  
  addOptions() {
    return {
      // Configuration options will go here
    }
  },
  
  addCommands() {
    return {
      // Citation commands will be added here
    }
  },
  
  addKeyboardShortcuts() {
    return {
      // Keyboard shortcuts for citations will be added here
    }
  }
})
