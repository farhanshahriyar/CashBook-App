import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../contexts/FinanceContext';
import { BalanceCard } from '../../components/finance/BalanceCard';
import { COLORS, CATEGORY_ICONS, CATEGORY_COLORS } from '../../lib/constants';

export default function DashboardScreen() {
  const { balance, monthlyIncome, monthlyExpense, transactions, goals, loading } = useFinance();
  const recentTransactions = transactions.slice(0, 5);
  const activeGoals = goals.slice(0, 3);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent={true} />
      
      <ScrollView bounces={false} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Top Header Section (Green Background) — UNTOUCHED */}
        <View style={styles.headerBackground}>
          <SafeAreaView>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.welcomeText}>Welcome,</Text>
                <Text style={styles.nameText}>Abir Shahriar Farhan 👋</Text>
              </View>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>A</Text>
              </View>
            </View>

            <View style={styles.balanceSection}>
              <BalanceCard
                balance={balance}
                monthlyIncome={monthlyIncome}
                monthlyExpense={monthlyExpense}
              />
            </View>
          </SafeAreaView>
        </View>

        {/* Bottom Content Section */}
        <View style={styles.contentSection}>
          
          {/* Active Goals */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            {activeGoals.length > 0 && (
              <Text style={styles.sectionCount}>{goals.length} total</Text>
            )}
          </View>

          {activeGoals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="flag-outline" size={24} color="#94A3B8" />
              <Text style={styles.emptyCardText}>No active goals yet</Text>
            </View>
          ) : (
            <View style={styles.goalsCard}>
              {activeGoals.map((goal, index) => {
                const progress = goal.targetAmount > 0
                  ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
                  : 0;
                const bgColors = ['#FFF7ED', '#ECFDF5', '#EFF6FF', '#FEF2F2'];
                const barColorValues = ['#F97316', '#16A34A', '#3B82F6', '#EF4444'];
                const colorIdx = index % bgColors.length;

                return (
                  <React.Fragment key={goal.id}>
                    {index > 0 && <View style={styles.goalDivider} />}
                    <View style={styles.goalRow}>
                      <View style={[styles.goalIcon, { backgroundColor: bgColors[colorIdx] }]}>
                        <Text style={styles.goalEmoji}>{goal.emoji || '🎯'}</Text>
                      </View>
                      <View style={styles.goalInfo}>
                        <Text style={styles.goalTitle} numberOfLines={1}>{goal.title}</Text>
                        <View style={styles.goalBarTrack}>
                          <View
                            style={[
                              styles.goalBarFill,
                              {
                                width: `${progress}%`,
                                backgroundColor: barColorValues[colorIdx],
                              },
                            ]}
                          />
                        </View>
                      </View>
                      <View style={styles.goalAmounts}>
                        <Text style={styles.goalSaved}>৳{goal.savedAmount.toFixed(0)}</Text>
                        <Text style={styles.goalTarget}>of ৳{goal.targetAmount.toFixed(0)}</Text>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {/* Recent Transactions */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {recentTransactions.length > 0 && (
              <Text style={styles.sectionCount}>{transactions.length} total</Text>
            )}
          </View>

          {recentTransactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={24} color="#94A3B8" />
              <Text style={styles.emptyCardText}>No transactions yet</Text>
            </View>
          ) : (
            <View style={styles.txCard}>
              {recentTransactions.map((tx, index) => {
                const isIncome = tx.type === 'income';
                const icon = isIncome
                  ? 'trending-up-outline'
                  : (CATEGORY_ICONS[tx.category] || 'ellipsis-horizontal-outline');
                const iconColor = isIncome
                  ? '#16A34A'
                  : (CATEGORY_COLORS[tx.category] || '#64748B');
                const iconBg = isIncome ? '#DCFCE7' : '#F8FAFC';

                return (
                  <React.Fragment key={tx.id}>
                    {index > 0 && <View style={styles.txDivider} />}
                    <View style={styles.txRow}>
                      <View style={[styles.txIcon, { backgroundColor: iconBg }]}>
                        <Ionicons name={icon as any} size={18} color={iconColor} />
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txTitle} numberOfLines={1}>
                          {tx.note || tx.category}
                        </Text>
                        <Text style={styles.txCategory}>
                          {isIncome ? 'Income' : tx.category}
                        </Text>
                      </View>
                      <Text style={[styles.txAmount, { color: isIncome ? '#16A34A' : '#EF4444' }]}>
                        {isIncome ? '+' : '-'}৳{tx.amount.toFixed(2)}
                      </Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {/* Bottom spacer for tab bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },

  // Header — UNTOUCHED
  headerBackground: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  balanceSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },

  // Content
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyCardText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },

  // Goals
  goalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  goalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  goalEmoji: {
    fontSize: 20,
  },
  goalInfo: {
    flex: 1,
    marginRight: 14,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  goalBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  goalAmounts: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  goalSaved: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  goalTarget: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Transactions
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  txDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 3,
  },
  txCategory: {
    fontSize: 12,
    color: '#94A3B8',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
});
