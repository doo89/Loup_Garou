import React, { useMemo, useCallback } from 'react';
import { ROLES_DATA } from '../data/roles';
import { Role } from '../types';
import { Minus, Plus, Check, Shield, Sword, Eye, Moon, Drama, Info, Trash2 } from 'lucide-react';

interface RoleSelectionProps {
  totalPlayers: number;
  selectedRoles: Record<string, number>;
  comedianExtras: string[];
  onUpdateRole: (roleId: string, delta: number) => void;
  onUpdateComedianExtras: (roleId: string, action: 'add' | 'remove') => void;
  onConfirm: () => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({
  totalPlayers,
  selectedRoles,
  comedianExtras,
  onUpdateRole,
  onUpdateComedianExtras,
  onConfirm
}) => {

  // --- CALCULATIONS ---

  // Calculate current occupancy (some roles count as 2 or 3 players)
  const currentCount = useMemo(() => {
    return Object.entries(selectedRoles).reduce((acc: number, [id, qty]) => {
      const role = ROLES_DATA.find(r => r.id === id);
      return acc + (Number(qty) * (role?.countValue || 1));
    }, 0);
  }, [selectedRoles]);

  const remainingSlots = totalPlayers - currentCount;
  const isComedianSelected = (selectedRoles['comedian'] || 0) > 0;
  const areComedianExtrasValid = !isComedianSelected || comedianExtras.length === 3;
  const isValid = remainingSlots === 0 && areComedianExtrasValid;

  // --- HANDLERS ---

  const handleFillVillagers = useCallback(() => {
    if (remainingSlots <= 0) return;
    onUpdateRole('simple-villager', remainingSlots);
  }, [remainingSlots, onUpdateRole]);

  // --- RENDER HELPERS ---

  const renderIcon = (role: Role) => {
    switch (role.category) {
      case 'WEREWOLF': return <Moon size={20} className="text-red-400 shrink-0" />;
      case 'VILLAGER': return role.id === 'simple-villager' ? <Shield size={20} className="text-blue-300 shrink-0" /> : <Eye size={20} className="text-blue-400 shrink-0" />;
      case 'LONER': return <Sword size={20} className="text-purple-400 shrink-0" />;
      case 'AMBIGUOUS': return <Drama size={20} className="text-yellow-500 shrink-0" />;
      default: return <Info size={20} className="shrink-0" />;
    }
  };

  const renderRoleRow = (role: Role, isExtraSelection = false) => {
    const quantity = isExtraSelection 
      ? (comedianExtras.includes(role.id) ? 1 : 0)
      : (selectedRoles[role.id] || 0);
      
    const isSelected = quantity > 0;
    const isMaxed = role.maxQuantity !== -1 && quantity >= role.maxQuantity;

    // Logic for Comedian Extra Selection
    if (isExtraSelection) {
      return (
        <button
          key={`extra-${role.id}`}
          onClick={() => onUpdateComedianExtras(role.id, isSelected ? 'remove' : 'add')}
          disabled={!isSelected && comedianExtras.length >= 3}
          className={`flex flex-col text-left p-3 rounded-lg border transition-all h-full ${
            isSelected 
              ? 'bg-werewolf-700/30 border-werewolf-600 text-zinc-100' 
              : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-600'
          } ${(!isSelected && comedianExtras.length >= 3) ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center justify-between w-full mb-1">
             <div className="flex items-center gap-2">
                {renderIcon(role)}
                <span className="font-serif font-bold text-sm">{role.name}</span>
             </div>
             {isSelected && <Check size={16} className="text-werewolf-accent shrink-0" />}
          </div>
          <p className="text-xs opacity-70 leading-normal">{role.description}</p>
        </button>
      );
    }

    // Logic for Main Selection
    return (
      <div 
        key={role.id} 
        className={`flex items-start justify-between p-3 rounded-lg border transition-all duration-200 ${
          isSelected 
            ? 'bg-zinc-900/80 border-zinc-700 shadow-[0_0_10px_rgba(0,0,0,0.3)]' 
            : 'bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700'
        }`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-md mt-0.5 ${isSelected ? 'bg-zinc-800' : 'bg-zinc-900'}`}>
            {renderIcon(role)}
          </div>
          <div className="flex flex-col min-w-0 pr-2">
            <span className={`font-serif font-bold text-base ${isSelected ? 'text-zinc-200' : 'text-zinc-500'}`}>
              {role.name}
            </span>
            {/* Description area: Allow wrapping, whitespace-normal ensuring full text is visible */}
            <p className="text-xs text-zinc-500 leading-relaxed mt-1 whitespace-normal text-pretty">
              {role.description}
            </p>
            {role.countValue > 1 && (
               <span className="text-xs text-werewolf-accent flex items-center gap-1 mt-1 sm:hidden font-bold">
                 <UsersIcon size={12} /> Compte pour {role.countValue} joueurs
               </span>
            )}
            {role.expansion !== 'Base' && (
              <span className="text-[10px] text-zinc-700 uppercase tracking-wider mt-2">{role.expansion}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-2 self-start mt-1">
          {role.countValue > 1 && (
             <span className="text-xs text-werewolf-accent hidden sm:block whitespace-nowrap bg-werewolf-900/50 px-2 py-1 rounded border border-werewolf-800/30">
               {role.countValue} Joueurs
             </span>
          )}

          {role.maxQuantity === 1 ? (
            // Checkbox Style for Unique Roles
            <button
              onClick={() => onUpdateRole(role.id, isSelected ? -1 : 1)}
              className={`w-10 h-10 rounded flex items-center justify-center border transition-all shrink-0 ${
                isSelected 
                  ? 'bg-werewolf-700 border-werewolf-600 text-white' 
                  : 'bg-zinc-950 border-zinc-700 hover:border-zinc-500 text-transparent'
              }`}
            >
              <Check size={20} />
            </button>
          ) : (
            // Counter Style for Multiple Roles
            <div className="flex items-center gap-1 bg-zinc-950 rounded-lg p-1 border border-zinc-800 shrink-0">
              <button 
                onClick={() => onUpdateRole(role.id, -1)}
                disabled={quantity === 0}
                className="w-8 h-8 flex items-center justify-center rounded bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className={`w-8 text-center font-mono font-bold ${quantity > 0 ? 'text-zinc-100' : 'text-zinc-600'}`}>
                {quantity}
              </span>
              <button 
                onClick={() => onUpdateRole(role.id, 1)}
                className="w-8 h-8 flex items-center justify-center rounded bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Group roles for display
  const categorizedRoles = useMemo(() => {
    return {
      villagers: ROLES_DATA.filter(r => r.id === 'simple-villager'),
      wolves: ROLES_DATA.filter(r => r.category === 'WEREWOLF'),
      special: ROLES_DATA.filter(r => r.category !== 'WEREWOLF' && r.id !== 'simple-villager' && r.category !== 'LONER' && r.category !== 'AMBIGUOUS'),
      loner: ROLES_DATA.filter(r => r.category === 'LONER'),
      ambiguous: ROLES_DATA.filter(r => r.category === 'AMBIGUOUS')
    };
  }, []);

  return (
    <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
      
      {/* --- STATS BAR --- */}
      <div className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md pb-4 pt-2 border-b border-zinc-800/50 mb-6">
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-lg">
          <div className="flex flex-col">
            <span className="text-zinc-500 text-xs font-serif uppercase tracking-widest">Répartition</span>
            <div className={`text-2xl font-serif font-black ${remainingSlots === 0 ? 'text-green-500' : remainingSlots < 0 ? 'text-red-500' : 'text-zinc-100'}`}>
              {currentCount} <span className="text-zinc-600 text-lg font-normal">/ {totalPlayers}</span>
            </div>
          </div>
          
          {remainingSlots > 0 && (
            <button 
              onClick={handleFillVillagers}
              className="px-3 py-2 bg-blue-900/30 text-blue-300 border border-blue-800/50 rounded hover:bg-blue-900/50 hover:border-blue-700 transition-all text-xs sm:text-sm font-serif flex items-center gap-2"
            >
              <Shield size={14} />
              <span className="hidden sm:inline">Compléter Villageois</span>
              <span className="sm:hidden">Compléter</span>
            </button>
          )}

          {remainingSlots < 0 && (
             <div className="flex items-center gap-2 text-red-400 text-sm font-bold bg-red-900/20 px-3 py-1 rounded border border-red-900/50">
               <Info size={16} />
               <span>Trop de rôles !</span>
             </div>
          )}
        </div>
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto space-y-8 pb-32 pr-1">
        
        {/* Villagers Section (Moved to Top) */}
        <section>
          <h3 className="text-blue-400 font-serif font-bold text-lg mb-3 flex items-center gap-2 sticky top-0 bg-zinc-950/90 py-2 z-10 backdrop-blur">
            <Shield size={18} /> Le Village
          </h3>
          <div className="space-y-2">
            {categorizedRoles.villagers.map(r => renderRoleRow(r))}
          </div>
        </section>

        {/* Wolves Section */}
        <section>
          <h3 className="text-red-500 font-serif font-bold text-lg mb-3 flex items-center gap-2 sticky top-0 bg-zinc-950/90 py-2 z-10 backdrop-blur">
            <Moon size={18} /> Les Loups-Garous
          </h3>
          <div className="space-y-2">
            {categorizedRoles.wolves.map(r => renderRoleRow(r))}
          </div>
        </section>

        {/* Special Roles Section */}
        <section>
          <h3 className="text-blue-300 font-serif font-bold text-lg mb-3 flex items-center gap-2 sticky top-0 bg-zinc-950/90 py-2 z-10 backdrop-blur">
            <Eye size={18} /> Villageois Spéciaux
          </h3>
          <div className="space-y-2">
            {categorizedRoles.special.map(r => renderRoleRow(r))}
          </div>
        </section>

        {/* Ambiguous Roles */}
        <section>
          <h3 className="text-yellow-500 font-serif font-bold text-lg mb-3 flex items-center gap-2 sticky top-0 bg-zinc-950/90 py-2 z-10 backdrop-blur">
            <Drama size={18} /> Rôles Ambigus
          </h3>
          <div className="space-y-2">
            {categorizedRoles.ambiguous.map(r => renderRoleRow(r))}
          </div>
        </section>

        {/* Loner Roles */}
        <section>
          <h3 className="text-purple-400 font-serif font-bold text-lg mb-3 flex items-center gap-2 sticky top-0 bg-zinc-950/90 py-2 z-10 backdrop-blur">
            <Sword size={18} /> Solitaires & Autres
          </h3>
          <div className="space-y-2">
            {categorizedRoles.loner.map(r => renderRoleRow(r))}
          </div>
        </section>

        {/* Comedian Logic - Only Visible if Comedian Selected */}
        {isComedianSelected && (
          <section className="bg-zinc-900/50 border border-werewolf-800/50 rounded-xl p-4 animate-in slide-in-from-top-4">
             <div className="flex items-center gap-2 mb-4 text-werewolf-accent">
                <Drama className="animate-pulse" />
                <h3 className="font-serif font-bold">Le Comédien : Choisissez 3 rôles</h3>
             </div>
             <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
               Ces rôles seront mélangés face cachée. Le comédien pourra en utiliser un à chaque tour. Ils ne comptent pas dans le total des joueurs.
             </p>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {/* Exclude already selected roles and Comedian itself from options */}
                {ROLES_DATA
                  .filter(r => r.id !== 'comedian' && r.id !== 'simple-villager' && !selectedRoles[r.id])
                  .map(r => renderRoleRow(r, true))
                }
             </div>
             <div className="mt-3 text-right text-xs font-mono">
                {comedianExtras.length} / 3 sélectionnés
             </div>
          </section>
        )}

      </div>

      {/* --- FOOTER ACTION --- */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-50">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onConfirm}
            disabled={!isValid}
            className={`w-full py-4 px-6 rounded-lg font-serif font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${
              !isValid
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : 'bg-werewolf-700 hover:bg-werewolf-600 text-white shadow-werewolf-900/50 hover:shadow-werewolf-700/30 hover:-translate-y-1 border border-werewolf-600'
            }`}
          >
             <span>Passer à la distribution</span>
             <Check size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Icon for countValue > 1
const UsersIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export default RoleSelection;