import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { pickImageFromGallery, takePhoto } from '@/lib/image-upload';
import { LinearGradient } from 'expo-linear-gradient';

interface ImageUploaderProps {
  value?: string | null;
  onImageSelected: (uri: string) => void;
  aspect?: [number, number];
  placeholder?: string;
  style?: any;
  imageStyle?: any;
}

export default function ImageUploader({
  value,
  onImageSelected,
  aspect = [1, 1],
  placeholder = 'Ajouter une image',
  style,
  imageStyle,
}: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);

  const handleAddFromUrl = () => {
    Alert.prompt(
      'Lien de l\'image',
      'Collez le lien URL de votre image',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Ajouter',
          onPress: (url: any) => {
            if (url && url.trim()) {
              onImageSelected(url.trim());
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const showImageOptions = () => {
    Alert.alert(
      'Choisir une image',
      'Sélectionnez une option',
      [
        {
          text: 'Galerie',
          onPress: handlePickFromGallery,
        },
        {
          text: 'Appareil photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Lien URL',
          onPress: handleAddFromUrl,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ]
    );
  };

  const handlePickFromGallery = async () => {
    try {
      setLoading(true);
      const uri = await pickImageFromGallery(aspect);
      if (uri) {
        onImageSelected(uri);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setLoading(true);
      const uri = await takePhoto(aspect);
      if (uri) {
        onImageSelected(uri);
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={showImageOptions}
      disabled={loading}>
      {loading ? (
        <ActivityIndicator size="large" color="#F59E0B" />
      ) : value ? (
        <>
          <Image source={{ uri: value }} style={[styles.image, imageStyle]} />
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.editOverlay}>
            <Camera size={16} color="#FFFFFF" />
          </LinearGradient>
        </>
      ) : (
        <View style={styles.placeholder}>
          <ImageIcon size={32} color="#9CA3AF" />
          <Text style={styles.placeholderText}>{placeholder}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    fontWeight: '500',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
});
