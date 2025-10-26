import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
  HelpCircle,
  Book,
  FileText,
  ExternalLink
} from 'lucide-react-native';

export default function HelpSupportScreen() {
  const router = useRouter();

  const handleEmail = () => {
    Linking.openURL('mailto:support@pandamarket.com');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+33123456789');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/33123456789');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Comment pouvons-nous vous aider ?</Text>
          <Text style={styles.welcomeText}>
            Notre équipe est là pour répondre à toutes vos questions
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nous contacter</Text>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
            <View style={[styles.contactIcon, { backgroundColor: '#DBEAFE' }]}>
              <Mail size={24} color="#3B82F6" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email</Text>
              <Text style={styles.contactDetail}>support@pandamarket.com</Text>
            </View>
            <ExternalLink size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handlePhone}>
            <View style={[styles.contactIcon, { backgroundColor: '#D1FAE5' }]}>
              <Phone size={24} color="#10B981" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Téléphone</Text>
              <Text style={styles.contactDetail}>+33 1 23 45 67 89</Text>
            </View>
            <ExternalLink size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp}>
            <View style={[styles.contactIcon, { backgroundColor: '#D1FAE5' }]}>
              <MessageCircle size={24} color="#25D366" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>WhatsApp</Text>
              <Text style={styles.contactDetail}>Chat en direct</Text>
            </View>
            <ExternalLink size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions fréquentes</Text>

          <View style={styles.faqCard}>
            <HelpCircle size={20} color="#F97316" />
            <Text style={styles.faqQuestion}>Comment créer un compte ?</Text>
          </View>

          <View style={styles.faqCard}>
            <HelpCircle size={20} color="#F97316" />
            <Text style={styles.faqQuestion}>Comment vendre sur Panda Market ?</Text>
          </View>

          <View style={styles.faqCard}>
            <HelpCircle size={20} color="#F97316" />
            <Text style={styles.faqQuestion}>Quels sont les moyens de paiement ?</Text>
          </View>

          <View style={styles.faqCard}>
            <HelpCircle size={20} color="#F97316" />
            <Text style={styles.faqQuestion}>Comment suivre ma commande ?</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ressources</Text>

          <TouchableOpacity style={styles.resourceCard}>
            <Book size={20} color="#9333EA" />
            <Text style={styles.resourceText}>Guide d'utilisation</Text>
            <ExternalLink size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceCard}>
            <FileText size={20} color="#9333EA" />
            <Text style={styles.resourceText}>Conditions d'utilisation</Text>
            <ExternalLink size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceCard}>
            <FileText size={20} color="#9333EA" />
            <Text style={styles.resourceText}>Politique de confidentialité</Text>
            <ExternalLink size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.hoursCard}>
          <Text style={styles.hoursTitle}>Horaires d'ouverture</Text>
          <Text style={styles.hoursText}>Lundi - Vendredi: 9h00 - 18h00</Text>
          <Text style={styles.hoursText}>Samedi: 10h00 - 16h00</Text>
          <Text style={styles.hoursText}>Dimanche: Fermé</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  contactDetail: {
    fontSize: 13,
    color: '#6B7280',
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resourceText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  hoursCard: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  hoursTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  hoursText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});
