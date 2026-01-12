/**
 * Client Meilisearch configuré pour SenePanda
 * Recherche ultra-rapide de produits
 */

import { MeiliSearch, SearchResponse } from 'meilisearch';
import { logger } from './logger';

// Configuration Meilisearch
const MEILISEARCH_HOST = process.env.EXPO_PUBLIC_MEILISEARCH_HOST || 'http://localhost:7700';
const MEILISEARCH_KEY = process.env.EXPO_PUBLIC_MEILISEARCH_KEY || '';

export interface ProductSearchResult {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  category: string;
  seller_id: string;
  seller_name: string;
  shop_name: string;
  stock: number;
  is_active: boolean;
  created_at: string;
}

class MeilisearchClient {
  private client: MeiliSearch | null = null;
  private indexName = 'products';
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.client = new MeiliSearch({
        host: MEILISEARCH_HOST,
        apiKey: MEILISEARCH_KEY,
      });

      // Configurer l'index
      await this.setupIndex();
      this.initialized = true;

      logger.info('Meilisearch initialized', {
        host: MEILISEARCH_HOST,
      });
    } catch (error) {
      logger.error('Failed to initialize Meilisearch', error as Error);
      this.initialized = false;
    }
  }

  private async setupIndex() {
    if (!this.client) return;

    try {
      const index = this.client.index(this.indexName);

      // Configurer les attributs cherchables
      await index.updateSearchableAttributes([
        'title',
        'description',
        'category',
        'seller_name',
        'shop_name',
      ]);

      // Configurer les filtres
      await index.updateFilterableAttributes([
        'category',
        'seller_id',
        'is_active',
        'price',
        'stock',
      ]);

      // Configurer le tri
      await index.updateSortableAttributes(['price', 'created_at', 'title']);

      // Configurer les attributs affichés
      await index.updateDisplayedAttributes([
        'id',
        'title',
        'description',
        'price',
        'currency',
        'image_url',
        'category',
        'seller_id',
        'seller_name',
        'shop_name',
        'stock',
        'is_active',
        'created_at',
      ]);

      logger.info('Meilisearch index configured');
    } catch (error) {
      logger.error('Failed to setup Meilisearch index', error as Error);
    }
  }

  /**
   * Rechercher des produits
   */
  async searchProducts(
    query: string,
    options: {
      filters?: string;
      sort?: string[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<SearchResponse<ProductSearchResult>> {
    if (!this.client || !this.initialized) {
      logger.warn('Meilisearch not initialized');
      return {
        hits: [],
        query,
        processingTimeMs: 0,
        limit: options.limit || 20,
        offset: options.offset || 0,
        estimatedTotalHits: 0,
      };
    }

    try {
      const index = this.client.index<ProductSearchResult>(this.indexName);

      const results = await index.search(query, {
        filter: options.filters,
        sort: options.sort,
        limit: options.limit || 20,
        offset: options.offset || 0,
        matchingStrategy: 'all',
      });

      logger.debug('Search completed', {
        query,
        hits: results.hits.length,
        processingTime: results.processingTimeMs,
      });

      return results;
    } catch (error) {
      logger.error('Search failed', error as Error, {
        metadata: { query, options },
      });

      // Retourner résultat vide en cas d'erreur
      return {
        hits: [],
        query,
        processingTimeMs: 0,
        limit: options.limit || 20,
        offset: options.offset || 0,
        estimatedTotalHits: 0,
      };
    }
  }

  /**
   * Indexer un produit
   */
  async indexProduct(product: ProductSearchResult): Promise<boolean> {
    if (!this.client || !this.initialized) {
      logger.warn('Meilisearch not initialized');
      return false;
    }

    try {
      const index = this.client.index(this.indexName);
      await index.addDocuments([product]);

      logger.debug('Product indexed', { productId: product.id });
      return true;
    } catch (error) {
      logger.error('Failed to index product', error as Error);
      return false;
    }
  }

  /**
   * Indexer plusieurs produits en batch
   */
  async indexProducts(products: ProductSearchResult[]): Promise<boolean> {
    if (!this.client || !this.initialized) {
      logger.warn('Meilisearch not initialized');
      return false;
    }

    try {
      const index = this.client.index(this.indexName);
      await index.addDocuments(products);

      logger.info('Products indexed', { count: products.length });
      return true;
    } catch (error) {
      logger.error('Failed to index products', error as Error);
      return false;
    }
  }

  /**
   * Supprimer un produit de l'index
   */
  async deleteProduct(productId: string): Promise<boolean> {
    if (!this.client || !this.initialized) {
      logger.warn('Meilisearch not initialized');
      return false;
    }

    try {
      const index = this.client.index(this.indexName);
      await index.deleteDocument(productId);

      logger.debug('Product deleted from index', { productId });
      return true;
    } catch (error) {
      logger.error('Failed to delete product from index', error as Error);
      return false;
    }
  }

  /**
   * Mettre à jour un produit
   */
  async updateProduct(product: Partial<ProductSearchResult> & { id: string }): Promise<boolean> {
    if (!this.client || !this.initialized) {
      logger.warn('Meilisearch not initialized');
      return false;
    }

    try {
      const index = this.client.index(this.indexName);
      await index.updateDocuments([product]);

      logger.debug('Product updated in index', { productId: product.id });
      return true;
    } catch (error) {
      logger.error('Failed to update product in index', error as Error);
      return false;
    }
  }

  /**
   * Obtenir les statistiques de l'index
   */
  async getStats() {
    if (!this.client || !this.initialized) {
      return null;
    }

    try {
      const index = this.client.index(this.indexName);
      const stats = await index.getStats();
      return stats;
    } catch (error) {
      logger.error('Failed to get index stats', error as Error);
      return null;
    }
  }

  /**
   * Vider l'index
   */
  async clearIndex(): Promise<boolean> {
    if (!this.client || !this.initialized) {
      logger.warn('Meilisearch not initialized');
      return false;
    }

    try {
      const index = this.client.index(this.indexName);
      await index.deleteAllDocuments();

      logger.info('Index cleared');
      return true;
    } catch (error) {
      logger.error('Failed to clear index', error as Error);
      return false;
    }
  }
}

// Export instance singleton
export const meilisearchClient = new MeilisearchClient();
