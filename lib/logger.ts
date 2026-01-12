/**
 * Système de logging centralisé pour SenePanda
 * Remplace tous les console.log par un système professionnel
 * Compatible avec Sentry, LogRocket, etc.
 */

import { Platform } from 'react-native';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
  error?: Error;
  platform: string;
}

class Logger {
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  // Intégrations futures
  private sentryEnabled = false;
  private analyticsEnabled = false;

  constructor() {
    this.isDevelopment = __DEV__;
  }

  /**
   * Log de debug (seulement en développement)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
      console.log(`🔍 [DEBUG] ${message}`, context || '');
    }
  }

  /**
   * Log d'information
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
    if (this.isDevelopment) {
      console.info(`ℹ️ [INFO] ${message}`, context || '');
    }
  }

  /**
   * Log d'avertissement
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
    console.warn(`⚠️ [WARN] ${message}`, context || '');
  }

  /**
   * Log d'erreur
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
    console.error(`❌ [ERROR] ${message}`, error || '', context || '');

    // Envoyer à Sentry en production
    if (this.sentryEnabled && !this.isDevelopment) {
      this.sendToSentry(message, error, context);
    }
  }

  /**
   * Log d'erreur critique
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log('fatal', message, context, error);
    console.error(`💀 [FATAL] ${message}`, error || '', context || '');

    // Toujours envoyer les erreurs fatales
    if (this.sentryEnabled) {
      this.sendToSentry(message, error, context, 'fatal');
    }
  }

  /**
   * Log d'événement analytics
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (this.analyticsEnabled) {
      this.info(`Event: ${eventName}`, { metadata: properties });
      // Intégration future: Mixpanel, Amplitude, etc.
    }
  }

  /**
   * Log des performances
   */
  performance(operation: string, duration: number, context?: LogContext): void {
    const message = `Performance: ${operation} took ${duration}ms`;

    if (duration > 1000) {
      this.warn(message, context);
    } else {
      this.debug(message, context);
    }
  }

  /**
   * Wrapper pour mesurer le temps d'exécution
   */
  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.performance(operation, duration, context);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${operation} failed after ${duration}ms`, error as Error, context);
      throw error;
    }
  }

  /**
   * Méthode interne de logging
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      platform: Platform.OS,
    };

    this.addToHistory(entry);
  }

  /**
   * Ajouter au historique (pour debugging)
   */
  private addToHistory(entry: LogEntry): void {
    this.logHistory.push(entry);

    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Récupérer l'historique des logs
   */
  getHistory(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logHistory.filter(entry => entry.level === level);
    }
    return this.logHistory;
  }

  /**
   * Exporter les logs pour debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  /**
   * Nettoyer l'historique
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Envoyer à Sentry (à implémenter)
   */
  private sendToSentry(
    message: string,
    error?: Error,
    context?: LogContext,
    level: 'error' | 'fatal' = 'error'
  ): void {
    // TODO: Implémenter l'intégration Sentry
    // import * as Sentry from '@sentry/react-native';
    // Sentry.captureException(error || new Error(message), {
    //   level,
    //   tags: {
    //     component: context?.component,
    //     action: context?.action,
    //   },
    //   extra: context?.metadata,
    // });
  }

  /**
   * Activer Sentry
   */
  enableSentry(): void {
    this.sentryEnabled = true;
    this.info('Sentry logging enabled');
  }

  /**
   * Activer Analytics
   */
  enableAnalytics(): void {
    this.analyticsEnabled = true;
    this.info('Analytics tracking enabled');
  }
}

// Instance singleton
export const logger = new Logger();

// Helpers pour les contextes communs
export const createLogContext = (
  component: string,
  action?: string,
  metadata?: Record<string, any>
): LogContext => ({
  component,
  action,
  metadata,
});

// Export des types
export type { LogLevel, LogContext, LogEntry };
