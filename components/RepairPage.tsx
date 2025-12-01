import React from 'react';
import { RepairTicket } from '../types';
import RepairForm from './RepairForm';
import RepairList from './RepairList';

interface RepairPageProps {
  repairTickets: RepairTicket[];
  editingRepairTicket: RepairTicket | null;
  onAddRepairTicket: (ticketData: Omit<RepairTicket, 'id' | 'receivedDate' | 'status' | 'completedDate'>) => void;
  onUpdateRepairTicket: (updatedTicket: RepairTicket) => void;
  onCancelEdit: () => void;
  onDeleteRepairTicket: (id: string) => void;
  onSetEditingRepairTicket: (ticket: RepairTicket) => void;
}

const RepairPage: React.FC<RepairPageProps> = ({
    repairTickets,
    editingRepairTicket,
    onAddRepairTicket,
    onUpdateRepairTicket,
    onCancelEdit,
    onDeleteRepairTicket,
    onSetEditingRepairTicket
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 space-y-8">
        <RepairForm 
          onAddRepairTicket={onAddRepairTicket} 
          editingRepairTicket={editingRepairTicket}
          onUpdateRepairTicket={onUpdateRepairTicket}
          onCancelEdit={onCancelEdit}
        />
      </div>
      <div className="lg:col-span-2 space-y-8">
        <RepairList 
          repairTickets={repairTickets} 
          onDeleteRepairTicket={onDeleteRepairTicket}
          onSetEditingRepairTicket={onSetEditingRepairTicket}
          onUpdateRepairTicket={onUpdateRepairTicket} // For status updates
        />
      </div>
    </div>
  );
};

export default RepairPage;
