/**
 * Shared UI State Utilities
 * Provides standardized UI state management patterns
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * View mode management
 */
export const ViewModeHandlers = {
  /**
   * Create view mode state management
   */
  createViewModeManager: ({
    modes = ['grid', 'list'],
    defaultMode = modes[0],
    persistKey = null
  } = {}) => {
    return () => {
      const [viewMode, setViewMode] = useState(() => {
        if (persistKey && typeof localStorage !== 'undefined') {
          const saved = localStorage.getItem(persistKey);
          return saved && modes.includes(saved) ? saved : defaultMode;
        }
        return defaultMode;
      });
      
      const updateViewMode = useCallback((mode) => {
        if (modes.includes(mode)) {
          setViewMode(mode);
          if (persistKey && typeof localStorage !== 'undefined') {
            localStorage.setItem(persistKey, mode);
          }
        }
      }, [modes, persistKey]);
      
      const toggleViewMode = useCallback(() => {
        const currentIndex = modes.indexOf(viewMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        updateViewMode(modes[nextIndex]);
      }, [viewMode, modes, updateViewMode]);
      
      return {
        viewMode,
        updateViewMode,
        toggleViewMode,
        availableModes: modes,
        isMode: (mode) => viewMode === mode
      };
    };
  },

  /**
   * Create tab management system
   */
  createTabManager: ({
    tabs = [],
    defaultTab = null,
    persistKey = null
  } = {}) => {
    return () => {
      const [activeTab, setActiveTab] = useState(() => {
        if (persistKey && typeof localStorage !== 'undefined') {
          const saved = localStorage.getItem(persistKey);
          return saved && tabs.includes(saved) ? saved : (defaultTab || tabs[0]);
        }
        return defaultTab || tabs[0];
      });
      
      const switchTab = useCallback((tab) => {
        if (tabs.includes(tab)) {
          setActiveTab(tab);
          if (persistKey && typeof localStorage !== 'undefined') {
            localStorage.setItem(persistKey, tab);
          }
        }
      }, [tabs, persistKey]);
      
      const nextTab = useCallback(() => {
        const currentIndex = tabs.indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        switchTab(tabs[nextIndex]);
      }, [activeTab, tabs, switchTab]);
      
      const prevTab = useCallback(() => {
        const currentIndex = tabs.indexOf(activeTab);
        const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        switchTab(tabs[prevIndex]);
      }, [activeTab, tabs, switchTab]);
      
      return {
        activeTab,
        switchTab,
        nextTab,
        prevTab,
        tabs,
        isActiveTab: (tab) => activeTab === tab,
        activeTabIndex: tabs.indexOf(activeTab)
      };
    };
  }
};

/**
 * Loading state management
 */
export const LoadingStateHandlers = {
  /**
   * Create loading state manager
   */
  createLoadingManager: ({
    initialStates = {},
    globalLoading = false
  } = {}) => {
    return () => {
      const [loadingStates, setLoadingStates] = useState(initialStates);
      const [isGlobalLoading, setIsGlobalLoading] = useState(globalLoading);
      
      const setLoading = useCallback((key, loading) => {
        setLoadingStates(prev => ({ ...prev, [key]: loading }));
      }, []);
      
      const isLoading = useCallback((key) => {
        return loadingStates[key] || false;
      }, [loadingStates]);
      
      const isAnyLoading = useCallback(() => {
        return Object.values(loadingStates).some(Boolean) || isGlobalLoading;
      }, [loadingStates, isGlobalLoading]);
      
      const clearAllLoading = useCallback(() => {
        setLoadingStates({});
        setIsGlobalLoading(false);
      }, []);
      
      const withLoading = useCallback(async (key, asyncFn) => {
        setLoading(key, true);
        try {
          const result = await asyncFn();
          return result;
        } finally {
          setLoading(key, false);
        }
      }, [setLoading]);
      
      return {
        loadingStates,
        setLoading,
        isLoading,
        isAnyLoading,
        clearAllLoading,
        withLoading,
        isGlobalLoading,
        setGlobalLoading: setIsGlobalLoading
      };
    };
  },

  /**
   * Create async operation tracker
   */
  createAsyncTracker: () => {
    return () => {
      const [operations, setOperations] = useState(new Map());
      const operationId = useRef(0);
      
      const startOperation = useCallback((name, metadata = {}) => {
        const id = ++operationId.current;
        const operation = {
          id,
          name,
          startTime: Date.now(),
          metadata
        };
        
        setOperations(prev => new Map(prev).set(id, operation));
        return id;
      }, []);
      
      const finishOperation = useCallback((id, result = null, error = null) => {
        setOperations(prev => {
          const updated = new Map(prev);
          const operation = updated.get(id);
          if (operation) {
            updated.set(id, {
              ...operation,
              endTime: Date.now(),
              duration: Date.now() - operation.startTime,
              result,
              error,
              completed: true
            });
          }
          return updated;
        });
      }, []);
      
      const removeOperation = useCallback((id) => {
        setOperations(prev => {
          const updated = new Map(prev);
          updated.delete(id);
          return updated;
        });
      }, []);
      
      const getActiveOperations = useCallback(() => {
        return Array.from(operations.values()).filter(op => !op.completed);
      }, [operations]);
      
      const isOperationActive = useCallback((name) => {
        return getActiveOperations().some(op => op.name === name);
      }, [getActiveOperations]);
      
      return {
        operations: Array.from(operations.values()),
        startOperation,
        finishOperation,
        removeOperation,
        getActiveOperations,
        isOperationActive,
        activeCount: getActiveOperations().length
      };
    };
  }
};

/**
 * Selection state management
 */
export const SelectionHandlers = {
  /**
   * Create selection manager
   */
  createSelectionManager: ({
    multiSelect = true,
    maxSelections = null
  } = {}) => {
    return () => {
      const [selectedItems, setSelectedItems] = useState(new Set());
      
      const selectItem = useCallback((item) => {
        setSelectedItems(prev => {
          const updated = new Set(prev);
          
          if (multiSelect) {
            if (updated.has(item)) {
              updated.delete(item);
            } else {
              if (maxSelections && updated.size >= maxSelections) {
                return prev; // Don't add if at max
              }
              updated.add(item);
            }
          } else {
            updated.clear();
            updated.add(item);
          }
          
          return updated;
        });
      }, [multiSelect, maxSelections]);
      
      const selectMultiple = useCallback((items) => {
        if (!multiSelect) return;
        
        setSelectedItems(prev => {
          const updated = new Set(prev);
          items.forEach(item => {
            if (maxSelections && updated.size >= maxSelections) {
              return;
            }
            updated.add(item);
          });
          return updated;
        });
      }, [multiSelect, maxSelections]);
      
      const deselectItem = useCallback((item) => {
        setSelectedItems(prev => {
          const updated = new Set(prev);
          updated.delete(item);
          return updated;
        });
      }, []);
      
      const clearSelection = useCallback(() => {
        setSelectedItems(new Set());
      }, []);
      
      const selectAll = useCallback((items) => {
        if (!multiSelect) return;
        
        const itemsToSelect = maxSelections 
          ? items.slice(0, maxSelections)
          : items;
        
        setSelectedItems(new Set(itemsToSelect));
      }, [multiSelect, maxSelections]);
      
      const toggleItem = useCallback((item) => {
        selectItem(item);
      }, [selectItem]);
      
      const isSelected = useCallback((item) => {
        return selectedItems.has(item);
      }, [selectedItems]);
      
      return {
        selectedItems: Array.from(selectedItems),
        selectedSet: selectedItems,
        selectItem,
        selectMultiple,
        deselectItem,
        clearSelection,
        selectAll,
        toggleItem,
        isSelected,
        selectedCount: selectedItems.size,
        hasSelection: selectedItems.size > 0,
        isMaxSelected: maxSelections ? selectedItems.size >= maxSelections : false
      };
    };
  }
};

/**
 * Visibility state management
 */
export const VisibilityHandlers = {
  /**
   * Create visibility manager for multiple elements
   */
  createVisibilityManager: (initialStates = {}) => {
    return () => {
      const [visibilityStates, setVisibilityStates] = useState(initialStates);
      
      const setVisible = useCallback((key, visible) => {
        setVisibilityStates(prev => ({ ...prev, [key]: visible }));
      }, []);
      
      const toggle = useCallback((key) => {
        setVisibilityStates(prev => ({ ...prev, [key]: !prev[key] }));
      }, []);
      
      const show = useCallback((key) => {
        setVisible(key, true);
      }, [setVisible]);
      
      const hide = useCallback((key) => {
        setVisible(key, false);
      }, [setVisible]);
      
      const hideAll = useCallback(() => {
        setVisibilityStates(prev => {
          const updated = {};
          Object.keys(prev).forEach(key => {
            updated[key] = false;
          });
          return updated;
        });
      }, []);
      
      const isVisible = useCallback((key) => {
        return visibilityStates[key] || false;
      }, [visibilityStates]);
      
      return {
        visibilityStates,
        setVisible,
        toggle,
        show,
        hide,
        hideAll,
        isVisible
      };
    };
  },

  /**
   * Create modal manager
   */
  createModalManager: () => {
    return () => {
      const [openModals, setOpenModals] = useState(new Set());
      
      const openModal = useCallback((modalId) => {
        setOpenModals(prev => new Set([...prev, modalId]));
      }, []);
      
      const closeModal = useCallback((modalId) => {
        setOpenModals(prev => {
          const updated = new Set(prev);
          updated.delete(modalId);
          return updated;
        });
      }, []);
      
      const closeAllModals = useCallback(() => {
        setOpenModals(new Set());
      }, []);
      
      const isModalOpen = useCallback((modalId) => {
        return openModals.has(modalId);
      }, [openModals]);
      
      const toggleModal = useCallback((modalId) => {
        if (isModalOpen(modalId)) {
          closeModal(modalId);
        } else {
          openModal(modalId);
        }
      }, [isModalOpen, closeModal, openModal]);
      
      return {
        openModals: Array.from(openModals),
        openModal,
        closeModal,
        closeAllModals,
        isModalOpen,
        toggleModal,
        hasOpenModals: openModals.size > 0,
        modalCount: openModals.size
      };
    };
  }
};

/**
 * Responsive state management
 */
export const ResponsiveHandlers = {
  /**
   * Create responsive state manager
   */
  createResponsiveManager: ({
    breakpoints = {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    }
  } = {}) => {
    return () => {
      const [screenSize, setScreenSize] = useState(() => {
        if (typeof window === 'undefined') return 'desktop';
        
        const width = window.innerWidth;
        if (width < breakpoints.mobile) return 'mobile';
        if (width < breakpoints.tablet) return 'tablet';
        return 'desktop';
      });
      
      useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const handleResize = () => {
          const width = window.innerWidth;
          let newSize = 'desktop';
          
          if (width < breakpoints.mobile) {
            newSize = 'mobile';
          } else if (width < breakpoints.tablet) {
            newSize = 'tablet';
          }
          
          setScreenSize(newSize);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }, [breakpoints]);
      
      return {
        screenSize,
        isMobile: screenSize === 'mobile',
        isTablet: screenSize === 'tablet',
        isDesktop: screenSize === 'desktop',
        isMobileOrTablet: screenSize === 'mobile' || screenSize === 'tablet',
        breakpoints
      };
    };
  }
};

export default {
  ViewModeHandlers,
  LoadingStateHandlers,
  SelectionHandlers,
  VisibilityHandlers,
  ResponsiveHandlers
};