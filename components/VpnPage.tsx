import React from 'react';
import { VpnAccount, Customer } from '../types';
import VpnAccountForm from './VpnAccountForm';
import VpnAccountList from './VpnAccountList';

interface VpnPageProps {
  vpnAccounts: VpnAccount[];
  customers: Customer[];
  editingVpnAccount: VpnAccount | null;
  onAddVpnAccount: (accountData: Omit<VpnAccount, 'id' | 'creationDate'>) => void;
  onUpdateVpnAccount: (updatedAccountData: VpnAccount) => void;
  onCancelEdit: () => void;
  onDeleteVpnAccount: (id: string) => void;
  onSetEditingVpnAccount: (account: VpnAccount) => void;
}

const VpnPage: React.FC<VpnPageProps> = (props) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 space-y-8">
        <VpnAccountForm
          customers={props.customers}
          onAddVpnAccount={props.onAddVpnAccount}
          editingVpnAccount={props.editingVpnAccount}
          onUpdateVpnAccount={props.onUpdateVpnAccount}
          onCancelEdit={props.onCancelEdit}
        />
      </div>
      <div className="lg:col-span-2 space-y-8">
        <VpnAccountList
          vpnAccounts={props.vpnAccounts}
          customers={props.customers}
          onDeleteVpnAccount={props.onDeleteVpnAccount}
          onSetEditingVpnAccount={props.onSetEditingVpnAccount}
        />
      </div>
    </div>
  );
};

export default VpnPage;
