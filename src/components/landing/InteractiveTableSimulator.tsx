import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  Utensils, 
  CheckCircle2, 
  BellRing, 
  Receipt, 
  QrCode, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  ChefHat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card3D } from './Card3D';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface TableState {
  id: number;
  label: string;
  capacity: number;
  status: 'available' | 'ordering' | 'cooking' | 'served' | 'bill';
  activeItems: string[];
  total: number;
  timeActive: string;
}

const initialTables: TableState[] = [
  {
    id: 1,
    label: 'Table 01',
    capacity: 2,
    status: 'cooking',
    activeItems: ['Ghee Roast Masala Dosa', 'Filter Coffee'],
    total: 165,
    timeActive: '4m ago',
  },
  {
    id: 2,
    label: 'Table 02',
    capacity: 4,
    status: 'ordering',
    activeItems: ['Maddur Vada', 'Rava Idli'],
    total: 120,
    timeActive: '1m ago',
  },
  {
    id: 3,
    label: 'Table 03',
    capacity: 6,
    status: 'served',
    activeItems: ['South Indian Thali x3', 'Mango Lassi x2'],
    total: 820,
    timeActive: '18m ago',
  },
  {
    id: 4,
    label: 'Table 04',
    capacity: 2,
    status: 'bill',
    activeItems: ['Bisi Bele Bath', 'Gulab Jamun (2 pcs)'],
    total: 240,
    timeActive: '32m ago',
  },
  {
    id: 5,
    label: 'Table 05',
    capacity: 4,
    status: 'available',
    activeItems: [],
    total: 0,
    timeActive: 'Clean & Ready',
  },
  {
    id: 6,
    label: 'Table 06',
    capacity: 4,
    status: 'cooking',
    activeItems: ['Mysore Masala Dosa', 'Pineapple Kesari Bath'],
    total: 215,
    timeActive: '7m ago',
  },
];

export const InteractiveTableSimulator: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableState[]>(initialTables);
  const [selectedTableId, setSelectedTableId] = useState<number>(1);
  const [lastActionMessage, setLastActionMessage] = useState<string>(
    'Simulator Active: Click any table to inspect live status or simulate actions.'
  );

  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[0];

  const updateTableStatus = (id: number, newStatus: TableState['status'], message: string) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            status: newStatus,
            total: newStatus === 'available' ? 0 : t.total || 180,
            activeItems:
              newStatus === 'available'
                ? []
                : t.activeItems.length === 0
                ? ['Butter Masala Dosa', 'Filter Coffee']
                : t.activeItems,
          };
        }
        return t;
      })
    );
    setLastActionMessage(message);
  };

  const getStatusBadge = (status: TableState['status']) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EAE6DE] text-[#63574A] border border-[#D9D1C5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E7E70]" />
            Available
          </span>
        );
      case 'ordering':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Guest Ordering
          </span>
        );
      case 'cooking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50 text-[#B85D36] border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B85D36] animate-ping" />
            In Kitchen
          </span>
        );
      case 'served':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Food Served
          </span>
        );
      case 'bill':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
            Bill Requested
          </span>
        );
    }
  };

  return (
    <section id="simulator" className="py-24 bg-[#F5EFE6] border-y border-[#E9DFD3] relative overflow-hidden">
      {/* Soft warm ambient lighting */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-[#E9D9C3]/45 rounded-full blur-3xl -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8DDD1] text-[#69503B] text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#B85D36]" />
            <span>Interactive 3D Experience</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#29221C] font-serif">
            {language === 'kn' ? 'ಲೈವ್ ರೆಸ್ಟೋರೆಂಟ್ ಫ್ಲೋರ್ ಸಿಮ್ಯುಲೇಟರ್' : 'Live Floor Plan & Table Intelligence'}
          </h2>
          <p className="text-sm sm:text-base text-[#685D52] leading-relaxed">
            {language === 'kn'
              ? 'ಕೆಳಗಿನ ಯಾವುದೇ ಟೇಬಲ್ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ. ಗ್ರಾಹಕರ ಆದೇಶ, ಅಡುಗೆಮನೆಯ ಸ್ಥಿತಿ, ಮತ್ತು ಬಿಲ್ಲಿಂಗ್ ಬದಲಾವಣೆಗಳನ್ನು ಲೈವ್ ಆಗಿ ವೀಕ್ಷಿಸಿ.'
              : 'Interact with any table below. Experience real-time QR seat scanning, kitchen status updates, and digital waiter calls as they happen.'}
          </p>
        </div>

        {/* Simulator Grid & Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 3D Floor Layout (Left 7 Cols) */}
          <div className="lg:col-span-7 bg-[#FAF7F2] p-6 sm:p-8 rounded-3xl border border-[#E3D7C9] shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EADFCF]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#4A3E33]">
                  Dining Hall Floor A
                </span>
                <span className="text-xs text-[#8A7C6E]">• 6 Active Tables</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#7A6C5D]">
                <button
                  onClick={() => setTables(initialTables)}
                  className="flex items-center gap-1 hover:text-[#B85D36] transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Tables</span>
                </button>
              </div>
            </div>

            {/* 6 Tables Isometric / 3D Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {tables.map((table) => {
                const isSelected = table.id === selectedTableId;
                return (
                  <div
                    key={table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    className="cursor-pointer"
                  >
                    <Card3D intensity={isSelected ? 10 : 6} depth={isSelected ? 16 : 8}>
                      <div
                        className={`rounded-2xl p-4 sm:p-5 transition-all text-left flex flex-col justify-between h-[170px] relative ${
                          isSelected
                            ? 'bg-[#FFFFFF] border-2 border-[#B85D36] shadow-md ring-4 ring-[#B85D36]/10'
                            : 'bg-[#F9F5EE] hover:bg-white border border-[#E4D8CA] hover:border-[#D5C4B2] shadow-2xs'
                        }`}
                      >
                        {/* Table Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-bold text-[#2A211A] block">
                              {table.label}
                            </span>
                            <span className="text-[11px] text-[#7A6E63] flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3 text-[#9A8978]" />
                              {table.capacity} Seats
                            </span>
                          </div>
                          
                          {/* Mini QR badge */}
                          <div className="w-7 h-7 rounded-lg bg-[#F0E6D8] flex items-center justify-center text-[#5C4A3A]">
                            <QrCode className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Status Chip */}
                        <div className="my-auto">
                          {getStatusBadge(table.status)}
                        </div>

                        {/* Bottom Total / Items */}
                        <div className="pt-2 border-t border-[#EFE5D8] flex items-center justify-between text-xs">
                          <span className="text-[11px] text-[#7C6E60]">
                            {table.status === 'available' ? 'Ready' : `${table.activeItems.length} items`}
                          </span>
                          <span className="font-bold text-[#2E241D]">
                            {table.total > 0 ? `₹${table.total}` : '—'}
                          </span>
                        </div>
                      </div>
                    </Card3D>
                  </div>
                );
              })}
            </div>

            {/* Live Event Ticker */}
            <div className="p-3.5 rounded-xl bg-[#EFE7DC] border border-[#DFD1C1] flex items-center gap-2.5 text-xs text-[#524436]">
              <span className="flex h-2 w-2 rounded-full bg-[#B85D36] animate-pulse shrink-0" />
              <span className="font-semibold text-[#2D231A]">Live Feed:</span>
              <span className="truncate">{lastActionMessage}</span>
            </div>
          </div>

          {/* Table Control & Action Center (Right 5 Cols) */}
          <div className="lg:col-span-5 bg-[#FAF7F2] p-6 sm:p-7 rounded-3xl border border-[#E3D7C9] shadow-sm space-y-6">
            
            {/* Header of selected table */}
            <div className="flex items-center justify-between pb-4 border-b border-[#EADFCF]">
              <div>
                <h3 className="text-xl font-bold text-[#282019] font-serif flex items-center gap-2">
                  <span>{selectedTable.label} Control Panel</span>
                </h3>
                <p className="text-xs text-[#7A6D5F] mt-0.5">
                  Capacity: {selectedTable.capacity} Guests • Active: {selectedTable.timeActive}
                </p>
              </div>
              <div>{getStatusBadge(selectedTable.status)}</div>
            </div>

            {/* Current Table Items */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#54473A] block">
                Ordered Dishes & Items:
              </span>

              {selectedTable.activeItems.length > 0 ? (
                <div className="space-y-2">
                  {selectedTable.activeItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EAE0D3] text-xs"
                    >
                      <span className="font-medium text-[#2C231B]">{item}</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                        Confirmed
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 flex justify-between items-center text-sm font-bold text-[#2A211A]">
                    <span>Current Bill Total:</span>
                    <span className="text-[#B85D36] text-base">₹{selectedTable.total}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white border border-dashed border-[#DACBB9] text-center text-xs text-[#8A7969]">
                  No active orders on this table yet. Table is ready for new diners.
                </div>
              )}
            </div>

            {/* Simulator Action Triggers */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#54473A] block">
                Simulate Workflow Actions:
              </span>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateTableStatus(
                      selectedTable.id,
                      'ordering',
                      `Simulated: Guests seated at ${selectedTable.label} and started browsing the digital menu.`
                    )
                  }
                  className="text-xs justify-start border-[#D9CABE] bg-white hover:bg-[#F2ECE3] text-[#473B2F] h-9"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1.5 text-[#B85D36]" />
                  1. Scan Table QR
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateTableStatus(
                      selectedTable.id,
                      'cooking',
                      `Simulated: Order placed on ${selectedTable.label}! Kitchen chime rang, chef received ticket.`
                    )
                  }
                  className="text-xs justify-start border-[#D9CABE] bg-white hover:bg-[#F2ECE3] text-[#473B2F] h-9"
                >
                  <ChefHat className="w-3.5 h-3.5 mr-1.5 text-[#B85D36]" />
                  2. Send to Kitchen
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateTableStatus(
                      selectedTable.id,
                      'served',
                      `Simulated: Chef marked food ready! Waiter served hot dishes to ${selectedTable.label}.`
                    )
                  }
                  className="text-xs justify-start border-[#D9CABE] bg-white hover:bg-[#F2ECE3] text-[#473B2F] h-9"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                  3. Food Served
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateTableStatus(
                      selectedTable.id,
                      'bill',
                      `Simulated: Diners on ${selectedTable.label} tapped "Request Bill". Waiter notified on handheld.`
                    )
                  }
                  className="text-xs justify-start border-[#D9CABE] bg-white hover:bg-[#F2ECE3] text-[#473B2F] h-9"
                >
                  <Receipt className="w-3.5 h-3.5 mr-1.5 text-blue-700" />
                  4. Request Bill
                </Button>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  updateTableStatus(
                    selectedTable.id,
                    'available',
                    `Simulated: Bill settled for ${selectedTable.label}. Table cleaned and marked available.`
                  )
                }
                className="w-full text-xs text-[#7B6E60] hover:text-[#282019] hover:bg-[#EFE8DF] h-8 mt-1"
              >
                Clear & Reset Table to Available
              </Button>
            </div>

            {/* Table QR Enforcement Notice */}
            <div className="pt-4 border-t border-[#E8DDCF]">
              <div className="p-3 rounded-xl bg-[#FAF6F0] border border-[#E5DACD] text-center space-y-1">
                <span className="text-[11px] font-semibold text-[#6E5D4E] flex items-center justify-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-[#B85D36]" />
                  <span>Physical Table QR Disc Required for Ordering</span>
                </span>
                <p className="text-[10px] text-[#8C7A6B]">
                  Diners can only place orders when seated at a physical table by scanning the QR disc with their phone camera.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
