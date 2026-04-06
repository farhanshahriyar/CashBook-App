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
import { TransactionItem } from '../../components/finance/TransactionItem';
import { COLORS } from '../../lib/constants';

export default function DashboardScreen() {
  const { balance, monthlyIncome, monthlyExpense, transactions, loading } = useFinance();
  const recentTransactions = transactions.slice(0, 5);

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
        
        {/* Top Header Section (Green Background) */}
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

        {/* Bottom Content Section (White Background) */}
        <View style={styles.contentSection}>
          
          <Text style={styles.sectionTitle}>Active Goals</Text>
          <View style={styles.cardContainer}>
            {/* Hardcoded sample to match screenshot for now, until we wire Goals state */}
            <View style={styles.goalRow}>
               <View style={styles.goalIconBox}>
                 <Text style={styles.goalEmoji}>💻</Text>
               </View>
               <Text style={styles.goalTitle}>244hz</Text>
               <View style={styles.goalRight}>
                  <Text style={styles.goalCurrent}>৳0</Text>
                  <Text style={styles.goalTarget}>of ৳50,000</Text>
               </View>
            </View>
            <View style={styles.goalSeparator} />
            <View style={styles.goalRow}>
               <View style={[styles.goalIconBox, {backgroundColor: '#ECFDF5'}]}>
                 <Text style={styles.goalEmoji}>🏠</Text>
               </View>
               <Text style={styles.goalTitle}>Router</Text>
               <View style={styles.goalRight}>
                  <Text style={styles.goalCurrent}>৳0</Text>
                  <Text style={styles.goalTarget}>of ৳3,000</Text>
               </View>
            </View>
            <View style={styles.goalSeparator} />
            <View style={styles.goalRow}>
               <View style={[styles.goalIconBox, {backgroundColor: '#FEF2F2'}]}>
                 <Text style={styles.goalEmoji}>🎯</Text>
               </View>
               <Text style={styles.goalTitle}>Mouse Attack Shark x3 Pro</Text>
               <View style={styles.goalRight}>
                  <Text style={styles.goalCurrent}>৳0</Text>
                  <Text style={styles.goalTarget}>of ৳3,000</Text>
               </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Transactions</Text>
          <View style={[styles.cardContainer, { paddingVertical: 8, paddingHorizontal: 0, paddingBottom: 80 }]}>
            {recentTransactions.length === 0 ? (
              <Text style={styles.emptyText}>No transactions yet</Text>
            ) : (
              recentTransactions.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))
            )}
          </View>

        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  cardContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  goalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  goalEmoji: {
    fontSize: 22,
  },
  goalTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  goalRight: {
    alignItems: 'flex-end',
  },
  goalCurrent: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  goalTarget: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  goalSeparator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  transactionsContainer: {
    marginTop: 8,
    paddingBottom: 80, // Space for FAB
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
