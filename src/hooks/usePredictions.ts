import { useState, useEffect, useCallback, useMemo } from 'react';
import type { BloodGroup } from '../types';
import type {
  StockoutPrediction,
  BloodUsageTransaction,
} from '../intelligence/types/prediction';
import { useHospitalInventory } from '../context/HospitalInventoryContext';
import { useHospitalRequests } from './useHospitalRequests';
import {
  getVerifiedTransactions,
  recordUsageTransaction as recordLedgerTransaction,
} from '../intelligence/data/usageLedger';
import { predictionService } from '../intelligence/services/predictionService';

export function usePredictions() {
  const { inventory } = useHospitalInventory();
  const { requests } = useHospitalRequests();

  const [transactions, setTransactions] = useState<BloodUsageTransaction[]>(() =>
    getVerifiedTransactions()
  );
  const [predictions, setPredictions] = useState<StockoutPrediction[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O+');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('11:48 AM');

  // Recalculate predictions from authoritative inputs (Section 1)
  const computePredictions = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) setIsRefreshing(true);
      setError(null);

      try {
        const freshTx = getVerifiedTransactions();
        setTransactions(freshTx);

        const results = await predictionService.getAllStockoutPredictions(
          inventory,
          freshTx,
          requests
        );

        setPredictions(results);
        const now = new Date();
        setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.error('Failed to compute stockout predictions', err);
        setError('Prediction engine is temporarily unavailable. Local data remains secure.');
      } finally {
        setIsLoading(false);
        if (showRefreshIndicator) setIsRefreshing(false);
      }
    },
    [inventory, requests]
  );

  useEffect(() => {
    computePredictions(false);
  }, [computePredictions]);

  // Derived lists
  const criticalPredictions = useMemo(
    () => predictions.filter((p) => p.riskLevel === 'critical'),
    [predictions]
  );

  const attentionPredictions = useMemo(
    () => predictions.filter((p) => p.riskLevel === 'critical' || p.riskLevel === 'high'),
    [predictions]
  );

  // Selected blood group's prediction
  const selectedPrediction = useMemo(() => {
    return (
      predictions.find((p) => p.bloodGroup === selectedGroup) ||
      predictions[0] ||
      null
    );
  }, [predictions, selectedGroup]);

  // Record a verified usage event that naturally updates features & predictions (Section 39, 40)
  const recordUsage = useCallback(
    async (txData: Omit<BloodUsageTransaction, 'id' | 'timestamp' | 'timeFormatted'>) => {
      recordLedgerTransaction(txData);
      await computePredictions(true);
    },
    [computePredictions]
  );

  return {
    predictions,
    criticalPredictions,
    attentionPredictions,
    selectedPrediction,
    selectedGroup,
    setSelectedGroup,
    transactions,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refreshPredictions: () => computePredictions(true),
    recordUsage,
  };
}
