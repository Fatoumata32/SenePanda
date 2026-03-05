import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Share,
} from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { Heart, ShoppingCart, Share2, ShoppingBag, Volume2, VolumeX } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Product } from '@/types/database';
import { Colors, Spacing, BorderRadius } from '@/constants/Colors';
import { useCart } from '@/contexts/CartContext';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Hook to manage audio mode for the entire app
const setupAudio = async () => {
    try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            allowsRecordingIOS: false,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        });
    } catch (e) {
        console.log('Error setting audio mode:', e);
    }
};

interface VerticalVideoItemProps {
    product: Product;
    isActive: boolean; // True if this video is the one currently on screen
    isFocused: boolean; // True if the screen is currently focused
}

export const VerticalVideoItem = ({ product, isActive, isFocused }: VerticalVideoItemProps) => {
    const video = useRef<Video>(null);
    const router = useRouter();
    const { addToCart } = useCart();
    const [status, setStatus] = useState<any>({});
    const [isMuted, setIsMuted] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        setupAudio();
    }, []);

    useEffect(() => {
        if (isActive && isFocused) {
            video.current?.playAsync();
        } else {
            video.current?.pauseAsync();
            if (!isActive) {
                video.current?.setPositionAsync(0);
            }
        }
    }, [isActive, isFocused]);

    const togglePlay = () => {
        if (status.isPlaying) {
            video.current?.pauseAsync();
        } else {
            video.current?.playAsync();
        }
    };

    const handleAddToCart = () => {
        addToCart(product.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Découvrez ${product.title} sur SenePanda ! ${product.price} ${product.currency}`,
                url: `https://senepanda.com/product/${product.id}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    const navigateToProduct = () => {
        router.push(`/product/${product.id}`);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={togglePlay}
                style={styles.videoContainer}
            >
                <Video
                    ref={video}
                    style={styles.video}
                    source={{ uri: product.video_url || '' }}
                    useNativeControls={false}
                    resizeMode={ResizeMode.COVER}
                    isLooping
                    isMuted={isMuted}
                    onPlaybackStatusUpdate={status => setStatus(() => status)}
                />

                {/* Loading Indicator */}
                {!status.isLoaded && (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={Colors.white} />
                    </View>
                )}

                {/* Overlay d'interaction (Gradient pour lisibilité) */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.overlay}
                >
                    {/* Mute Button */}
                    <TouchableOpacity
                        style={styles.muteButton}
                        onPress={() => setIsMuted(!isMuted)}
                    >
                        {isMuted ? (
                            <VolumeX size={24} color="#fff" />
                        ) : (
                            <Volume2 size={24} color="#fff" />
                        )}
                    </TouchableOpacity>

                    {/* Product Info (Bottom Left) */}
                    <View style={styles.productInfo}>
                        <Text style={styles.productTitle} numberOfLines={2}>
                            {product.title}
                        </Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.productPrice}>
                                {product.price.toLocaleString()} {product.currency}
                            </Text>
                            {product.has_discount && (
                                <View style={styles.discountBadge}>
                                    <Text style={styles.discountText}>-{product.discount_percentage}%</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.description} numberOfLines={2}>
                            {product.description || "Découvrez ce produit incroyable !"}
                        </Text>
                    </View>

                    {/* Action Sidebar (Right) */}
                    <View style={styles.sidebar}>
                        {/* Seller Avatar / Shop Link */}
                        <TouchableOpacity
                            style={styles.shopCircle}
                            onPress={() => router.push(`/shop/${product.seller_id}`)}
                        >
                            <ShoppingBag size={20} color={Colors.primaryOrange} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.sideButton}
                            onPress={() => setIsFavorite(!isFavorite)}
                        >
                            <Heart
                                size={30}
                                color={isFavorite ? '#EF4444' : '#fff'}
                                fill={isFavorite ? '#EF4444' : 'transparent'}
                            />
                            <Text style={styles.sideText}>Favoris</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.sideButton} onPress={handleShare}>
                            <Share2 size={30} color="#fff" />
                            <Text style={styles.sideText}>Partager</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.sideButton, styles.cartButton]}
                            onPress={handleAddToCart}
                        >
                            <ShoppingCart size={30} color="#fff" />
                            <Text style={styles.sideText}>Panier</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* View Product Button (Action bar) */}
                <TouchableOpacity
                    style={styles.viewProductBar}
                    onPress={navigateToProduct}
                >
                    <Text style={styles.viewProductText}>Voir le produit</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT - 60, // Account for TabBar height approx
        backgroundColor: '#000',
    },
    videoContainer: {
        flex: 1,
    },
    video: {
        ...StyleSheet.absoluteFillObject,
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        padding: Spacing.lg,
        justifyContent: 'flex-end',
    },
    muteButton: {
        position: 'absolute',
        top: Spacing.xl,
        right: Spacing.lg,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productInfo: {
        width: '75%',
        marginBottom: Spacing.xl * 2,
    },
    productTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    productPrice: {
        color: Colors.primaryOrange,
        fontSize: 20,
        fontWeight: '800',
    },
    discountBadge: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    discountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    description: {
        color: '#eee',
        fontSize: 14,
        lineHeight: 20,
    },
    sidebar: {
        position: 'absolute',
        right: Spacing.md,
        bottom: Spacing.xl * 2,
        alignItems: 'center',
        gap: 20,
    },
    shopCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.primaryOrange,
        marginBottom: 10,
    },
    sideButton: {
        alignItems: 'center',
        gap: 4,
    },
    sideText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    cartButton: {
        backgroundColor: Colors.primaryOrange,
        padding: 10,
        borderRadius: 30,
        marginTop: 10,
    },
    viewProductBar: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewProductText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
