import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ProductReview } from '@/types/database';
import { User, ThumbsUp, BadgeCheck } from 'lucide-react-native';
import RatingStars from './RatingStars';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type ReviewCardProps = {
  review: ProductReview;
  onHelpfulPress?: (reviewId: string, isHelpful: boolean) => void;
};

export default function ReviewCard({ review, onHelpfulPress }: ReviewCardProps) {
  const [isHelpful, setIsHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleHelpfulPress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isHelpful) {
        // Remove helpful vote
        await supabase
          .from('review_helpful_votes')
          .delete()
          .eq('review_id', review.id)
          .eq('user_id', user.id);

        setHelpfulCount(prev => prev - 1);
        setIsHelpful(false);
      } else {
        // Add helpful vote
        await supabase
          .from('review_helpful_votes')
          .insert({
            review_id: review.id,
            user_id: user.id,
          });

        setHelpfulCount(prev => prev + 1);
        setIsHelpful(true);
      }

      onHelpfulPress?.(review.id, !isHelpful);
    } catch (error) {
      console.error('Error toggling helpful vote:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {review.user?.avatar_url ? (
            <Image
              source={{ uri: review.user.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatar}>
              <User size={20} color="#6B7280" />
            </View>
          )}
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>
                {review.user?.full_name || 'Utilisateur'}
              </Text>
              {review.verified_purchase && (
                <View style={styles.verifiedBadge}>
                  <BadgeCheck size={14} color="#10B981" />
                  <Text style={styles.verifiedText}>Achat vérifié</Text>
                </View>
              )}
            </View>
            <Text style={styles.date}>{formatDate(review.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* Rating */}
      <RatingStars rating={review.rating} size={16} />

      {/* Title */}
      {review.title && (
        <Text style={styles.title}>{review.title}</Text>
      )}

      {/* Comment */}
      {review.comment && (
        <Text style={styles.comment}>{review.comment}</Text>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <View style={styles.imagesContainer}>
          {review.images.slice(0, 4).map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.reviewImage}
              resizeMode="cover"
            />
          ))}
        </View>
      )}

      {/* Helpful button */}
      <TouchableOpacity
        style={[styles.helpfulButton, isHelpful && styles.helpfulButtonActive]}
        onPress={handleHelpfulPress}>
        <ThumbsUp
          size={16}
          color={isHelpful ? '#3B82F6' : '#6B7280'}
          fill={isHelpful ? '#3B82F6' : 'none'}
        />
        <Text style={[styles.helpfulText, isHelpful && styles.helpfulTextActive]}>
          Utile ({helpfulCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 6,
  },
  comment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginTop: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  reviewImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  helpfulButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  helpfulText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  helpfulTextActive: {
    color: '#3B82F6',
  },
});
