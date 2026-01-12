/**
 * Hook React pour utiliser le logger dans les composants
 * Usage: const log = useLogger('ComponentName');
 */

import { useCallback, useMemo } from 'react';
import { logger, createLogContext, LogContext } from '../lib/logger';

export function useLogger(componentName: string) {
  const baseContext = useMemo(
    () => createLogContext(componentName),
    [componentName]
  );

  const debug = useCallback(
    (message: string, metadata?: Record<string, any>) => {
      logger.debug(message, { ...baseContext, metadata });
    },
    [baseContext]
  );

  const info = useCallback(
    (message: string, action?: string, metadata?: Record<string, any>) => {
      logger.info(message, { ...baseContext, action, metadata });
    },
    [baseContext]
  );

  const warn = useCallback(
    (message: string, metadata?: Record<string, any>) => {
      logger.warn(message, { ...baseContext, metadata });
    },
    [baseContext]
  );

  const error = useCallback(
    (message: string, error?: Error, metadata?: Record<string, any>) => {
      logger.error(message, error, { ...baseContext, metadata });
    },
    [baseContext]
  );

  const track = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      logger.track(eventName, { component: componentName, ...properties });
    },
    [componentName]
  );

  const measureAsync = useCallback(
    async <T,>(operation: string, fn: () => Promise<T>): Promise<T> => {
      return logger.measureAsync(operation, fn, baseContext);
    },
    [baseContext]
  );

  return {
    debug,
    info,
    warn,
    error,
    track,
    measureAsync,
  };
}
