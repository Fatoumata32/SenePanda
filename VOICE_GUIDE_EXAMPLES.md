# 🎤 Exemples d'Utilisation du Guidage Vocal

Guide pratique pour intégrer le guidage vocal amélioré dans tous les composants de l'application.

## 📦 Import

```typescript
import {
  speak,
  VoiceMessages,
  announceNavigation,
  announceProductAction,
  announceError,
  announceSuccess,
  announcePrice,
  readNotification,
  confirmAction
} from '@/lib/voiceGuide';
```

## 🛍️ Produits et Panier

### Ajout au Panier

```typescript
const handleAddToCart = async (product: Product) => {
  try {
    await cartStore.addItem(product);

    // Annonce vocale
    await announceProductAction('addedToCart', product.title);
    // OU plus personnalisé:
    await speak(`${product.title} ajouté au panier pour ${product.price} francs CFA`);

    // Vibration optionnelle
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    await announceError('general');
  }
};
```

### Retrait du Panier

```typescript
const handleRemoveFromCart = async (product: Product) => {
  await cartStore.removeItem(product.id);
  await announceProductAction('removedFromCart', product.title);
};
```

### Ajout aux Favoris

```typescript
const handleToggleLike = async (product: Product, isLiked: boolean) => {
  if (isLiked) {
    await announceProductAction('liked', product.title);
  } else {
    await announceProductAction('unliked', product.title);
  }
};
```

### Rupture de Stock

```typescript
const checkStock = async (product: Product) => {
  if (product.stock === 0) {
    await speak(VoiceMessages.products.outOfStock);
    Alert.alert('Rupture de stock', 'Ce produit n\'est plus disponible');
  }
};
```

### Affichage du Prix

```typescript
const ProductPrice = ({ price }: { price: number }) => {
  const handlePricePress = async () => {
    await announcePrice(price);
  };

  return (
    <TouchableOpacity onPress={handlePricePress}>
      <Text>{price} FCFA</Text>
    </TouchableOpacity>
  );
};
```

## 📱 Navigation

### Changement d'Onglet

```typescript
// Dans (tabs)/_layout.tsx ou navigation
const handleTabPress = async (tabName: string) => {
  switch(tabName) {
    case 'home':
      await announceNavigation('home');
      break;
    case 'explore':
      await announceNavigation('explore');
      break;
    case 'cart':
      await announceNavigation('cart');
      break;
    case 'profile':
      await announceNavigation('profile');
      break;
  }
};
```

### Recherche

```typescript
const SearchScreen = () => {
  const handleSearchFocus = async () => {
    await announceNavigation('search');
  };

  const handleSearchResults = async (results: Product[]) => {
    await speak(`${results.length} produits trouvés`);
  };

  return (
    <TextInput
      onFocus={handleSearchFocus}
      onChangeText={handleSearch}
      placeholder="Rechercher..."
    />
  );
};
```

## 🛒 Commandes

### Passage de Commande

```typescript
const handlePlaceOrder = async (order: Order) => {
  try {
    await placeOrder(order);

    await speak(VoiceMessages.orders.placed);

    Alert.alert(
      'Commande passée!',
      'Vous recevrez une notification lors de la préparation.'
    );
  } catch (error) {
    await announceError('general');
  }
};
```

### Statut de Commande

```typescript
const updateOrderStatus = async (status: OrderStatus) => {
  switch(status) {
    case 'confirmed':
      await speak(VoiceMessages.orders.confirmed);
      break;
    case 'shipped':
      await speak(VoiceMessages.orders.shipped);
      break;
    case 'delivered':
      await speak(VoiceMessages.orders.delivered);
      break;
    case 'cancelled':
      await speak(VoiceMessages.orders.cancelled);
      break;
  }
};
```

## 💰 Paiement

### Traitement du Paiement

```typescript
const handlePayment = async (amount: number) => {
  try {
    // Début du traitement
    await speak(VoiceMessages.payment.processing);
    setProcessing(true);

    const result = await processPayment(amount);

    if (result.success) {
      await speak(VoiceMessages.payment.success);
      router.push('/payment-success');
    } else {
      await speak(VoiceMessages.payment.failed);
      Alert.alert('Paiement échoué', 'Veuillez réessayer');
    }
  } catch (error) {
    await announceError('general');
  } finally {
    setProcessing(false);
  }
};
```

### Montant à Payer

```typescript
const CartSummary = ({ total }: { total: number }) => {
  const handleTotalPress = async () => {
    await speak(`Total à payer: ${formatNumberForSpeech(total)} francs CFA`);
  };

  return (
    <TouchableOpacity onPress={handleTotalPress}>
      <Text>Total: {total} FCFA</Text>
    </TouchableOpacity>
  );
};
```

## 🎥 Live Shopping

### Démarrage du Live

```typescript
const startLive = async () => {
  try {
    await createLiveSession();

    // Annonce pour le vendeur
    await speak(VoiceMessages.live.started);

    Alert.alert('🔴 Live démarré!', 'Vous êtes maintenant en direct');
  } catch (error) {
    await announceError('general');
  }
};
```

### Spectateur Rejoint

```typescript
const joinLive = async (liveId: string) => {
  try {
    const session = await getLiveSession(liveId);
    const viewers = session.viewer_count;

    // Annonce pour le spectateur
    await speak(VoiceMessages.live.joined(viewers));

  } catch (error) {
    await announceError('general');
  }
};
```

### Ajout de Produit en Direct

```typescript
const addProductToLive = async (product: Product) => {
  await addFeaturedProduct(product);

  // Annonce pour tous les spectateurs
  await speak(VoiceMessages.live.productAdded);

  // Annonce du prix
  await announcePrice(product.price);
};
```

### Réduction Flash

```typescript
const applyFlashDiscount = async (product: Product, discount: number) => {
  const newPrice = product.price * (1 - discount / 100);

  await updateProductPrice(product.id, newPrice);

  // Annonce dramatique
  await speak(VoiceMessages.live.priceReduced(discount));
  await announcePrice(newPrice);
};
```

## 🔔 Notifications

### Notification Push Reçue

```typescript
const handleNotificationReceived = async (notification: Notification) => {
  // Lire la notification à voix haute
  await readNotification(
    notification.title,
    notification.body
  );
};
```

### Notification In-App

```typescript
const showInAppNotification = async (title: string, message: string) => {
  // Afficher visuellement
  toast.show(title);

  // Annoncer vocalement
  await readNotification(title, message);
};
```

## ✅ Formulaires et Validations

### Validation de Champ

```typescript
const validatePhoneNumber = async (phone: string) => {
  if (!isValidPhone(phone)) {
    await speak(VoiceMessages.auth.phoneInvalid);
    return false;
  }
  return true;
};
```

### Sauvegarde de Formulaire

```typescript
const handleSaveProfile = async (data: ProfileData) => {
  try {
    await saveProfile(data);

    await announceSuccess('saved');
    await confirmAction('Profil mis à jour');

  } catch (error) {
    await announceError('general');
  }
};
```

## 🎮 Actions Utilisateur

### Copie dans Presse-Papier

```typescript
const handleCopyReferralCode = async (code: string) => {
  await Clipboard.setStringAsync(code);

  await announceSuccess('copied');
  await speak(`Code de parrainage ${code} copié`);
};
```

### Suppression

```typescript
const handleDelete = async (item: Item) => {
  Alert.alert(
    'Confirmer',
    'Voulez-vous vraiment supprimer cet élément?',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(item.id);
          await announceSuccess('deleted');
        }
      }
    ]
  );
};
```

## 🎯 Guidage Contextuel

### Première Visite

```typescript
const WelcomeTour = () => {
  useEffect(() => {
    checkFirstVisit();
  }, []);

  const checkFirstVisit = async () => {
    const isFirst = await AsyncStorage.getItem('first_visit');

    if (!isFirst) {
      await speak(VoiceMessages.auth.welcome);
      await speak(VoiceMessages.guide.swipeRight);

      await AsyncStorage.setItem('first_visit', 'false');
    }
  };
};
```

### Nouvelle Fonctionnalité

```typescript
const announceNewFeature = async () => {
  await announceFeature(
    'Live Shopping',
    'Achetez en direct avec vos vendeurs préférés!'
  );
};
```

### Gestes

```typescript
const ProductCard = () => {
  const handleLongPress = async () => {
    await speak(VoiceMessages.guide.longPress);
    showQuickActions();
  };

  const handleDoubleTap = async () => {
    await speak(VoiceMessages.guide.doubleTap);
    toggleLike();
  };

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      onPress={detectDoubleTap}
    >
      {/* ... */}
    </TouchableOpacity>
  );
};
```

## 🌐 Erreurs Réseau

```typescript
const fetchData = async () => {
  try {
    const data = await api.get('/products');
    return data;
  } catch (error) {
    if (error.message.includes('Network')) {
      await announceError('network');
    } else {
      await announceError('general');
    }
    throw error;
  }
};
```

## 🎨 Personnalisation Avancée

### Voix Personnalisée pour Action Spéciale

```typescript
const celebrateAchievement = async (achievement: string) => {
  // Voix excitée (plus rapide, ton plus élevé)
  await speak(
    `Félicitations! Vous avez débloqué ${achievement}!`,
    {
      rate: 1.1,
      pitch: 1.15,
      volume: 1.0
    }
  );
};
```

### Annonce Urgente

```typescript
const announceFlashSale = async () => {
  // Voix urgente (rapide, volume élevé)
  await speak(
    'Vente flash! 50% de réduction pendant 5 minutes seulement!',
    {
      rate: 1.0,
      pitch: 1.1,
      volume: 1.0
    }
  );
};
```

### Annonce Calme

```typescript
const announceBackgroundUpdate = async () => {
  // Voix douce (lent, volume bas)
  await speak(
    'Mise à jour disponible. Installez-la quand vous le souhaitez.',
    {
      rate: 0.7,
      pitch: 0.95,
      volume: 0.6
    }
  );
};
```

## 🔊 Contrôle de la Voix

### Arrêter une Annonce

```typescript
const handleCancel = async () => {
  await stopSpeaking();
  router.back();
};
```

### Vérifier si en Train de Parler

```typescript
const handleNewAnnouncement = async (text: string) => {
  const speaking = await isSpeaking();

  if (speaking) {
    // Attendre que la voix actuelle finisse
    await stopSpeaking();
  }

  await speak(text);
};
```

## 📊 Analytics avec Voix

```typescript
const trackWithVoice = async (event: string, value: number) => {
  // Analytics
  analytics.track(event, { value });

  // Feedback vocal
  if (event === 'purchase_completed') {
    await speak(`Merci pour votre achat de ${value} francs CFA!`);
  }
};
```

## 🎭 Réponses Contextuelles

```typescript
const getContextualResponse = async (context: string, action: string) => {
  const messages = {
    cart: {
      empty: 'Votre panier est vide. Explorez nos produits!',
      full: 'Vous avez beaucoup d\'articles. Prêt à passer commande?',
    },
    live: {
      noViewers: 'Aucun spectateur pour le moment. Continuez!',
      manyViewers: 'Excellent! Vous avez beaucoup de spectateurs.',
    },
  };

  const message = messages[context]?.[action];
  if (message) {
    await speak(message);
  }
};
```

---

**Conseil**: Utilisez le guidage vocal pour les **actions importantes** et **feedbacks utilisateur**, pas pour chaque micro-interaction.

**Règle d'or**: Si c'est important pour l'utilisateur de le savoir, annoncez-le vocalement!
