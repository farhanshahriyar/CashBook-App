import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Switch,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAppLock } from '../../contexts/AppLockContext';
import { useFinance } from '../../contexts/FinanceContext';
import { COLORS } from '../../lib/constants';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function SettingsScreen() {
  const { isBiometricEnabled, setBiometricEnabled, isEnrolled } = useAppLock();
  const { balance, transactions, monthlyIncome, monthlyExpense } = useFinance();
  const [exporting, setExporting] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  // Use state for UI switches as placeholders matching screenshot
  const [pushEnabled, setPushEnabled] = useState(true);
  const [weeklyEnabled, setWeeklyEnabled] = useState(true);

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
          <h1>Financial Report - Abir Shahriar Farhan</h1>
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
          <Text style={[styles.rowLabel, label === 'Clear All Data' && {color: COLORS.expense}]}>
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
              <Text style={styles.avatarText}>A</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Abir Shahriar Farhan</Text>
              <Text style={styles.profileSubtitle}>Software Engineer II</Text>
              <Text style={styles.profileSubtitle2}>Service Professional</Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
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
              <Text style={[styles.statValue, {color: COLORS.primary}]}>৳{savedAmount.toFixed(0)}</Text>
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
        <View style={styles.cardGroup}>
          {renderRow('notifications-outline', '#8B5CF6', '#F3E8FF', 'Push Notifications', 
            <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{true: COLORS.primary}} />, undefined, false
          )}
          {renderRow('stats-chart-outline', COLORS.primary, '#DCFCE7', 'Weekly Report', 
            <Switch value={weeklyEnabled} onValueChange={setWeeklyEnabled} trackColor={{true: COLORS.primary}} />, undefined, true
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
            </View>, undefined, true
          )}
        </View>

        {/* Security */}
        {renderSectionHeader('SECURITY')}
        <View style={styles.cardGroup}>
          {renderRow('lock-closed-outline', '#64748B', '#F1F5F9', 'Biometric Lock', 
            <Switch value={isBiometricEnabled} onValueChange={setBiometricEnabled} trackColor={{true: COLORS.primary}} />, undefined, false
          )}
          {renderRow('shield-checkmark-outline', '#64748B', '#F1F5F9', 'Privacy Policy', 
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />, undefined, true
          )}
        </View>

        {/* Data */}
        {renderSectionHeader('DATA')}
        <View style={styles.cardGroup}>
          {renderRow('download-outline', COLORS.primary, '#DCFCE7', 'Export PDF', 
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />, handleExportPDF, false
          )}
          {renderRow('trash-outline', COLORS.expense, '#FEF2F2', 'Clear All Data', 
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />, undefined, false
          )}
          {renderRow('log-out-outline', COLORS.expense, '#FEF2F2', 'Sign Out', 
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />, undefined, true
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

              <View style={styles.featureItem}>
                <Ionicons name="cloud-outline" size={24} color={'#06B6D4'} style={styles.featureIcon} />
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>Cloud Edge Sync</Text>
                  <Text style={styles.featureDesc}>Your data instantly syncs securely across all devices through our storage.</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowChangelog(false)}>
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: 16,
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
    backgroundColor: '#3B82F6', // Blue as seen in screenshot
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
