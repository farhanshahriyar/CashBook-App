import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppLock } from '../../contexts/AppLockContext';
import { useFinance } from '../../contexts/FinanceContext';
import { useUser } from '../../contexts/UserContext';
import { useFont, FONT_OPTIONS, FONT_WEIGHT_MAPS, FontFamily } from '../../contexts/FontContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { COLORS } from '../../lib/constants';
import { clearAllData } from '../../lib/db/queries';
import { exportBackup, validateBackup, importBackup, readBackupFile, CashBookBackup } from '../../lib/backup';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import tw from '../../lib/tw';

export default function SettingsScreen() {
  const router = useRouter();
  const { isBiometricEnabled, setBiometricEnabled, isEnrolled } = useAppLock();
  const { balance, transactions, monthlyIncome, monthlyExpense, refresh } = useFinance();
  const { profile, saveProfile, clearUserData } = useUser();
  const { selectedFont, setSelectedFont } = useFont();
  const { hasPermission, pushEnabled, setPushEnabled, weeklyEnabled, setWeeklyEnabled } = useNotifications();
  const [exporting, setExporting] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<CashBookBackup | null>(null);

  const handleClearData = useCallback(async () => {
    setClearing(true);
    try {
      // 1. Clear SQLite tables (transactions + goals)
      await clearAllData();
      await refresh(); // Sync FinanceContext state to empty DB

      // 2. Clear all AsyncStorage keys (profile, onboarding, biometric, font)
      await AsyncStorage.clear();

      // 3. Clear all in-memory contextual states
      clearUserData();
      await setBiometricEnabled(false);
      // Reset font if needed (optional)
      setSelectedFont('Inter');

      // 4. Navigate back to welcome screen
      setShowClearConfirm(false);
      router.replace('/onboarding/welcome');
    } catch (err) {
      Alert.alert('Error', 'Could not clear data. Please try again.');
    } finally {
      setClearing(false);
    }
  }, [router, refresh, clearUserData, setBiometricEnabled, setSelectedFont]);

  // Edit profile form state
  const [editName, setEditName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editOccupation, setEditOccupation] = useState('');

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // ── Notification toggle handlers ──────────────────────────────────────────
  const handlePushToggle = useCallback(async (value: boolean) => {
    await setPushEnabled(value);
    if (value && !hasPermission) {
      showToast('Please enable notifications for CashBook in your device Settings to receive daily reminders.');
    }
  }, [setPushEnabled, hasPermission, showToast]);

  const handleWeeklyToggle = useCallback(async (value: boolean) => {
    await setWeeklyEnabled(value);
    if (value && !hasPermission) {
      showToast('Please enable notifications for CashBook in your device Settings to receive weekly reports.');
    }
  }, [setWeeklyEnabled, hasPermission, showToast]);

  const openEditProfile = () => {
    setEditName(profile?.fullName || '');
    setEditDesignation(profile?.designation || '');
    setEditOccupation(profile?.occupation || '');
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Full Name is required');
      return;
    }
    await saveProfile({
      fullName: editName.trim(),
      designation: editDesignation.trim(),
      occupation: editOccupation.trim(),
    });
    setShowEditProfile(false);
  };

  const handleFontSelect = async (font: FontFamily) => {
    await setSelectedFont(font);
    setShowFontPicker(false);
  };

  // Derived stats
  const totalTransactions = transactions.length;
  // A fake "saved" number based on income - expense or similar, let's just use balance for now
  const savedAmount = balance;

  const handleExportPDF = useCallback(async () => {
    setExporting(true);
    try {
      const rows = transactions.map(
        (tx) =>
          `<tr>
            <td>${new Date(tx.date).toLocaleDateString()}</td>
            <td>${tx.note || tx.category}</td>
            <td><span class="badge">${tx.category.toLowerCase()}</span></td>
            <td style="text-align: right;" class="${tx.type === 'income' ? 'amt-income' : 'amt-expense'}">${tx.type === 'income' ? '+' : '-'}৳${tx.amount.toFixed(0)}</td>
          </tr>`
      ).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #0f172a; background: #fafaf9; }
            .header-brand { font-size: 24px; font-weight: 700; color: #16a34a; margin-bottom: 4px; }
            h1 { font-size: 20px; font-weight: 500; margin-top: 0; margin-bottom: 8px; color: #334155; }
            .date-gen { font-size: 12px; color: #94a3b8; margin-bottom: 40px; }
            .footer { font-size: 12px; color: #94a3b8; margin-bottom: 40px; text-align: center; } 
            .summary-cards { display: flex; gap: 16px; margin-bottom: 32px; border-bottom: 1px solid #f1f5f9; padding-bottom: 32px; }
            .card { flex: 1; background: #ffffff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center; }
            .card-label { font-size: 10px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .card-value { font-size: 24px; font-weight: 700; }
            .val-balance { color: #16a34a; }
            .val-income { color: #16a34a; }
            .val-expense { color: #ef4444; }

            h2 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
            th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid #f1f5f9; color: #334155; }
            tr:last-child td { border-bottom: none; }
            
            .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; background: #f8fafc; font-size: 11px; color: #64748b; border: 1px solid #e2e8f0; }
            .amt-income { color: #16a34a; font-weight: 600; }
            .amt-expense { color: #ef4444; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header-brand">CashBook</div>
          <h1>Financial Report - ${profile?.fullName || 'CashBook User'}</h1>
          <div class="date-gen">Generated on ${new Date().toLocaleDateString()}</div>
          
          <div class="summary-cards">
            <div class="card">
              <div class="card-label">Total Balance</div>
              <div class="card-value val-balance">৳${balance.toFixed(0)}</div>
            </div>
            <div class="card">
              <div class="card-label">Monthly Income</div>
              <div class="card-value val-income">৳${monthlyIncome.toFixed(0)}</div>
            </div>
            <div class="card">
              <div class="card-label">Monthly Expense</div>
              <div class="card-value val-expense">৳${monthlyExpense.toFixed(0)}</div>
            </div>
          </div>

          <h2>Transaction History</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="4" style="text-align: center; padding: 24px;">No transactions</td></tr>'}</tbody>
          </table>
          <div class="footer">©copyright 2026 - CashBook App</div>
        </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (err) {
      Alert.alert('Export Failed', 'Could not generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [transactions, balance, monthlyIncome, monthlyExpense]);

  // ── Backup Export ─────────────────────────────────────────────────────────
  const handleExportBackup = useCallback(async () => {
    setBackingUp(true);
    try {
      const fileUri = await exportBackup();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Save CashBook Backup',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
      }
    } catch (err) {
      console.error('Export backup error:', err);
      Alert.alert('Export Failed', 'Could not create backup. Please try again.');
    } finally {
      setBackingUp(false);
    }
  }, []);

  // ── Backup Import ─────────────────────────────────────────────────────────
  const handlePickImportFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];

      let parsed: unknown;
      try {
        parsed = await readBackupFile(asset.uri);
      } catch {
        Alert.alert('Invalid File', 'The selected file is not valid JSON.');
        return;
      }

      const backup = validateBackup(parsed);
      setPendingBackup(backup);
      setShowImportConfirm(true);
    } catch (err: any) {
      Alert.alert('Import Error', err?.message || 'Could not read the backup file.');
    }
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!pendingBackup) return;
    setImporting(true);
    try {
      await importBackup(pendingBackup);
      await refresh();

      // Reload user profile into context
      if (pendingBackup.data.preferences.userProfile) {
        await saveProfile(pendingBackup.data.preferences.userProfile);
      }

      setShowImportConfirm(false);
      setPendingBackup(null);
      showToast('Backup restored successfully! 🎉');
    } catch (err) {
      console.error('Import backup error:', err);
      Alert.alert('Restore Failed', 'Could not restore backup. Please try again.');
    } finally {
      setImporting(false);
    }
  }, [pendingBackup, refresh, saveProfile, showToast]);

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const renderRow = (
    iconName: keyof typeof Ionicons.glyphMap,
    iconColor: string,
    iconBgColor: string,
    label: string,
    rightContent: React.ReactNode,
    onPress?: () => void,
    hideBorder: boolean = false
  ) => {
    const Component = onPress ? TouchableOpacity : View;
    return (
      <Component
        style={[styles.row, !hideBorder && styles.rowBorder]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          <View style={[styles.iconBox, { backgroundColor: iconBgColor }]}>
            <Ionicons name={iconName} size={18} color={iconColor} />
          </View>
          <Text style={[styles.rowLabel, label === 'Clear All Data' && { color: COLORS.expense }]}>
            {label}
          </Text>
        </View>
        <View style={styles.rowRight}>{rightContent}</View>
      </Component>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'G'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.fullName || 'Guest User'}</Text>
              <Text style={styles.profileSubtitle}>{profile?.designation || 'No designation'}</Text>
              <Text style={styles.profileSubtitle2}>{profile?.occupation || 'No occupation'}</Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={openEditProfile}>
              <Ionicons name="pencil" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statColumn}>
              <Text style={styles.statValue}>৳{balance.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Balance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>৳{savedAmount.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statColumn}>
              <Text style={styles.statValue}>{totalTransactions}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        {renderSectionHeader('NOTIFICATIONS')}

        {/* Permission-denied banner */}
        {!hasPermission && (
          <View style={styles.permissionBanner}>
            <View style={styles.permissionBannerIcon}>
              <Ionicons name="alert-circle" size={18} color="#D97706" />
            </View>
            <Text style={styles.permissionBannerText}>
              Notifications are disabled. Enable them in your{' '}
              <Text style={styles.permissionBannerLink}>device Settings → CashBook</Text> to
              receive reminders.
            </Text>
          </View>
        )}

        <View style={styles.cardGroup}>
          {renderRow(
            'notifications-outline', '#8B5CF6', '#F3E8FF',
            'Daily Reminder',
            <Switch
              value={pushEnabled}
              onValueChange={handlePushToggle}
              trackColor={{ false: '#E2E8F0', true: COLORS.primary }}
              thumbColor={pushEnabled ? '#fff' : '#fff'}
            />,
            undefined, false
          )}
          {renderRow(
            'stats-chart-outline', COLORS.primary, '#DCFCE7',
            'Weekly Report',
            <Switch
              value={weeklyEnabled}
              onValueChange={handleWeeklyToggle}
              trackColor={{ false: '#E2E8F0', true: COLORS.primary }}
              thumbColor={weeklyEnabled ? '#fff' : '#fff'}
            />,
            undefined, true
          )}
        </View>

        {/* Preferences */}
        {renderSectionHeader('PREFERENCES')}
        <View style={styles.cardGroup}>
          {renderRow('logo-usd', '#F59E0B', '#FEF3C7', 'Currency',
            <View style={styles.rightValueBox}>
              <Text style={styles.rightValueText}>৳ BDT</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </View>, undefined, false
          )}
          {renderRow('calendar-outline', '#3B82F6', '#DBEAFE', 'Budget Period',
            <View style={styles.rightValueBox}>
              <Text style={styles.rightValueText}>Monthly</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </View>, undefined, false
          )}
          {/* {renderRow('text-outline', '#EC4899', '#FCE7F3', 'Font',
            <View style={styles.rightValueBox}>
              <Text style={styles.rightValueText}>{FONT_OPTIONS.find(f => f.key === selectedFont)?.label || 'Inter'}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
            </View>, () => setShowFontPicker(true), true
          )} */}
        </View>

        {/* Security */}
        {renderSectionHeader('SECURITY')}
        <View style={styles.cardGroup}>
          {renderRow('lock-closed-outline', '#64748B', '#F1F5F9', 'Biometric Lock',
            <Switch value={isBiometricEnabled} onValueChange={setBiometricEnabled} trackColor={{ true: COLORS.primary }} />, undefined, false
          )}
          {renderRow('shield-checkmark-outline', '#64748B', '#F1F5F9', 'Privacy Policy',
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />, () => setShowPrivacyPolicy(true), true
          )}
        </View>

        {/* Data Management */}
        {renderSectionHeader('DATA MANAGEMENT')}
        <View style={styles.cardGroup}>
          {renderRow('cloud-upload-outline', COLORS.primary, '#DCFCE7', 'Export Backup',
            backingUp
              ? <Text style={styles.rightValueText}>Exporting…</Text>
              : <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />,
            backingUp ? undefined : handleExportBackup, false
          )}
          {renderRow('cloud-download-outline', '#3B82F6', '#DBEAFE', 'Import Backup',
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />,
            handlePickImportFile, false
          )}
          {renderRow('download-outline', '#8B5CF6', '#F3E8FF', 'Export PDF',
            exporting
              ? <Text style={styles.rightValueText}>Generating…</Text>
              : <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />,
            exporting ? undefined : handleExportPDF, false
          )}
          {renderRow('trash-outline', COLORS.expense, '#FEF2F2', 'Clear All Data',
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />, () => setShowClearConfirm(true), true
          )}
        </View>

        {/* About */}
        {renderSectionHeader('ABOUT')}
        <View style={styles.cardGroup}>
          {renderRow('information-circle-outline', '#64748B', '#F1F5F9', 'Changelog',
            <Text style={styles.rightValueText}>initial release 0.0.9</Text>, () => setShowChangelog(true), false
          )}
          {renderRow('star-outline', '#F59E0B', '#FEF3C7', 'Rate the App',
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />, undefined, true
          )}
        </View>

        <Text style={styles.footerText}>Initial Release Version 0.0.9</Text>

      </ScrollView>

      {/* What's New Modal */}
      {showChangelog && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowChangelog(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <Ionicons name="layers-outline" size={32} color={COLORS.accent} />
              </View>
              <View style={styles.modalTitleBox}>
                <Text style={styles.modalTitle}>What's New</Text>
                <Text style={styles.modalSubtitle}>CashBook v0.0.9 Features</Text>
              </View>
            </View>

            <View style={styles.modalFeatures}>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} style={styles.featureIcon} />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>Biometric Lock</Text>
                  <Text style={styles.featureDesc}>Your financial data is protected by native FaceID and TouchID hardware.</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="disc-outline" size={24} color={'#8B5CF6'} style={styles.featureIcon} />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>Active Goals</Text>
                  <Text style={styles.featureDesc}>Visually map your savings targets with dynamic progress bars and emojis.</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <Ionicons name="document-text-outline" size={24} color={'#F59E0B'} style={styles.featureIcon} />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>PDF Export</Text>
                  <Text style={styles.featureDesc}>Generate and share beautiful financial HTML reports natively via iOS/Android.</Text>
                </View>
              </View>
              {/* 
              <View style={styles.featureItem}>
                <Ionicons name="cloud-outline" size={24} color={'#06B6D4'} style={styles.featureIcon} />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>Cloud Edge Sync</Text>
                  <Text style={styles.featureDesc}>Your data instantly syncs securely across all devices through our storage.</Text>
                </View>
              </View> */}
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowChangelog(false)}>
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPrivacyPolicy(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="shield-checkmark-outline" size={28} color="#64748B" />
              </View>
              <View style={styles.modalTitleBox}>
                <Text style={styles.modalTitle}>Privacy Policy</Text>
                <Text style={styles.modalSubtitle}>How we handle your data</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPrivacyPolicy(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400, marginBottom: 24 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 22, marginBottom: 12 }}>
                <Text style={{ fontWeight: 'bold' }}>1. Data Storage: </Text>
                All your financial data, including transactions and goals, are securely stored locally on your device using SQLite. We do not transmit or store your financial data on external servers.
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 22, marginBottom: 12 }}>
                <Text style={{ fontWeight: 'bold' }}>2. Biometric Authentication: </Text>
                If enabled, we use your device's native FaceID or TouchID hardware to protect your data. Your biometric data never leaves your device and is not accessible to CashBook.
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 22, marginBottom: 12 }}>
                <Text style={{ fontWeight: 'bold' }}>3. Export features: </Text>
                When you choose to export your data as a PDF, the file is generated locally. You have full control over where to share or save the generated file.
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.text, lineHeight: 22 }}>
                <Text style={{ fontWeight: 'bold' }}>4. Analytics: </Text>
                We do not integrate any third-party analytics trackers that monitor your specific financial inputs or behavior within the app.
              </Text>
            </ScrollView>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowPrivacyPolicy(false)}>
              <Text style={styles.modalButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEditProfile(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="person-outline" size={28} color={COLORS.primary} />
              </View>
              <View style={styles.modalTitleBox}>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <Text style={styles.modalSubtitle}>Update your personal information</Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={styles.editLabel}>FULL NAME</Text>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your full name"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={styles.editLabel}>DESIGNATION</Text>
              <TextInput
                style={styles.editInput}
                value={editDesignation}
                onChangeText={setEditDesignation}
                placeholder="e.g. Software Engineer"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={styles.editLabel}>OCCUPATION</Text>
              <TextInput
                style={styles.editInput}
                value={editOccupation}
                onChangeText={setEditOccupation}
                placeholder="e.g. Full-time, Freelancer"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity style={[styles.modalButton, { backgroundColor: COLORS.primary }]} onPress={handleSaveProfile}>
              <Text style={styles.modalButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Font Picker Modal */}
      {showFontPicker && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFontPicker(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name="text-outline" size={28} color="#EC4899" />
              </View>
              <View style={styles.modalTitleBox}>
                <Text style={styles.modalTitle}>Choose Font</Text>
                <Text style={styles.modalSubtitle}>Applied across the entire app</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFontPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {FONT_OPTIONS.map((font, index) => (
              <TouchableOpacity
                key={font.key}
                style={[
                  styles.fontRow,
                  index < FONT_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
                ]}
                onPress={() => handleFontSelect(font.key)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.fontLabel,
                    { fontFamily: FONT_WEIGHT_MAPS[font.key]?.['400'] || font.key },
                    selectedFont === font.key && { color: COLORS.primary, fontWeight: '700', fontFamily: FONT_WEIGHT_MAPS[font.key]?.['700'] || font.key },
                  ]}>
                    {font.label}
                  </Text>
                  {selectedFont === font.key && (
                    <Text style={{ fontSize: 12, color: COLORS.primary, marginTop: 2, fontFamily: FONT_WEIGHT_MAPS[font.key]?.['400'] || font.key }}>Currently active</Text>
                  )}
                </View>
                {selectedFont === font.key && (
                  <View style={styles.fontCheck}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Clear All Data Confirmation Modal */}
      {showClearConfirm && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowClearConfirm(false)} />
          <View style={tw`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-2xl`}>
            {/* Warning Icon */}
            <View style={tw`items-center mb-6`}>
              <View style={tw`w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-4`}>
                <Ionicons name="warning-outline" size={32} color={COLORS.expense} />
              </View>
              <Text style={tw`text-xl font-bold text-slate-900 text-center mb-2`}>Delete All Data?</Text>
              <Text style={tw`text-sm text-slate-500 text-center leading-relaxed px-4`}>
                This will permanently erase all your transactions, goals, profile, and preferences. This action cannot be undone.
              </Text>
            </View>

            {/* Summary of what gets deleted */}
            <View style={tw`bg-red-50 rounded-2xl p-4 mb-6`}>
              <View style={tw`flex-row items-center mb-3`}>
                <Ionicons name="receipt-outline" size={18} color={COLORS.expense} />
                <Text style={tw`text-sm text-slate-700 ml-3`}>{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</Text>
              </View>
              <View style={tw`flex-row items-center mb-3`}>
                <Ionicons name="flag-outline" size={18} color={COLORS.expense} />
                <Text style={tw`text-sm text-slate-700 ml-3`}>All saving goals</Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <Ionicons name="person-outline" size={18} color={COLORS.expense} />
                <Text style={tw`text-sm text-slate-700 ml-3`}>Profile & preferences</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={tw`w-full bg-red-500 py-4 rounded-2xl mb-3`}
              activeOpacity={0.8}
              onPress={handleClearData}
              disabled={clearing}
            >
              <Text style={tw`text-center text-white font-bold text-base`}>
                {clearing ? 'Deleting...' : 'Yes, Delete Everything'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`w-full bg-slate-100 py-4 rounded-2xl`}
              activeOpacity={0.8}
              onPress={() => setShowClearConfirm(false)}
            >
              <Text style={tw`text-center text-slate-700 font-bold text-base`}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Import Backup Confirmation Modal */}
      {showImportConfirm && pendingBackup && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setShowImportConfirm(false); setPendingBackup(null); }} />
          <View style={tw`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-2xl`}>
            {/* Icon */}
            <View style={tw`items-center mb-6`}>
              <View style={tw`w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-4`}>
                <Ionicons name="cloud-download-outline" size={32} color="#3B82F6" />
              </View>
              <Text style={tw`text-xl font-bold text-slate-900 text-center mb-2`}>Restore from Backup?</Text>
              <Text style={tw`text-sm text-slate-500 text-center leading-relaxed px-4`}>
                This will replace all your current data with the backup from{' '}
                <Text style={tw`font-bold text-slate-700`}>
                  {new Date(pendingBackup.exportedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
                . This action cannot be undone.
              </Text>
            </View>

            {/* Backup summary */}
            <View style={tw`bg-blue-50 rounded-2xl p-4 mb-6`}>
              <View style={tw`flex-row items-center mb-3`}>
                <Ionicons name="receipt-outline" size={18} color="#3B82F6" />
                <Text style={tw`text-sm text-slate-700 ml-3`}>
                  {pendingBackup.data.transactions.length} transaction{pendingBackup.data.transactions.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={tw`flex-row items-center mb-3`}>
                <Ionicons name="flag-outline" size={18} color="#3B82F6" />
                <Text style={tw`text-sm text-slate-700 ml-3`}>
                  {pendingBackup.data.goals.length} saving goal{pendingBackup.data.goals.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <Ionicons name="person-outline" size={18} color="#3B82F6" />
                <Text style={tw`text-sm text-slate-700 ml-3`}>
                  {pendingBackup.data.preferences.userProfile?.fullName || 'Guest User'}'s profile & preferences
                </Text>
              </View>
            </View>

            {/* Warning */}
            <View style={tw`flex-row items-start bg-amber-50 rounded-xl p-3 mb-6 border border-amber-200`}>
              <Ionicons name="alert-circle" size={18} color="#D97706" style={{ marginTop: 1 }} />
              <Text style={tw`text-xs text-amber-800 ml-2 flex-1 leading-relaxed`}>
                Your current transactions, goals, and preferences will be permanently replaced.
              </Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={tw`w-full bg-blue-500 py-4 rounded-2xl mb-3`}
              activeOpacity={0.8}
              onPress={handleConfirmImport}
              disabled={importing}
            >
              <Text style={tw`text-center text-white font-bold text-base`}>
                {importing ? 'Restoring…' : 'Yes, Restore Backup'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`w-full bg-slate-100 py-4 rounded-2xl`}
              activeOpacity={0.8}
              onPress={() => { setShowImportConfirm(false); setPendingBackup(null); }}
            >
              <Text style={tw`text-center text-slate-700 font-bold text-base`}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tailwind CSS Toast */}
      {toastMessage && (
        <View style={tw`absolute bottom-10 left-5 right-5 bg-slate-800 rounded-xl px-4 py-3.5 shadow-xl flex-row items-center border border-slate-700 z-50`}>
          <Ionicons name="information-circle" size={22} color="#38BDF8" />
          <Text style={tw`text-white flex-1 flex-wrap text-[13.5px] ml-3 font-medium leading-relaxed`}>
            {toastMessage}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 8,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  profileSubtitle2: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  cardGroup: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightValueText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 32,
    marginBottom: 40,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  permissionBannerIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  permissionBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 19,
  },
  permissionBannerLink: {
    fontWeight: '700',
    color: '#B45309',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalTitleBox: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalFeatures: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  featureIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  editLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  editInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fontRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  fontLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  fontCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
