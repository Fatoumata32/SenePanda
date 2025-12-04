/**
 * EXEMPLE D'UTILISATION DU SYSTÈME DE RÉPUTATION VENDEUR
 *
 * Ce fichier contient des exemples concrets d'utilisation
 * du système de réputation dans différents contextes.
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import SellerReputationBadge from '@/components/SellerReputationBadge';
import { useSellerReputation, useMyReputation, useTopSellersByReputation } from '@/hooks/useSellerReputation';
import { calculateReputation, getReputationImprovementTips } from '@/lib/reputationSystem';

// ============================================
// EXEMPLE 1: Badge simple dans une carte vendeur
// ============================================
export function SellerCardExample({ sellerId }: { sellerId: string }) {
  const { reputation, loading } = useSellerReputation(sellerId);

  if (loading || !reputation) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Vendeur Premium</Text>
      <SellerReputationBadge
        reputation={reputation}
        size="small"
        showDetails={false}
      />
    </View>
  );
}

// ============================================
// EXEMPLE 2: Profil vendeur complet avec détails
// ============================================
export function SellerProfileExample() {
  const { reputation, loading, refresh } = useMyReputation();

  if (loading) return <Text>Chargement...</Text>;
  if (!reputation) return <Text>Erreur de chargement</Text>;

  return (
    <ScrollView style={styles.profile}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon Profil Vendeur</Text>
        <TouchableOpacity onPress={refresh}>
          <Text style={styles.refreshButton}>🔄 Actualiser</Text>
        </TouchableOpacity>
      </View>

      {/* Badge de réputation complet */}
      <View style={styles.reputationSection}>
        <SellerReputationBadge
          reputation={reputation}
          size="large"
          showDetails={true}
          showProgress={true}
        />
      </View>

      {/* Conseils d'amélioration */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>💡 Conseils pour améliorer votre réputation</Text>
        {getReputationImprovementTips({
          averageRating: reputation.averageRating,
          totalReviews: reputation.totalReviews,
          totalVotes: reputation.totalVotes,
        }).map((tip, index) => (
          <View key={index} style={styles.tip}>
            <Text style={styles.tipText}>• {tip}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ============================================
// EXEMPLE 3: Liste des meilleurs vendeurs
// ============================================
export function TopSellersExample() {
  const { sellers, loading } = useTopSellersByReputation(5);

  if (loading) return <Text>Chargement...</Text>;

  return (
    <View style={styles.topSellers}>
      <Text style={styles.title}>🏆 Top 5 Vendeurs</Text>
      {sellers.map((seller, index) => (
        <View key={seller.sellerId} style={styles.topSellerItem}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{index + 1}</Text>
          </View>
          <SellerReputationBadge
            reputation={seller.reputation}
            size="medium"
            showDetails={true}
            showProgress={false}
          />
        </View>
      ))}
    </View>
  );
}

// ============================================
// EXEMPLE 4: Badge responsive selon la taille d'écran
// ============================================
import { Dimensions } from 'react-native';

export function ResponsiveReputationBadge({ sellerId }: { sellerId: string }) {
  const { reputation } = useSellerReputation(sellerId);
  const { width } = Dimensions.get('window');

  if (!reputation) return null;

  // Adapter la taille selon l'écran
  const badgeSize = width < 350 ? 'small' : width < 500 ? 'medium' : 'large';
  const showDetails = width > 350;

  return (
    <SellerReputationBadge
      reputation={reputation}
      size={badgeSize}
      showDetails={showDetails}
      showProgress={width > 500}
    />
  );
}

// ============================================
// EXEMPLE 5: Calcul manuel de réputation
// ============================================
export function ManualReputationCalculation() {
  // Données simulées
  const sellerData = {
    averageRating: 4.7,
    totalReviews: 85,
    totalVotes: 150,
    responseRate: 92,
    completionRate: 96,
  };

  // Calculer la réputation
  const reputation = calculateReputation(sellerData);

  return (
    <View style={styles.calculation}>
      <Text style={styles.title}>Simulation de Calcul</Text>

      <View style={styles.inputData}>
        <Text style={styles.label}>Données du vendeur :</Text>
        <Text>⭐ Note moyenne : {sellerData.averageRating}/5</Text>
        <Text>💬 Nombre d'avis : {sellerData.totalReviews}</Text>
        <Text>👍 Votes utiles : {sellerData.totalVotes}</Text>
        <Text>📱 Taux de réponse : {sellerData.responseRate}%</Text>
        <Text>✅ Taux de complétion : {sellerData.completionRate}%</Text>
      </View>

      <View style={styles.result}>
        <Text style={styles.label}>Résultat du calcul :</Text>
        <SellerReputationBadge
          reputation={reputation}
          size="large"
          showDetails={true}
          showProgress={true}
        />
      </View>
    </View>
  );
}

// ============================================
// EXEMPLE 6: Affichage conditionnel selon le niveau
// ============================================
export function ConditionalBadgeDisplay({ sellerId }: { sellerId: string }) {
  const { reputation } = useSellerReputation(sellerId);

  if (!reputation) return null;

  // Afficher un message spécial pour les vendeurs d'élite
  const isElite = ['platinum', 'diamond'].includes(reputation.level);

  return (
    <View style={styles.conditionalDisplay}>
      {isElite && (
        <View style={styles.eliteBanner}>
          <Text style={styles.eliteText}>⭐ VENDEUR D'ÉLITE ⭐</Text>
        </View>
      )}

      <SellerReputationBadge
        reputation={reputation}
        size="medium"
        showDetails={true}
      />

      {reputation.score >= 90 && (
        <View style={styles.achievementBadge}>
          <Text style={styles.achievementText}>
            🎯 90+ points - Excellence confirmée !
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================
// EXEMPLE 7: Comparaison de vendeurs
// ============================================
export function SellerComparisonExample({
  seller1Id,
  seller2Id
}: {
  seller1Id: string;
  seller2Id: string;
}) {
  const seller1 = useSellerReputation(seller1Id);
  const seller2 = useSellerReputation(seller2Id);

  if (!seller1.reputation || !seller2.reputation) return null;

  return (
    <View style={styles.comparison}>
      <Text style={styles.title}>Comparaison des vendeurs</Text>

      <View style={styles.comparisonRow}>
        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>Vendeur 1</Text>
          <SellerReputationBadge
            reputation={seller1.reputation}
            size="medium"
            showDetails={true}
          />
        </View>

        <Text style={styles.vs}>VS</Text>

        <View style={styles.comparisonItem}>
          <Text style={styles.comparisonLabel}>Vendeur 2</Text>
          <SellerReputationBadge
            reputation={seller2.reputation}
            size="medium"
            showDetails={true}
          />
        </View>
      </View>

      {/* Afficher le gagnant */}
      <View style={styles.winner}>
        <Text style={styles.winnerText}>
          🏆 {seller1.reputation.score > seller2.reputation.score
            ? 'Vendeur 1 a une meilleure réputation'
            : 'Vendeur 2 a une meilleure réputation'}
        </Text>
      </View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  profile: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  refreshButton: {
    color: '#3B82F6',
    fontSize: 14,
  },
  reputationSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  tipsSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  tip: {
    paddingVertical: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
  },
  topSellers: {
    padding: 20,
  },
  topSellerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    gap: 12,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  calculation: {
    padding: 20,
  },
  inputData: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  result: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  conditionalDisplay: {
    gap: 12,
  },
  eliteBanner: {
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  eliteText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  achievementBadge: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  achievementText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  comparison: {
    padding: 20,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  vs: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  winner: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
});

/**
 * COMMENT UTILISER CES EXEMPLES
 *
 * 1. Importez le composant dont vous avez besoin dans votre écran
 * 2. Passez les props requises (sellerId, etc.)
 * 3. Personnalisez les styles selon vos besoins
 *
 * Exemple d'importation :
 *
 * import { SellerCardExample } from '@/EXEMPLE_REPUTATION';
 *
 * function MyScreen() {
 *   return <SellerCardExample sellerId="uuid-du-vendeur" />;
 * }
 */
