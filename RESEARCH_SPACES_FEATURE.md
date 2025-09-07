# Research Spaces Feature

## Overview
This feature implements persistent research spaces that are saved to the user's account in the database, with context menu functionality for renaming and deleting spaces.

## Features Implemented

### 1. Database Integration
- **New Table**: `research_spaces` table in Supabase
- **Service Layer**: `ResearchSpacesService` class in `lib/research-spaces.ts`
- **Persistence**: Spaces are now saved to the database instead of just localStorage
- **Fallback**: localStorage is used as fallback if database operations fail

### 2. Context Menu for Recent Spaces
- **Three Dots Menu**: Appears on hover over recent spaces in the sidebar
- **Rename Option**: Allows users to rename spaces with a modal dialog
- **Delete Option**: Allows users to delete spaces with confirmation
- **Visual Feedback**: Smooth transitions and hover effects

### 3. Space Management
- **Create New Spaces**: Automatically saved to database when created
- **Update Spaces**: Changes are persisted to the database
- **Delete Spaces**: Removes spaces from both database and UI
- **Real-time Updates**: UI updates immediately when spaces are modified

## Database Schema

```sql
-- Research Spaces table
create table if not exists research_spaces (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  papers jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

## API Methods

### ResearchSpacesService
- `getSpaces()`: Fetch all spaces for the current user
- `createSpace(title, description, papers)`: Create a new space
- `updateSpace(id, updates)`: Update an existing space
- `deleteSpace(id)`: Delete a space

## Usage

### Creating a New Space
1. Click "Add New Papers" button
2. Choose "Find Papers" or "Upload Papers"
3. Create a new space with selected papers
4. Space is automatically saved to the database

### Renaming a Space
1. Hover over a recent space in the sidebar
2. Click the three dots menu that appears
3. Select "Rename"
4. Enter new name in the modal
5. Click "Rename" to save

### Deleting a Space
1. Hover over a recent space in the sidebar
2. Click the three dots menu that appears
3. Select "Delete"
4. Space is immediately removed from database and UI

## Migration Required

To use this feature, you need to run the database migration:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase/migrations/0002_research_spaces.sql
```

## Error Handling

- Database operations have try-catch blocks with fallback to localStorage
- User-friendly error messages in console
- Graceful degradation if database is unavailable

## Future Enhancements

- Bulk operations (rename/delete multiple spaces)
- Space sharing between users
- Space templates
- Export/import functionality
- Space categories or tags

