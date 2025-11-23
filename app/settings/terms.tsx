import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Colors';
import { ArrowLeft, FileText, AlertTriangle, Scale, ShoppingBag, Users, Ban, Gavel } from 'lucide-react-native';

export default function TermsScreen() {
  const router = useRouter();

  const openEmail = () => {
    Linking.openURL('mailto:legal@senepanda.com');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conditions d'Utilisation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <FileText size={40} color={Colors.primary} />
          </View>
          <Text style={styles.lastUpdate}>Dernière mise à jour : 23 novembre 2025</Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Scale size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>1. Acceptation des Conditions</Text>
          </View>
          <Text style={styles.paragraph}>
            En accédant ou en utilisant l'application SenePanda, vous acceptez d'être lié par ces
            Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne
            pas utiliser notre application.
          </Text>
          <Text style={styles.paragraph}>
            SenePanda est une plateforme de commerce électronique qui met en relation des vendeurs
            et des acheteurs au Sénégal. Nous agissons en tant qu'intermédiaire et ne sommes pas
            partie aux transactions entre utilisateurs.
          </Text>
        </View>

        {/* Inscription */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>2. Inscription et Compte</Text>
          </View>
          <Text style={styles.subTitle}>2.1 Éligibilité</Text>
          <Text style={styles.paragraph}>
            Pour utiliser SenePanda, vous devez :
          </Text>
          <Text style={styles.bulletPoint}>• Avoir au moins 18 ans ou l'âge légal de majorité dans votre pays</Text>
          <Text style={styles.bulletPoint}>• Fournir des informations exactes et complètes lors de l'inscription</Text>
          <Text style={styles.bulletPoint}>• Maintenir la confidentialité de vos identifiants de connexion</Text>
          <Text style={styles.bulletPoint}>• Être responsable de toutes les activités sur votre compte</Text>

          <Text style={styles.subTitle}>2.2 Vérification</Text>
          <Text style={styles.paragraph}>
            Nous nous réservons le droit de vérifier votre identité et vos informations à tout moment.
            Les vendeurs peuvent être soumis à des vérifications supplémentaires avant d'être autorisés
            à vendre sur la plateforme.
          </Text>
        </View>

        {/* Utilisation */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShoppingBag size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>3. Utilisation de la Plateforme</Text>
          </View>

          <Text style={styles.subTitle}>3.1 Acheteurs</Text>
          <Text style={styles.paragraph}>
            En tant qu'acheteur, vous vous engagez à :
          </Text>
          <Text style={styles.bulletPoint}>• Effectuer des achats de bonne foi</Text>
          <Text style={styles.bulletPoint}>• Payer les produits commandés dans les délais convenus</Text>
          <Text style={styles.bulletPoint}>• Fournir des informations de livraison exactes</Text>
          <Text style={styles.bulletPoint}>• Respecter les vendeurs et autres utilisateurs</Text>
          <Text style={styles.bulletPoint}>• Signaler tout problème de manière constructive</Text>

          <Text style={styles.subTitle}>3.2 Vendeurs</Text>
          <Text style={styles.paragraph}>
            En tant que vendeur, vous vous engagez à :
          </Text>
          <Text style={styles.bulletPoint}>• Fournir des descriptions précises et honnêtes de vos produits</Text>
          <Text style={styles.bulletPoint}>• Afficher des prix clairs incluant tous les frais</Text>
          <Text style={styles.bulletPoint}>• Expédier les commandes dans les délais annoncés</Text>
          <Text style={styles.bulletPoint}>• Répondre aux messages des acheteurs rapidement</Text>
          <Text style={styles.bulletPoint}>• Respecter toutes les lois applicables</Text>
          <Text style={styles.bulletPoint}>• Ne pas vendre de produits contrefaits ou illégaux</Text>
        </View>

        {/* Produits interdits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ban size={20} color="#EF4444" />
            <Text style={styles.sectionTitle}>4. Produits et Contenus Interdits</Text>
          </View>
          <Text style={styles.paragraph}>
            Les produits et contenus suivants sont strictement interdits sur SenePanda :
          </Text>
          <Text style={styles.bulletPoint}>• Produits contrefaits ou violant la propriété intellectuelle</Text>
          <Text style={styles.bulletPoint}>• Armes, munitions et explosifs</Text>
          <Text style={styles.bulletPoint}>• Drogues et substances illicites</Text>
          <Text style={styles.bulletPoint}>• Médicaments sans ordonnance ou non autorisés</Text>
          <Text style={styles.bulletPoint}>• Produits à caractère pornographique</Text>
          <Text style={styles.bulletPoint}>• Animaux vivants ou produits d'espèces protégées</Text>
          <Text style={styles.bulletPoint}>• Données personnelles ou informations volées</Text>
          <Text style={styles.bulletPoint}>• Tout produit illégal au Sénégal</Text>
          <Text style={styles.paragraph}>
            La vente de ces produits entraînera la suspension immédiate du compte et des poursuites
            judiciaires le cas échéant.
          </Text>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Scale size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>5. Transactions et Paiements</Text>
          </View>

          <Text style={styles.subTitle}>5.1 Prix et Frais</Text>
          <Text style={styles.paragraph}>
            Les prix affichés sont en Francs CFA (XOF). Les vendeurs fixent leurs propres prix.
            SenePanda peut prélever une commission sur les ventes. Les frais de livraison sont
            indiqués séparément.
          </Text>

          <Text style={styles.subTitle}>5.2 Paiements</Text>
          <Text style={styles.paragraph}>
            Les paiements sont traités de manière sécurisée via nos partenaires de paiement agréés.
            Les fonds sont débloqués aux vendeurs après confirmation de la réception par l'acheteur.
          </Text>

          <Text style={styles.subTitle}>5.3 Remboursements</Text>
          <Text style={styles.paragraph}>
            Les demandes de remboursement sont évaluées au cas par cas. Les acheteurs doivent
            contacter le vendeur dans les 7 jours suivant la réception pour signaler un problème.
            SenePanda peut intervenir en cas de litige non résolu.
          </Text>
        </View>

        {/* Responsabilités */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>6. Limitations de Responsabilité</Text>
          </View>
          <Text style={styles.paragraph}>
            SenePanda agit en tant qu'intermédiaire et :
          </Text>
          <Text style={styles.bulletPoint}>• Ne garantit pas la qualité des produits vendus</Text>
          <Text style={styles.bulletPoint}>• N'est pas responsable des litiges entre utilisateurs</Text>
          <Text style={styles.bulletPoint}>• Ne peut être tenu responsable des retards de livraison</Text>
          <Text style={styles.bulletPoint}>• Ne garantit pas la disponibilité continue du service</Text>
          <Text style={styles.paragraph}>
            En aucun cas, SenePanda ne sera responsable des dommages indirects, accessoires,
            spéciaux ou consécutifs résultant de l'utilisation de la plateforme.
          </Text>
        </View>

        {/* Propriété intellectuelle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>7. Propriété Intellectuelle</Text>
          </View>
          <Text style={styles.paragraph}>
            Tout le contenu de l'application SenePanda (logos, designs, textes, code) est protégé
            par les droits de propriété intellectuelle. Vous ne pouvez pas copier, modifier,
            distribuer ou utiliser ce contenu sans autorisation écrite.
          </Text>
          <Text style={styles.paragraph}>
            Les utilisateurs conservent la propriété du contenu qu'ils publient mais accordent à
            SenePanda une licence mondiale, non exclusive et gratuite pour l'afficher sur la plateforme.
          </Text>
        </View>

        {/* Sanctions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Gavel size={20} color="#EF4444" />
            <Text style={styles.sectionTitle}>8. Sanctions et Résiliation</Text>
          </View>
          <Text style={styles.paragraph}>
            En cas de violation de ces conditions, SenePanda peut :
          </Text>
          <Text style={styles.bulletPoint}>• Émettre un avertissement</Text>
          <Text style={styles.bulletPoint}>• Suspendre temporairement le compte</Text>
          <Text style={styles.bulletPoint}>• Résilier définitivement le compte</Text>
          <Text style={styles.bulletPoint}>• Retenir les fonds en cas de fraude suspectée</Text>
          <Text style={styles.bulletPoint}>• Engager des poursuites judiciaires si nécessaire</Text>
          <Text style={styles.paragraph}>
            Vous pouvez également résilier votre compte à tout moment en nous contactant.
            La résiliation n'affecte pas les transactions en cours.
          </Text>
        </View>

        {/* Modifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>9. Modifications des Conditions</Text>
          </View>
          <Text style={styles.paragraph}>
            Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications
            importantes seront notifiées par email ou notification dans l'application. Votre utilisation
            continue après ces modifications constitue votre acceptation des nouvelles conditions.
          </Text>
        </View>

        {/* Droit applicable */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Scale size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>10. Droit Applicable</Text>
          </View>
          <Text style={styles.paragraph}>
            Ces conditions sont régies par les lois de la République du Sénégal. Tout litige sera
            soumis à la compétence exclusive des tribunaux de Dakar, Sénégal.
          </Text>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>11. Contact</Text>
          </View>
          <Text style={styles.paragraph}>
            Pour toute question concernant ces conditions d'utilisation :
          </Text>
          <Text style={styles.bulletPoint}>• Email : legal@senepanda.com</Text>
          <Text style={styles.bulletPoint}>• Adresse : Dakar, Sénégal</Text>

          <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
            <Text style={styles.contactButtonText}>Nous contacter</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            En utilisant SenePanda, vous confirmez avoir lu, compris et accepté ces Conditions
            Générales d'Utilisation.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  lastUpdate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    flex: 1,
  },
  subTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  paragraph: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  bulletPoint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginLeft: Spacing.md,
    marginBottom: 4,
  },
  contactButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  contactButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  footer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
