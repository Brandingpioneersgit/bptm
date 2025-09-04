/**
 * Shared Data Utilities
 * Provides standardized data fetching, caching, and synchronization patterns
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ErrorHandlers } from './errorUtils';

/**
 * Data fetching utilities
 */
export const DataFetchers = {
  /**
   * Create a standardized data fetcher with caching and error handling
   */
  createDataFetcher: ({ 
    fetchFn, 
    cacheKey, 
    notify, 
    refreshInterval = null,
    retryCount = 2 
  }) => {
    return () => {
      const [data, setData] = useState(null);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);
      const [lastFetch, setLastFetch] = useState(null);
      const mountedRef = useRef(true);
      const cacheRef = useRef(new Map());
      
      useEffect(() => {
        return () => {
          mountedRef.current = false;
        };
      }, []);
      
      const errorHandler = ErrorHandlers.createDataFetchHandler({
        notify,
        setLoading,
        setError,
        setData
      });
      
      const fetchData = useCallback(async (force = false) => {
        // Check cache first
        if (!force && cacheKey && cacheRef.current.has(cacheKey)) {
          const cached = cacheRef.current.get(cacheKey);
          const cacheAge = Date.now() - cached.timestamp;
          
          // Use cache if less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            setData(cached.data);
            setLastFetch(cached.timestamp);
            return cached.data;
          }
        }
        
        return await errorHandler(async () => {
          const result = await fetchFn();
          
          if (mountedRef.current) {
            setData(result);
            setLastFetch(Date.now());
            
            // Cache the result
            if (cacheKey) {
              cacheRef.current.set(cacheKey, {
                data: result,
                timestamp: Date.now()
              });
            }
          }
          
          return result;
        }, {
          retryCount,
          operation: `fetch ${cacheKey || 'data'}`
        });
      }, [fetchFn, cacheKey, errorHandler, retryCount]);
      
      // Auto-refresh if interval is set
      useEffect(() => {
        if (refreshInterval) {
          const interval = setInterval(() => {
            fetchData(true);
          }, refreshInterval);
          
          return () => clearInterval(interval);
        }
      }, [fetchData, refreshInterval]);
      
      // Initial fetch
      useEffect(() => {
        fetchData();
      }, [fetchData]);
      
      return {
        data,
        loading,
        error,
        lastFetch,
        refetch: () => fetchData(true),
        clearCache: () => {
          if (cacheKey) {
            cacheRef.current.delete(cacheKey);
          }
        }
      };
    };
  },

  /**
   * Create a data synchronizer for real-time updates
   */
  createDataSynchronizer: ({ 
    fetchFn, 
    syncInterval = 30000, 
    onSyncError = null 
  }) => {
    return () => {
      const [data, setData] = useState([]);
      const [isActive, setIsActive] = useState(false);
      const [lastSync, setLastSync] = useState(null);
      const intervalRef = useRef(null);
      const mountedRef = useRef(true);
      
      useEffect(() => {
        return () => {
          mountedRef.current = false;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        };
      }, []);
      
      const syncData = useCallback(async () => {
        try {
          const result = await fetchFn();
          
          if (mountedRef.current) {
            setData(result);
            setLastSync(Date.now());
            setIsActive(true);
          }
          
          return result;
        } catch (error) {
          console.warn('Data sync error:', error);
          if (onSyncError) onSyncError(error);
          setIsActive(false);
          throw error;
        }
      }, [fetchFn, onSyncError]);
      
      const startSync = useCallback(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        // Initial sync
        syncData();
        
        // Set up interval
        intervalRef.current = setInterval(syncData, syncInterval);
      }, [syncData, syncInterval]);
      
      const stopSync = useCallback(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsActive(false);
      }, []);
      
      return {
        data,
        isActive,
        lastSync,
        startSync,
        stopSync,
        syncNow: syncData
      };
    };
  }
};

/**
 * Data filtering and sorting utilities
 */
export const DataFilters = {
  /**
   * Create a standardized filter system
   */
  createFilterSystem: (data, initialFilters = {}) => {
    const [filters, setFilters] = useState(initialFilters);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    
    const filteredData = useMemo(() => {
      if (!data || !Array.isArray(data)) return [];
      
      let filtered = data;
      
      // Apply search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(item => {
          return Object.values(item).some(value => 
            String(value).toLowerCase().includes(query)
          );
        });
      }
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'All' && value !== '') {
          filtered = filtered.filter(item => {
            const itemValue = key.includes('.') 
              ? key.split('.').reduce((obj, k) => obj?.[k], item)
              : item[key];
            return itemValue === value;
          });
        }
      });
      
      // Apply sorting
      if (sortConfig.key) {
        filtered.sort((a, b) => {
          const aValue = sortConfig.key.includes('.')
            ? sortConfig.key.split('.').reduce((obj, k) => obj?.[k], a)
            : a[sortConfig.key];
          const bValue = sortConfig.key.includes('.')
            ? sortConfig.key.split('.').reduce((obj, k) => obj?.[k], b)
            : b[sortConfig.key];
          
          if (aValue < bValue) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }
      
      return filtered;
    }, [data, filters, searchQuery, sortConfig]);
    
    return {
      filteredData,
      filters,
      setFilters,
      searchQuery,
      setSearchQuery,
      sortConfig,
      setSortConfig,
      updateFilter: (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
      },
      clearFilters: () => {
        setFilters(initialFilters);
        setSearchQuery('');
        setSortConfig({ key: null, direction: 'asc' });
      }
    };
  },

  /**
   * Create pagination system
   */
  createPagination: (data, itemsPerPage = 10) => {
    const [currentPage, setCurrentPage] = useState(1);
    
    const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data?.slice(startIndex, endIndex) || [];
    
    return {
      paginatedData,
      currentPage,
      totalPages,
      itemsPerPage,
      setCurrentPage,
      nextPage: () => setCurrentPage(prev => Math.min(prev + 1, totalPages)),
      prevPage: () => setCurrentPage(prev => Math.max(prev - 1, 1)),
      goToPage: (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages))),
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }
};

/**
 * Data aggregation utilities
 */
export const DataAggregators = {
  /**
   * Aggregate data by key
   */
  aggregateByKey: (data, key, aggregateFn = 'count') => {
    if (!data || !Array.isArray(data)) return {};
    
    const groups = data.reduce((acc, item) => {
      const value = key.includes('.') 
        ? key.split('.').reduce((obj, k) => obj?.[k], item)
        : item[key];
      
      if (!acc[value]) acc[value] = [];
      acc[value].push(item);
      return acc;
    }, {});
    
    if (aggregateFn === 'count') {
      return Object.entries(groups).reduce((acc, [k, v]) => {
        acc[k] = v.length;
        return acc;
      }, {});
    }
    
    return groups;
  },

  /**
   * Calculate statistics for numeric data
   */
  calculateStats: (data, key) => {
    if (!data || !Array.isArray(data)) return null;
    
    const values = data
      .map(item => {
        const value = key.includes('.') 
          ? key.split('.').reduce((obj, k) => obj?.[k], item)
          : item[key];
        return parseFloat(value);
      })
      .filter(v => !isNaN(v));
    
    if (values.length === 0) return null;
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    return {
      count: values.length,
      sum,
      avg,
      median,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
};

export default {
  DataFetchers,
  DataFilters,
  DataAggregators
};