import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const PRIVACY_ACCEPTED_KEY = '@senepanda_privacy_accepted';

interface PrivacyPolicyModalProps {
  onAccept?: () => void;
}

export default function PrivacyPolicyModal({ onAccept }: PrivacyPolicyModalProps) {
  const [visible, setVisible] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  useEffect(() => {
    checkPrivacyAcceptance();
  }, []);

  const checkPrivacyAcceptance = async () => {
    try {
      const accepted = await AsyncStorage.getItem(PRIVACY_ACCEPTED_KEY);
      if (!accepted) {
        setVisible(true);
      }
    } catch (error) {
      console.error('Error checking privacy acceptance:', error);
      setVisible(true);
    }
  };

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(PRIVACY_ACCEPTED_KEY, 'true');
      setVisible(false);
      onAccept?.();
    } catch (error) {
      console.error('Error saving privacy acceptance:', error);
    }
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    if (isCloseToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
            <Text style={styles.title}>Politique de Confidentialité</Text>
            <Text style={styles.subtitle}>Veuillez lire et accepter nos conditions</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.lastUpdate}>Dernière mise à jour : 23 novembre 2025</Text>

            <Text style={styles.sectionTitle}>1. Introduction</Text>
            <Text style={styles.paragraph}>
              Bienvenue sur SenePanda. Nous nous engageons à protéger votre vie privée et vos données personnelles.
              Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons
              vos informations lorsque vous utilisez notre application.
            </Text>

            <Text style={styles.sectionTitle}>2. Données Collectées</Text>
            <Text style={styles.paragraph}>
              Nous collectons les types de données suivants :
            </Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Informations de compte :</Text> nom, prénom, adresse email, numéro de téléphone</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Informations de profil :</Text> photo de profil, adresse de livraison</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Données de transaction :</Text> historique des achats, produits consultés</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Données techniques :</Text> type d'appareil, système d'exploitation, identifiant unique</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Données de localisation :</Text> uniquement avec votre consentement explicite</Text>

            <Text style={styles.sectionTitle}>3. Utilisation des Données</Text>
            <Text style={styles.paragraph}>
              Vos données sont utilisées pour :
            </Text>
            <Text style={styles.bulletPoint}>• Créer et gérer votre compte utilisateur</Text>
            <Text style={styles.bulletPoint}>• Traiter vos commandes et transactions</Text>
            <Text style={styles.bulletPoint}>• Personnaliser votre expérience d'achat</Text>
            <Text style={styles.bulletPoint}>• Vous envoyer des notifications importantes</Text>
            <Text style={styles.bulletPoint}>• Améliorer nos services et fonctionnalités</Text>
            <Text style={styles.bulletPoint}>• Prévenir la fraude et assurer la sécurité</Text>
            <Text style={styles.bulletPoint}>• Respecter nos obligations légales</Text>

            <Text style={styles.sectionTitle}>4. Partage des Données</Text>
            <Text style={styles.paragraph}>
              Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos informations avec :
            </Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Vendeurs :</Text> pour traiter vos commandes</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Services de paiement :</Text> pour sécuriser les transactions</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Services de livraison :</Text> pour acheminer vos colis</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Autorités légales :</Text> si requis par la loi</Text>

            <Text style={styles.sectionTitle}>5. Sécurité des Données</Text>
            <Text style={styles.paragraph}>
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour
              protéger vos données contre tout accès non autorisé, perte, destruction ou altération. Cela inclut
              le chiffrement des données, des pare-feu, et des contrôles d'accès stricts.
            </Text>

            <Text style={styles.sectionTitle}>6. Conservation des Données</Text>
            <Text style={styles.paragraph}>
              Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir nos services
              et respecter nos obligations légales. Vous pouvez demander la suppression de votre compte et de
              vos données à tout moment.
            </Text>

            <Text style={styles.sectionTitle}>7. Vos Droits</Text>
            <Text style={styles.paragraph}>
              Conformément à la réglementation applicable, vous disposez des droits suivants :
            </Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Accès :</Text> obtenir une copie de vos données</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Rectification :</Text> corriger vos informations inexactes</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Suppression :</Text> demander l'effacement de vos données</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Portabilité :</Text> recevoir vos données dans un format structuré</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Opposition :</Text> refuser certains traitements de données</Text>
            <Text style={styles.bulletPoint}>• <Text style={styles.bold}>Retrait du consentement :</Text> à tout moment</Text>

            <Text style={styles.sectionTitle}>8. Cookies et Technologies Similaires</Text>
            <Text style={styles.paragraph}>
              Nous utilisons des cookies et technologies similaires pour améliorer votre expérience,
              analyser l'utilisation de l'application et personnaliser le contenu. Vous pouvez gérer
              vos préférences de cookies dans les paramètres de l'application.
            </Text>

            <Text style={styles.sectionTitle}>9. Données des Mineurs</Text>
            <Text style={styles.paragraph}>
              Notre application n'est pas destinée aux enfants de moins de 13 ans. Nous ne collectons pas
              sciemment de données personnelles d'enfants. Si vous êtes parent et constatez que votre enfant
              nous a fourni des informations, veuillez nous contacter.
            </Text>

            <Text style={styles.sectionTitle}>10. Modifications</Text>
            <Text style={styles.paragraph}>
              Nous pouvons mettre à jour cette politique de confidentialité périodiquement. Nous vous
              informerons de tout changement important par notification dans l'application ou par email.
              Votre utilisation continue de l'application après ces modifications constitue votre acceptation.
            </Text>

            <Text style={styles.sectionTitle}>11. Contact</Text>
            <Text style={styles.paragraph}>
              Pour toute question concernant cette politique ou vos données personnelles, contactez-nous :
            </Text>
            <Text style={styles.bulletPoint}>• Email : privacy@senepanda.com</Text>
            <Text style={styles.bulletPoint}>• Adresse : Dakar, Sénégal</Text>

            <Text style={styles.sectionTitle}>12. Conditions d'Utilisation</Text>
            <Text style={styles.paragraph}>
              En utilisant SenePanda, vous acceptez également nos{' '}
              <Text style={styles.link} onPress={() => openLink('https://senepanda.com/terms')}>
                Conditions Générales d'Utilisation
              </Text>
              .
            </Text>

            <View style={styles.scrollIndicator}>
              {!hasScrolledToBottom && (
                <Text style={styles.scrollHint}>
                  <Ionicons name="chevron-down" size={16} color={Colors.gray} /> Faites défiler pour lire la suite
                </Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.acceptButton,
                !hasScrolledToBottom && styles.acceptButtonDisabled
              ]}
              onPress={handleAccept}
              disabled={!hasScrolledToBottom}
            >
              <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
              <Text style={styles.acceptButtonText}>
                {hasScrolledToBottom ? "J'accepte la politique de confidentialité" : "Veuillez lire jusqu'en bas"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerNote}>
              En acceptant, vous confirmez avoir lu et compris notre politique de confidentialité.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.92,
    maxHeight: height * 0.85,
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    backgroundColor: Colors.background,
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 5,
  },
  scrollView: {
    maxHeight: height * 0.5,
  },
  scrollContent: {
    padding: 20,
  },
  lastUpdate: {
    fontSize: 12,
    color: Colors.gray,
    fontStyle: 'italic',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: Colors.darkGray,
    lineHeight: 22,
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 14,
    color: Colors.darkGray,
    lineHeight: 22,
    marginLeft: 10,
    marginBottom: 5,
  },
  bold: {
    fontWeight: '600',
    color: Colors.text,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  scrollIndicator: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  scrollHint: {
    fontSize: 12,
    color: Colors.gray,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    backgroundColor: Colors.background,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  acceptButtonDisabled: {
    backgroundColor: Colors.gray,
  },
  acceptButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 11,
    color: Colors.gray,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});
