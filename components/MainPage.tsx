'use client';

import { useState, useEffect } from 'react';
import { Paper, Source } from '@/types/paper';
import { createSupabaseBrowser } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import ChatLLMInterface from './ChatLLMInterface';
import FileUploader from './FileUploader';
import PaperSearchResults from './PaperSearchResults';
import ResearchSpaceView from './ResearchSpaceView';
import { useMutation } from '@tanstack/react-query';
import { researchSpacesService, ResearchSpace } from '@/lib/research-spaces';
import { IoWarning } from 'react-icons/io5';

// ResearchSpace interface is now imported from lib/research-spaces

type Mode = 'find-papers' | 'upload-papers';
type ViewMode = 'main' | 'space';

export default function MainPage() {
  const [currentSpace, setCurrentSpace] = useState<ResearchSpace | null>(null);
  const [researchSpaces, setResearchSpaces] = useState<ResearchSpace[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [mode, setMode] = useState<Mode>('find-papers');
  const [inputValue, setInputValue] = useState('');
  const [externalInput, setExternalInput] = useState('');
  const [selectedSources, setSelectedSources] = useState<Source[]>(['arXiv']);
  const [maxResults, setMaxResults] = useState<2 | 3 | 5 | 10>(5);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
  const [showUserProfilePopup, setShowUserProfilePopup] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showAddPapersModal, setShowAddPapersModal] = useState(false);
  const [contextMenuSpace, setContextMenuSpace] = useState<ResearchSpace | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [spaceToRename, setSpaceToRename] = useState<ResearchSpace | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ResearchSpace | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  // Load user and sessions on mount
  useEffect(() => {
    const loadUserAndSpaces = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Loaded user:', user?.email); // Debug log
      setUser(user);
      
      if (user) {
        // Load spaces from database
        try {
          const spaces = await researchSpacesService.getSpaces();
          setResearchSpaces(spaces);
        } catch (error) {
          console.error('Error loading spaces from database:', error);
          // Fallback to localStorage if database fails
          const savedSpaces = localStorage.getItem('astro-research-spaces');
          if (savedSpaces) {
            try {
              setResearchSpaces(JSON.parse(savedSpaces));
            } catch (parseError) {
              console.error('Error loading spaces from localStorage:', parseError);
            }
          }
        }
      }
    };
    loadUserAndSpaces();
  }, [supabase]);

  // Save spaces to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('astro-research-spaces', JSON.stringify(researchSpaces));
  }, [researchSpaces]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserProfilePopup) {
        const popup = document.getElementById('user-profile-popup');
        const profileCard = document.getElementById('user-profile-card');
        const profileCardCollapsed = document.getElementById('user-profile-card-collapsed');
        
        if (popup && !popup.contains(event.target as Node) && 
            profileCard && !profileCard.contains(event.target as Node) &&
            profileCardCollapsed && !profileCardCollapsed.contains(event.target as Node)) {
          setShowUserProfilePopup(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserProfilePopup]);

  const handleNewSpace = async () => {
    try {
      const newSpace = await researchSpacesService.createSpace(
        'New Research Space',
        'Start exploring research papers...',
        []
      );
      
      if (newSpace) {
        setCurrentSpace(newSpace);
        setResearchSpaces(prev => [newSpace, ...prev]);
      }
    } catch (error) {
      console.error('Error creating new space:', error);
      // Fallback to local creation if database fails
      const fallbackSpace: ResearchSpace = {
        id: Date.now().toString(),
        title: 'New Research Space',
        description: 'Start exploring research papers...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        papers: []
      };
      setCurrentSpace(fallbackSpace);
      setResearchSpaces(prev => [fallbackSpace, ...prev]);
    }
  };

  const handleAddNewPapers = () => {
    setShowAddPapersModal(true);
  };

  const handleModeSelection = (selectedMode: Mode) => {
    setMode(selectedMode);
    setShowAddPapersModal(false);
    // Clear any selected space when adding new papers
    setCurrentSpace(null);
    // If in space view, switch back to main view to show the selected mode
    if (viewMode === 'space') {
      setViewMode('main');
    }
  };

  const handleSpaceSelect = (space: ResearchSpace) => {
    setCurrentSpace(space);
    setViewMode('space');
  };

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const handleAddToSpace = async (papers: Paper[], spaceId: string) => {
    try {
      // Find the space to update
      const spaceToUpdate = researchSpaces.find(space => space.id === spaceId);
      if (!spaceToUpdate) return;

      // Filter out papers that are already in the space
      const newPapers = papers.filter(paper => 
        !spaceToUpdate.papers.some(p => p.id === paper.id)
      );

      if (newPapers.length === 0) return; // No new papers to add

      // Update the space in the database
      const updatedSpace = await researchSpacesService.updateSpace(spaceId, {
        papers: [...spaceToUpdate.papers, ...newPapers]
      });

      if (updatedSpace) {
        // Update local state
        const updatedSpaces = researchSpaces.map(space => 
          space.id === spaceId ? updatedSpace : space
        );
        setResearchSpaces(updatedSpaces);
        
        // Update current space if it's the one being modified
        if (currentSpace?.id === spaceId) {
          setCurrentSpace(updatedSpace);
        }

        // Show success message
        const paperCount = newPapers.length;
        const spaceName = spaceToUpdate.title;
        showSuccessMessage(
          `Successfully added ${paperCount} paper${paperCount !== 1 ? 's' : ''} to "${spaceName}"`
        );
      }
    } catch (error) {
      console.error('Error adding papers to space:', error);
      // Fallback to local update if database fails
      const updatedSpaces = researchSpaces.map(space => {
        if (space.id === spaceId) {
          const newPapers = papers.filter(paper => 
            !space.papers.some(p => p.id === paper.id)
          );
          return {
            ...space,
            papers: [...space.papers, ...newPapers]
          };
        }
        return space;
      });
      setResearchSpaces(updatedSpaces);
      
      // Update current space if it's the one being modified
      if (currentSpace?.id === spaceId) {
        const updatedSpace = updatedSpaces.find(s => s.id === spaceId);
        if (updatedSpace) {
          setCurrentSpace(updatedSpace);
        }
      }

      // Show success message for fallback case
      const spaceToUpdate = researchSpaces.find(space => space.id === spaceId);
      if (spaceToUpdate) {
        const newPapers = papers.filter(paper => 
          !spaceToUpdate.papers.some(p => p.id === paper.id)
        );
        const paperCount = newPapers.length;
        if (paperCount > 0) {
          showSuccessMessage(
            `Successfully added ${paperCount} paper${paperCount !== 1 ? 's' : ''} to "${spaceToUpdate.title}"`
          );
        }
      }
    }
  };

  const handleCreateNewSpace = async (papers: Paper[], spaceTitle: string) => {
    try {
      console.log('Creating new space with papers:', { spaceTitle, papersCount: papers.length, papers });
      
      const newSpace = await researchSpacesService.createSpace(
        spaceTitle,
        `Research space with ${papers.length} paper${papers.length !== 1 ? 's' : ''}`,
        papers
      );
      
      console.log('Created space from database:', newSpace);
      
      if (newSpace) {
        setResearchSpaces(prev => [newSpace, ...prev]);
        setCurrentSpace(newSpace);
        setViewMode('space');
        console.log('Updated state with new space:', newSpace);
        
        // Show success message
        const paperCount = papers.length;
        showSuccessMessage(
          `Successfully created "${spaceTitle}" with ${paperCount} paper${paperCount !== 1 ? 's' : ''}`
        );
      } else {
        console.error('Failed to create space - newSpace is null');
      }
    } catch (error) {
      console.error('Error creating new space:', error);
      // Fallback to local creation if database fails
      const fallbackSpace: ResearchSpace = {
        id: Date.now().toString(),
        title: spaceTitle,
        description: `Research space with ${papers.length} paper${papers.length !== 1 ? 's' : ''}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        papers: papers
      };
      console.log('Using fallback space:', fallbackSpace);
      setResearchSpaces(prev => [fallbackSpace, ...prev]);
      setCurrentSpace(fallbackSpace);
      setViewMode('space');
      
      // Show success message for fallback case
      const paperCount = papers.length;
      showSuccessMessage(
        `Successfully created "${spaceTitle}" with ${paperCount} paper${paperCount !== 1 ? 's' : ''}`
      );
    }
  };

  const handleUpdateSpace = async (updatedSpace: ResearchSpace) => {
    try {
      // Update the space in the database
      const dbUpdatedSpace = await researchSpacesService.updateSpace(updatedSpace.id, {
        title: updatedSpace.title,
        description: updatedSpace.description,
        papers: updatedSpace.papers
      });

      if (dbUpdatedSpace) {
        // Update local state with the database result
        setResearchSpaces(prev => 
          prev.map(s => s.id === updatedSpace.id ? dbUpdatedSpace : s)
        );
        setCurrentSpace(dbUpdatedSpace);
      } else {
        // Fallback to local update if database fails
        setResearchSpaces(prev => 
          prev.map(s => s.id === updatedSpace.id ? updatedSpace : s)
        );
        setCurrentSpace(updatedSpace);
      }
    } catch (error) {
      console.error('Error updating space:', error);
      // Fallback to local update if database fails
      setResearchSpaces(prev => 
        prev.map(s => s.id === updatedSpace.id ? updatedSpace : s)
      );
      setCurrentSpace(updatedSpace);
    }
  };

  const handleBackToMain = () => {
    setViewMode('main');
    setCurrentSpace(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleContextMenu = (e: React.MouseEvent, space: ResearchSpace) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuSpace(space);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleRenameSpace = () => {
    if (contextMenuSpace) {
      setSpaceToRename(contextMenuSpace);
      setRenameValue(contextMenuSpace.title);
      setShowRenameModal(true);
      setContextMenuSpace(null);
    }
  };

  const handleDeleteSpace = () => {
    if (contextMenuSpace) {
      setShowDeleteConfirm(contextMenuSpace);
      setContextMenuSpace(null);
    }
  };

  const handleConfirmDeleteSpace = async () => {
    if (showDeleteConfirm) {
      try {
        const success = await researchSpacesService.deleteSpace(showDeleteConfirm.id);
        if (success) {
          setResearchSpaces(prev => prev.filter(s => s.id !== showDeleteConfirm.id));
          if (currentSpace?.id === showDeleteConfirm.id) {
            setCurrentSpace(null);
            setViewMode('main');
          }
        }
      } catch (error) {
        console.error('Error deleting space:', error);
      }
      setShowDeleteConfirm(null);
    }
  };

  const handleCancelDeleteSpace = () => {
    setShowDeleteConfirm(null);
  };

  const handleRenameSubmit = async () => {
    if (!renameValue.trim() || !spaceToRename) return;
    
    try {
      const updatedSpace = await researchSpacesService.updateSpace(spaceToRename.id, {
        title: renameValue.trim()
      });
      
      if (updatedSpace) {
        setResearchSpaces(prev => 
          prev.map(s => s.id === updatedSpace.id ? updatedSpace : s)
        );
        if (currentSpace?.id === updatedSpace.id) {
          setCurrentSpace(updatedSpace);
        }
      }
    } catch (error) {
      console.error('Error renaming space:', error);
    }
    
    setShowRenameModal(false);
    setRenameValue('');
    setSpaceToRename(null);
  };

  const closeContextMenu = () => {
    setContextMenuSpace(null);
    setContextMenuPosition(null);
  };

  const handleInputSubmit = () => {
    if (!inputValue.trim()) return;
    
    // Handle the input based on mode
    if (mode === 'find-papers') {
      // Search for papers directly
      searchMutation.mutate({ 
        query: inputValue.trim(), 
        maxResults, 
        sources: selectedSources 
      });
    } else {
      // Pass the input to ChatLLMInterface for processing
      setExternalInput(inputValue);
    }
    
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  const handleSourceToggle = (source: Source) => {
    setSelectedSources(prev => {
      if (prev.includes(source)) {
        return prev.filter(s => s !== source);
      } else {
        return [...prev, source];
      }
    });
  };

  const handleMaxResultsChange = (maxResults: 2 | 3 | 5 | 10) => {
    setMaxResults(maxResults);
  };

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async ({ query, maxResults, sources }: { query: string; maxResults: 2 | 3 | 5 | 10; sources: Source[] }) => {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, maxResults, sources }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data.papers);
      setShowSearchResults(true);
    },
    onError: (error) => {
      console.error('Search error:', error);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex font-sf">
      {/* Sidebar */}
      <div className={`bg-white/90 backdrop-blur-sm border-r border-slate-200/60 transition-all duration-300 ${
        sidebarCollapsed ? 'w-24' : 'w-80'
      }`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className={`${sidebarCollapsed ? 'hidden' : 'block'}`}>
              <h1 className="text-2xl font-bold text-slate-900">Rastro</h1>
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-8 h-8 rounded-lg bg-white/70 border border-slate-200/60 hover:bg-white/90 transition-colors shadow-sm backdrop-blur-sm flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Add New Papers Button */}
          <button
            onClick={handleAddNewPapers}
            className={`bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center shadow-lg shadow-blue-500/25 overflow-hidden h-12 ${
              sidebarCollapsed 
                ? 'w-12 rounded-xl mx-auto' 
                : 'w-full rounded-xl gap-2'
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span 
              className={`transition-all duration-300 whitespace-nowrap text-sm ${
                sidebarCollapsed 
                  ? 'opacity-0 w-0 overflow-hidden' 
                  : 'opacity-100 w-auto'
              }`}
            >
              Add New Papers
            </span>
          </button>

          {/* Research Spaces */}
          {!sidebarCollapsed && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Spaces</h3>
              {researchSpaces.slice(0, 3).map((space) => (
                <div
                  key={space.id}
                  className={`p-4 rounded-xl cursor-pointer transition-colors border backdrop-blur-sm relative group ${
                    currentSpace?.id === space.id
                      ? 'border-blue-200 bg-blue-50/90 shadow-sm'
                      : 'border-slate-200/60 bg-white/70 hover:bg-white/90 hover:shadow-md'
                  }`}
                >
                  <div 
                    onClick={() => handleSpaceSelect(space)}
                    className="flex justify-between items-start mb-1"
                  >
                    <h4 className="text-sm font-semibold text-slate-900 truncate">{space.title}</h4>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-slate-400">{space.timestamp}</span>
                      {/* Three dots menu */}
                      <button
                        onClick={(e) => handleContextMenu(e, space)}
                        className="p-1 rounded-full hover:bg-slate-200/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{space.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* User Profile */}
          {!sidebarCollapsed && user && (
            <div className="absolute bottom-4 left-4 right-4">
              <div 
                id="user-profile-card"
                onClick={() => setShowUserProfilePopup(!showUserProfilePopup)}
                className="border-t border-slate-200/60 pt-4 cursor-pointer hover:bg-slate-50/50 rounded-lg p-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{user.email}</p>
                    <p className="text-xs text-blue-600 font-semibold">Pro Plan</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed Profile Icon (Gmail-style) */}
          {sidebarCollapsed && user && (
            <div className="absolute bottom-4 left-4 right-4">
              <div 
                id="user-profile-card-collapsed"
                onClick={() => setShowUserProfilePopup(!showUserProfilePopup)}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 mx-auto"
              >
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          )}

          {/* User Profile Popup */}
          {showUserProfilePopup && (
            <div className={`fixed z-50 ${
              sidebarCollapsed ? 'left-6 bottom-20' : 'left-6 bottom-20'
            }`} style={{ width: '320px' }}>
              <div id="user-profile-popup" className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden backdrop-blur-sm w-full">
                {/* User Info Header */}
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user?.email}</p>
                      <p className="text-xs text-blue-600 font-semibold">Pro Plan</p>
                    </div>
                  </div>
                </div>

                {/* Menu Options */}
                <div className="py-1">
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      // Handle manage plan
                      setShowUserProfilePopup(false);
                    }}
                  >
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Manage Plan
                  </button>
                  
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      // Handle settings
                      setShowUserProfilePopup(false);
                    }}
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                  
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    onClick={() => {
                      // Handle help
                      setShowUserProfilePopup(false);
                    }}
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help
                  </button>
                </div>

                {/* Separator */}
                <div className="border-t border-slate-200"></div>

                {/* Log Out */}
                <div className="py-1">
                  <button 
                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    onClick={async () => {
                      await handleSignOut();
                      setShowUserProfilePopup(false);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'space' && currentSpace ? (
        <div className="flex-1 w-full">
          <ResearchSpaceView
            space={currentSpace}
            onBack={handleBackToMain}
            onUpdateSpace={handleUpdateSpace}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-2">
          <div className="w-full max-w-4xl">
            {/* Greeting */}
            <div className="text-center mb-2">
              <p className="text-xl text-slate-700 max-w-2xl mx-auto font-medium">
                What do you want to research?
              </p>
            </div>


            {/* Content Container */}
            <div className="p-2">
                {mode === 'find-papers' ? (
                  <div className="space-y-3 flex flex-col items-center">
                    {/* Input Area */}
                    <div className="space-y-3 w-full max-w-3xl">
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search for papers on any topic..."
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-base leading-relaxed shadow-lg shadow-slate-200/50 font-sf"
                        rows={3}
                        disabled={searchMutation.isPending}
                      />
                      
                      {/* Submit Button and Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          {/* Sources */}
                          <div className="relative">
                            <span className="text-slate-600 mr-2 font-medium">Sources:</span>
                            <button
                              onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                              className="bg-slate-100 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium border border-slate-200"
                            >
                              {selectedSources.join(', ')}
                            </button>
                            {showSourceDropdown && (
                              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-slate-200 p-2 z-10 shadow-lg">
                                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedSources.includes('arXiv')}
                                    onChange={() => handleSourceToggle('arXiv')}
                                    className="rounded"
                                  />
                                  arXiv
                                </label>
                                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedSources.includes('ads')}
                                    onChange={() => handleSourceToggle('ads')}
                                    className="rounded"
                                  />
                                  ADS
                                </label>
                              </div>
                            )}
                          </div>

                          {/* Results Count */}
                          <div className="relative">
                            <button
                              onClick={() => setShowResultsDropdown(!showResultsDropdown)}
                              className="bg-slate-100 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm font-medium border border-slate-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {maxResults} results
                            </button>
                            {showResultsDropdown && (
                              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-slate-200 p-2 z-10 shadow-lg">
                                {[2, 3, 5, 10].map((num) => (
                                  <button
                                    key={num}
                                    onClick={() => {
                                      handleMaxResultsChange(num as 2 | 3 | 5 | 10);
                                      setShowResultsDropdown(false);
                                    }}
                                    className={`block w-full text-left px-2 py-1 rounded text-sm ${
                                      maxResults === num
                                        ? 'bg-blue-100 text-blue-700 font-semibold'
                                        : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                                  >
                                    {num} results
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={handleInputSubmit}
                          disabled={!inputValue.trim() || searchMutation.isPending}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-8 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {searchMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Searching...
                            </>
                          ) : (
                            <>
                              <span>Search Papers</span>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Chat Interface for Upload Mode */}
                    <div className="w-full max-w-4xl">
                      <ChatLLMInterface
                      onAddToSession={(papers) => {
                        if (currentSpace) {
                          const updatedSpace = {
                            ...currentSpace,
                            papers: [...currentSpace.papers, ...papers.filter(paper => 
                              !currentSpace.papers.some(p => p.id === paper.id)
                            )]
                          };
                          setCurrentSpace(updatedSpace);
                          setResearchSpaces(prev => 
                            prev.map(s => s.id === updatedSpace.id ? updatedSpace : s)
                          );
                        }
                      }}
                      currentSessionPapers={currentSpace?.papers || []}
                      externalInput={externalInput}
                      onInputProcessed={() => setExternalInput('')}
                      selectedSources={selectedSources}
                      maxResults={maxResults}
                      onSourceToggle={handleSourceToggle}
                      onMaxResultsChange={handleMaxResultsChange}
                      showSourceDropdown={showSourceDropdown}
                      showResultsDropdown={showResultsDropdown}
                      onShowSourceDropdownToggle={() => setShowSourceDropdown(!showSourceDropdown)}
                      onShowResultsDropdownToggle={() => setShowResultsDropdown(!showResultsDropdown)}
                    />
                      </div>
                    </div>
                ) : (
                  <FileUploader 
                    onPaperProcessed={(paperId, paperData) => {
                      console.log('Paper processed successfully:', paperId, paperData);
                    }}
                    researchSpaces={researchSpaces}
                    onAddToSpace={handleAddToSpace}
                    onCreateNewSpace={handleCreateNewSpace}
                  />
                )}

                {/* Mode Selection */}
                <div className="mt-3 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-center gap-4">
                    <span className="text-sm font-semibold text-slate-600">Mode:</span>
                    <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
                      <button
                        onClick={() => setMode('find-papers')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          mode === 'find-papers'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Find Papers
                      </button>
                      <button
                        onClick={() => setMode('upload-papers')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          mode === 'upload-papers'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Upload Papers
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* Search Results Modal */}
      {showSearchResults && (
        <PaperSearchResults
          searchResults={searchResults}
          researchSpaces={researchSpaces}
          onAddToSpace={handleAddToSpace}
          onCreateNewSpace={handleCreateNewSpace}
          onClose={() => setShowSearchResults(false)}
        />
      )}

      {/* Add New Papers Modal */}
      {showAddPapersModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Add New Papers</h2>
                <button
                  onClick={() => setShowAddPapersModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-slate-600 mb-6">
                Choose how you'd like to add papers to your research:
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleModeSelection('find-papers')}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Find Papers</h3>
                      <p className="text-sm text-slate-600">Search and discover papers from arXiv and ADS</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleModeSelection('upload-papers')}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Upload Papers</h3>
                      <p className="text-sm text-slate-600">Upload PDF files from your computer</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenuSpace && contextMenuPosition && (
        <div className="fixed inset-0 z-50" onClick={closeContextMenu}>
          <div className="absolute bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[120px]"
               style={{
                 top: contextMenuPosition.y,
                 left: contextMenuPosition.x + 10,
                 transform: 'translateY(-50%)'
               }}
               onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleRenameSpace}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Rename
            </button>
            <button
              onClick={handleDeleteSpace}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Rename Space</h2>
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Space Name
                  </label>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameSubmit();
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter space name..."
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowRenameModal(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRenameSubmit}
                    disabled={!renameValue.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Rename
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-none z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <IoWarning className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Research Space</h3>
                <p className="text-sm text-slate-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-slate-700 mb-6">
              Are you sure you want to delete &quot;{showDeleteConfirm.title}&quot;? 
              This will permanently remove the research space and all its papers from your account.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancelDeleteSpace}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteSpace}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Space
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-700 font-medium">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-3 p-1 text-green-400 hover:text-green-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
