import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFinance } from '../../contexts/FinanceContext';
import { TransactionForm } from '../../components/finance/TransactionForm';
import { TransactionItem } from '../../components/finance/TransactionItem';
import { COLORS } from '../../lib/constants';
import {
  formatMonth,
  getMonthKey,
  getAdjacentMonths,
} from '../../lib/format';
import { AppModal } from '../../components/ui/Modal';
import type { Transaction } from '../../lib/db/queries';

export default function TransactionsScreen() {
  const { transactions, addTransaction, editTransaction, removeTransaction } = useFinance();
  const [monthKey, setMonthKey] = useState(getMonthKey());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txMonth = getMonthKey(new Date(tx.date));
      return txMonth === monthKey;
    });
  }, [transactions, monthKey]);

  const handleAdd = (data: { type: 'income' | 'expense'; amount: number; category: string; note: string; date: string }) => {
    if (editingTransaction) {
      editTransaction({ ...data, id: editingTransaction.id });
    } else {
      addTransaction(data);
    }
    setModalVisible(false);
    setEditingTransaction(null);
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    removeTransaction(id);
  };

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingTransaction(null);
  };

  const adjacent = getAdjacentMonths(monthKey);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          onPress={() => setMonthKey(adjacent.prev)}
          style={styles.monthButton}
        >
          <Text style={styles.monthButtonText}>&larr;</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{formatMonth(monthKey + '-01')}</Text>
        <TouchableOpacity
          onPress={() => setMonthKey(adjacent.next)}
          style={styles.monthButton}
        >
          <Text style={styles.monthButtonText}>&rarr;</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transactions this month</Text>
          <Text style={styles.emptySubtext}>Tap + to add one</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <TransactionItem
                transaction={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={handleOpenAdd}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal */}
      <AppModal
        visible={modalVisible}
        onClose={handleCloseModal}
        title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}
      >
        <TransactionForm
          transaction={editingTransaction ?? undefined}
          onSubmit={handleAdd}
        />
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  monthButton: {
    padding: 8,
  },
  monthButtonText: {
    fontSize: 18,
    color: COLORS.accent,
    fontWeight: '600',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  listItem: {
    borderBottomColor: COLORS.border,
    borderBottomWidth: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 108,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 28,
  },
});
