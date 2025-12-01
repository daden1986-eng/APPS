import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, DashboardSettings } from '../types';
import Summary from './Summary';
import { FinancialSummaryData } from './Summary';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import ProfitSharing from './ProfitSharing';
import Chart, { ChartDataPoint } from './Chart';
import MonthlySummary from './MonthlySummary';
import Filter, { Filters } from './Filter';
import CategoryChart from './CategoryChart';
import TransactionDetailModal from './TransactionDetailModal';

interface TransactionPageProps {
    transactions: Transaction[];
    financialSummary: FinancialSummaryData;
    chartData: ChartDataPoint[];
    dashboardSettings: DashboardSettings;
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    onUpdateTransaction: (updatedTransaction: Transaction) => void;
    onDeleteTransaction: (id: string) => void;
}

const TransactionPage: React.FC<TransactionPageProps> = ({
    transactions,
    financialSummary,
    chartData,
    dashboardSettings,
    onAddTransaction,
    onUpdateTransaction,
    onDeleteTransaction
}) => {
    const [detailedTransaction, setDetailedTransaction] = useState<Transaction | null>(null);
    const [filters, setFilters] = useState<Filters>({
        dateFrom: '',
        dateTo: '',
        type: 'all',
        description: '',
    });
    
    const handleFilterChange = <K extends keyof Filters>(key: K, value: Filters[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            dateFrom: '',
            dateTo: '',
            type: 'all',
            description: '',
        });
    };
    
    const sortedTransactions = useMemo(() => {
        return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions]);
    
    const filteredTransactions = useMemo(() => {
        return sortedTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
            const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;
            
            if (dateFrom) {
                dateFrom.setHours(0, 0, 0, 0);
            }
            if (dateTo) {
                dateTo.setHours(23, 59, 59, 999);
            }

            const dateMatch = 
                (!dateFrom || transactionDate >= dateFrom) && 
                (!dateTo || transactionDate <= dateTo);
                
            const typeMatch = 
                filters.type === 'all' || transaction.type === filters.type;

            const descriptionMatch = 
                transaction.description.toLowerCase().includes(filters.description.toLowerCase());

            return dateMatch && typeMatch && descriptionMatch;
        });
    }, [sortedTransactions, filters]);
    
    const handleUpdateAndCloseModal = (updatedTransaction: Transaction) => {
        onUpdateTransaction(updatedTransaction);
        setDetailedTransaction(null);
    };

    const handleDeleteAndCloseModal = (id: string) => {
        onDeleteTransaction(id);
        setDetailedTransaction(null);
    };
    
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8" id="transaction-form-anchor">
                    <TransactionForm 
                        onAddTransaction={onAddTransaction}
                    />
                    {dashboardSettings.showSummary && <Summary summary={financialSummary} />}
                    {dashboardSettings.showProfitSharing && <ProfitSharing balance={financialSummary.total.balance} />}
                </div>

                <div className="lg:col-span-2 space-y-8">
                    {dashboardSettings.showChart && <Chart data={chartData} />}
                    {dashboardSettings.showCategoryChart && <CategoryChart transactions={transactions} />}
                    {dashboardSettings.showMonthlySummary && <MonthlySummary transactions={transactions} />}
                    <Filter
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onResetFilters={handleResetFilters}
                    />
                    <TransactionList 
                        transactions={filteredTransactions} 
                        onDeleteTransaction={onDeleteTransaction}
                        onViewTransaction={setDetailedTransaction}
                    />
                </div>
            </div>
            <TransactionDetailModal
                isOpen={!!detailedTransaction}
                transaction={detailedTransaction}
                onClose={() => setDetailedTransaction(null)}
                onUpdateTransaction={handleUpdateAndCloseModal}
                onDeleteTransaction={handleDeleteAndCloseModal}
            />
        </>
    );
};

export default TransactionPage;