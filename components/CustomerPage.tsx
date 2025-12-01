import React from 'react';
import { Customer, TransactionMode, CompanyProfile } from '../types';
import CustomerForm from './CustomerForm';
import CustomerList from './CustomerList';

interface CustomerPageProps {
  customers: Customer[];
  editingCustomer: Customer | null;
  companyProfile: CompanyProfile;
  onAddCustomer: (customerData: Pick<Customer, 'name' | 'fee' | 'phone' | 'subscriptionType'>) => void;
  onUpdateCustomer: (updatedCustomerData: Pick<Customer, 'id' | 'name' | 'fee' | 'phone' | 'subscriptionType'>) => void;
  onCancelEdit: () => void;
  onDeleteCustomer: (id: string) => void;
  onSetEditingCustomer: (customer: Customer) => void;
  onMarkAsPaid: (id: string, mode: TransactionMode) => void;
  onResetAllPayments: () => void;
}

const CustomerPage: React.FC<CustomerPageProps> = ({
  customers,
  editingCustomer,
  companyProfile,
  onAddCustomer,
  onUpdateCustomer,
  onCancelEdit,
  onDeleteCustomer,
  onSetEditingCustomer,
  onMarkAsPaid,
  onResetAllPayments
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 space-y-8">
        <CustomerForm 
          onAddCustomer={onAddCustomer} 
          editingCustomer={editingCustomer}
          onUpdateCustomer={onUpdateCustomer}
          onCancelEdit={onCancelEdit}
        />
      </div>
      <div className="lg:col-span-2 space-y-8">
        <CustomerList 
          customers={customers}
          companyProfile={companyProfile}
          onDeleteCustomer={onDeleteCustomer}
          onSetEditingCustomer={onSetEditingCustomer}
          onMarkAsPaid={onMarkAsPaid}
          onResetAllPayments={onResetAllPayments}
        />
      </div>
    </div>
  );
};

export default CustomerPage;