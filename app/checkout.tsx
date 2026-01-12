import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, MapPin, CreditCard, Smartphone, CheckCircle, Coins, Gift } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '@/contexts/CartContext';
import { Colors } from '@/constants/Colors';
import WavePaymentButton from '@/components/payment/WavePaymentButton';
import CoinRedemption from '@/components/checkout/CoinRedemption';
import { useCoinBalance, COINS_TO_FCFA_RATE } from '@/hooks/useCoinBalance';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { balance, spendCoins, addCoins } = useCoinBalance();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wave' | 'cash_on_delivery'>('wave');
  
  // Coin discount state
  const [coinDiscount, setCoinDiscount] = useState(0);
  const [coinsUsed, setCoinsUsed] = useState(0);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      // Vérifier que le panier n'est pas vide
      if (cartItems.length === 0) {
        Alert.alert('Panier vide', 'Votre panier est vide', [
          { text: 'OK', onPress: () => router.replace('/cart') }
        ]);
        return;
      }

      // Load user's profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, first_name, last_name, phone, country, city, address, postal_code')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setFullName(profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim());
        setPhone(profile.phone || '');
        setCity(profile.city || profile.country || '');
        setAddress(profile.address || '');
        setPostalCode(profile.postal_code || '');
        setCountry(profile.country || '');
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const shippingCost = cartTotal > 25000 ? 0 : 2500;
  const tax = cartTotal * 0.1; // 10% tax
  const subtotalBeforeDiscount = cartTotal + shippingCost + tax;
  const total = Math.max(0, subtotalBeforeDiscount - coinDiscount);
  
  // Calculate coins earned from this purchase (1 coin per 1000 FCFA)
  const coinsEarned = Math.floor(total / 1000);

  const handleCoinDiscountApplied = (discount: number, coins: number) => {
    setCoinDiscount(discount);
    setCoinsUsed(coins);
  };

  const handleCoinDiscountRemoved = () => {
    setCoinDiscount(0);
    setCoinsUsed(0);
  };

  const handleCheckout = async () => {
    if (!fullName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom complet');
      return;
    }

    if (!address.trim() || !city.trim() || !phone.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Erreur', 'Votre panier est vide');
      return;
    }

    try {
      setProcessing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Si des coins sont utilisés, les dépenser d'abord
      if (coinsUsed > 0) {
        const spendSuccess = await spendCoins(
          coinsUsed,
          '', // L'ID de commande sera mis à jour après
          `Réduction de ${coinDiscount.toLocaleString()} FCFA sur commande`
        );
        
        if (!spendSuccess) {
          Alert.alert('Erreur', 'Impossible d\'utiliser vos Panda Coins. Veuillez réessayer.');
          setProcessing(false);
          return;
        }
      }

      // Utiliser la fonction SQL pour créer la commande à partir du panier
      const { error: orderError } = await supabase
        .rpc('create_order_from_cart', {
          p_user_id: user.id,
          p_shipping_name: fullName,
          p_shipping_phone: phone,
          p_shipping_address: address,
          p_shipping_city: city,
          p_shipping_postal_code: postalCode || null,
          p_shipping_country: country || 'Sénégal',
          p_order_notes: orderNotes || null,
          p_payment_method: paymentMethod
        });

      if (orderError) throw orderError;

      // Gagner des coins pour cet achat (1 coin par 1000 FCFA dépensés)
      if (coinsEarned > 0) {
        await addCoins(
          coinsEarned,
          'purchase',
          `Achat de ${total.toLocaleString()} FCFA`
        );
      }

      // Le panier a été vidé automatiquement par la fonction SQL
      await clearCart();

      // Message de succès avec info sur les coins
      let successMessage = paymentMethod === 'wave'
        ? 'Votre commande a été créée. Procédez au paiement Wave pour la confirmer.'
        : 'Votre commande a été passée avec succès.';
      
      if (coinDiscount > 0) {
        successMessage += `\n\n🪙 ${coinsUsed} coins utilisés (-${coinDiscount.toLocaleString()} FCFA)`;
      }
      if (coinsEarned > 0) {
        successMessage += `\n\n🎉 +${coinsEarned} Panda Coins gagnés!`;
      }

      Alert.alert(
        'Commande réussie! 🎉',
        successMessage,
        [
          {
            text: 'Voir mes commandes',
            onPress: () => router.replace('/orders'),
          },
          {
            text: 'Continuer mes achats',
            onPress: () => router.replace('/(tabs)/home'),
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      console.error('Checkout error:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la commande');
    } finally {
      setProcessing(false);
    }
  };

  const handleWavePaymentSuccess = (transactionId: string) => {
    console.log('✅ Paiement Wave réussi:', transactionId);
    setProcessing(false);
    // La commande sera mise à jour par le webhook
    Alert.alert(
      'Paiement en cours',
      'Votre paiement Wave est en cours de traitement. Vous recevrez une confirmation dès que le paiement sera validé.',
      [{ text: 'OK', onPress: () => router.replace('/orders') }]
    );
  };

  const handleWavePaymentError = (error: string) => {
    console.error('❌ Erreur paiement Wave:', error);
    setProcessing(false);
    Alert.alert('Erreur de paiement', error);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D97706" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Finaliser la commande</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé de la commande</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Image
                source={{ uri: item.product?.image_url || 'https://via.placeholder.com/50' }}
                style={styles.itemImage}
              />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product?.title}
                </Text>
                <Text style={styles.itemQuantity}>Quantité: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {((item.product?.price || 0) * item.quantity).toLocaleString()} FCFA
              </Text>
            </View>
          ))}

          <View style={styles.pricingDetails}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Sous-total</Text>
              <Text style={styles.priceValue}>{cartTotal.toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Livraison</Text>
              <Text style={[styles.priceValue, shippingCost === 0 && styles.freeShipping]}>
                {shippingCost === 0 ? 'GRATUIT' : `${shippingCost.toLocaleString()} FCFA`}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Taxes (10%)</Text>
              <Text style={styles.priceValue}>{Math.round(tax).toLocaleString()} FCFA</Text>
            </View>
            {coinDiscount > 0 && (
              <View style={styles.priceRow}>
                <View style={styles.discountLabel}>
                  <Coins size={14} color="#059669" />
                  <Text style={styles.discountText}>Réduction Panda Coins</Text>
                </View>
                <Text style={styles.discountValue}>-{coinDiscount.toLocaleString()} FCFA</Text>
              </View>
            )}
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              {Math.round(total).toLocaleString()} FCFA
            </Text>
          </View>

          {/* Coins earned info */}
          {coinsEarned > 0 && (
            <View style={styles.coinsEarnedBox}>
              <Gift size={16} color="#F59E0B" />
              <Text style={styles.coinsEarnedText}>
                Vous gagnerez +{coinsEarned} Panda Coins avec cette commande!
              </Text>
            </View>
          )}
        </View>

        {/* Coin Redemption Section */}
        <CoinRedemption
          orderTotal={subtotalBeforeDiscount}
          onDiscountApplied={handleCoinDiscountApplied}
          onDiscountRemoved={handleCoinDiscountRemoved}
          disabled={processing}
        />

        {/* Shipping Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color="#D97706" />
            <Text style={styles.sectionTitle}>Informations de livraison</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom complet *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ex: Mamadou Diallo"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse complète *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Ex: Rue 10, Médina, Appartement 4B"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Ville *</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Ex: Dakar"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Code postal</Text>
              <TextInput
                style={styles.input}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="Ex: 12000"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pays</Text>
            <TextInput
              style={styles.input}
              value={country}
              onChangeText={setCountry}
              placeholder="Ex: Sénégal"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Téléphone *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+221 XX XXX XX XX"
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes de commande (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={orderNotes}
              onChangeText={setOrderNotes}
              placeholder="Instructions spéciales pour la livraison..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color="#D97706" />
            <Text style={styles.sectionTitle}>Mode de paiement</Text>
          </View>

          {/* Option Wave */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'wave' && styles.paymentOptionSelected
            ]}
            onPress={() => setPaymentMethod('wave')}
            activeOpacity={0.7}
          >
            <View style={styles.paymentOptionContent}>
              <View style={styles.paymentIconContainer}>
                <LinearGradient
                  colors={['#FF6B00', '#FFA500']}
                  style={styles.paymentIconGradient}
                >
                  <Smartphone size={20} color={Colors.white} />
                </LinearGradient>
              </View>
              <View style={styles.paymentTextContainer}>
                <Text style={styles.paymentText}>Wave Mobile Money</Text>
                <Text style={styles.paymentSubtext}>
                  Paiement sécurisé par Wave
                </Text>
              </View>
              {paymentMethod === 'wave' && (
                <CheckCircle size={24} color="#10B981" fill="#10B981" />
              )}
            </View>
          </TouchableOpacity>

          {/* Option Cash on Delivery */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cash_on_delivery' && styles.paymentOptionSelected
            ]}
            onPress={() => setPaymentMethod('cash_on_delivery')}
            activeOpacity={0.7}
          >
            <View style={styles.paymentOptionContent}>
              <View style={styles.paymentIconContainer}>
                <View style={[styles.paymentIconGradient, { backgroundColor: '#6B7280' }]}>
                  <CreditCard size={20} color={Colors.white} />
                </View>
              </View>
              <View style={styles.paymentTextContainer}>
                <Text style={styles.paymentText}>Paiement à la livraison</Text>
                <Text style={styles.paymentSubtext}>
                  Payez en espèces lors de la réception
                </Text>
              </View>
              {paymentMethod === 'cash_on_delivery' && (
                <CheckCircle size={24} color="#10B981" fill="#10B981" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.checkoutButton, processing && styles.buttonDisabled]}
          onPress={handleCheckout}
          disabled={processing}>
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkoutButtonGradient}>
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.checkoutText}>Confirmer la commande</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
  },
  pricingDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  freeShipping: {
    color: '#10B981',
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D97706',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  discountLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  discountText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  coinsEarnedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  coinsEarnedText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  paymentOption: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  paymentOptionSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
  },
  paymentIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTextContainer: {
    flex: 1,
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  paymentSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkoutButton: {
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  checkoutButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
