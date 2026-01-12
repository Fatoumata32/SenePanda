/**
 * Composant de configuration du guidage vocal
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Volume2, VolumeX, Settings, Play } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import {
  getVoiceSettings,
  saveVoiceSettings,
  speak,
  VoiceSettings as VoiceSettingsType,
  getAvailableVoices,
} from '@/lib/voiceGuide';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Colors';

export default function VoiceSettingsComponent() {
  const [settings, setSettings] = useState<VoiceSettingsType>({
    enabled: true,
    rate: 0.85,
    pitch: 1.0,
    language: 'fr-FR',
    volume: 1.0,
  });
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadVoices();
  }, []);

  const loadSettings = async () => {
    const saved = await getVoiceSettings();
    setSettings(saved);
  };

  const loadVoices = async () => {
    const voices = await getAvailableVoices();
    setAvailableVoices(voices);
  };

  const updateSetting = async <K extends keyof VoiceSettingsType>(
    key: K,
    value: VoiceSettingsType[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveVoiceSettings({ [key]: value });
  };

  const testVoice = async () => {
    await speak(
      'Voici un exemple de guidage vocal. Vous pouvez ajuster la vitesse et le ton selon vos préférences.',
      {
        rate: settings.rate,
        pitch: settings.pitch,
        volume: settings.volume,
      }
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Volume2 size={32} color={Colors.primaryOrange} />
        <Text style={styles.headerTitle}>Guidage Vocal</Text>
        <Text style={styles.headerSubtitle}>
          Personnalisez l'assistance vocale pour une meilleure expérience
        </Text>
      </View>

      {/* Activer/Désactiver */}
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Activer le guidage vocal</Text>
            <Text style={styles.settingDescription}>
              Recevoir des annonces vocales pour vos actions
            </Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={(value) => {
              updateSetting('enabled', value);
              if (value) {
                speak('Guidage vocal activé');
              }
            }}
            trackColor={{ false: Colors.gray200, true: Colors.primaryOrange }}
            thumbColor={settings.enabled ? Colors.white : Colors.gray400}
          />
        </View>
      </View>

      {settings.enabled && (
        <>
          {/* Vitesse de lecture */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vitesse de lecture</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Lent</Text>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={1.5}
                value={settings.rate}
                onValueChange={(value) => updateSetting('rate', value)}
                minimumTrackTintColor={Colors.primaryOrange}
                maximumTrackTintColor={Colors.gray300}
                thumbTintColor={Colors.primaryOrange}
                step={0.05}
              />
              <Text style={styles.sliderLabel}>Rapide</Text>
            </View>
            <Text style={styles.sliderValue}>
              {(settings.rate * 100).toFixed(0)}%
            </Text>
          </View>

          {/* Ton de la voix */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ton de la voix</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Grave</Text>
              <Slider
                style={styles.slider}
                minimumValue={0.7}
                maximumValue={1.3}
                value={settings.pitch}
                onValueChange={(value) => updateSetting('pitch', value)}
                minimumTrackTintColor={Colors.primaryOrange}
                maximumTrackTintColor={Colors.gray300}
                thumbTintColor={Colors.primaryOrange}
                step={0.05}
              />
              <Text style={styles.sliderLabel}>Aigu</Text>
            </View>
            <Text style={styles.sliderValue}>
              {(settings.pitch * 100).toFixed(0)}%
            </Text>
          </View>

          {/* Volume */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Volume</Text>
            <View style={styles.sliderContainer}>
              <VolumeX size={20} color={Colors.textMuted} />
              <Slider
                style={styles.slider}
                minimumValue={0.3}
                maximumValue={1.0}
                value={settings.volume}
                onValueChange={(value) => updateSetting('volume', value)}
                minimumTrackTintColor={Colors.primaryOrange}
                maximumTrackTintColor={Colors.gray300}
                thumbTintColor={Colors.primaryOrange}
                step={0.1}
              />
              <Volume2 size={20} color={Colors.textPrimary} />
            </View>
            <Text style={styles.sliderValue}>
              {(settings.volume * 100).toFixed(0)}%
            </Text>
          </View>

          {/* Bouton de test */}
          <TouchableOpacity style={styles.testButton} onPress={testVoice}>
            <Play size={20} color={Colors.white} />
            <Text style={styles.testButtonText}>Tester la voix</Text>
          </TouchableOpacity>

          {/* Informations */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Astuces</Text>
            <Text style={styles.infoText}>
              • Vitesse recommandée: 80-90% pour une meilleure compréhension
            </Text>
            <Text style={styles.infoText}>
              • Ton naturel: 100% pour une voix équilibrée
            </Text>
            <Text style={styles.infoText}>
              • Le guidage vocal annonce vos actions importantes
            </Text>
          </View>

          {/* Statistiques */}
          {availableVoices.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Voix disponibles</Text>
              <Text style={styles.voicesCount}>
                {availableVoices.length} voix installées sur votre appareil
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
  },
  settingDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    width: 50,
    textAlign: 'center',
  },
  sliderValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primaryOrange,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryOrange,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  testButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  infoBox: {
    backgroundColor: Colors.blue50,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  voicesCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
});
