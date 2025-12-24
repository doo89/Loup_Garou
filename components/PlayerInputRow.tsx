import React, { memo } from 'react';
import { Trash2, User } from 'lucide-react';
import { Player } from '../types';

interface PlayerInputRowProps {
  index: number;
  player: Player;
  onUpdateName: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
}

const PlayerInputRow: React.FC<PlayerInputRowProps> = memo(({ index, player, onUpdateName, onDelete }) => {
  // Generate the display index (e.g., "J1", "J10")
  const displayIndex = `J${index + 1}`;

  return (
    <div className="group relative flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Decorative Connector Line (Visual Polish) */}
      <div className="absolute -left-3 top-1/2 w-3 h-[1px] bg-werewolf-800 hidden sm:block opacity-50"></div>

      <div className="flex-1 relative flex items-center bg-zinc-900/50 border border-zinc-800 rounded-md transition-all duration-200 group-hover:border-werewolf-700/50 group-focus-within:border-werewolf-600 group-focus-within:bg-zinc-900 group-focus-within:shadow-[0_0_15px_rgba(138,28,28,0.1)]">
        
        {/* The "J{n}" Prefix - Styled as a badge inside the input area */}
        <div className="pl-3 pr-2 py-3 flex items-center select-none">
          <span className="text-xs font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-zinc-700 font-serif min-w-[2.5rem] text-center group-focus-within:text-werewolf-accent group-focus-within:border-werewolf-800 transition-colors">
            {displayIndex}
          </span>
        </div>

        {/* The Actual Input */}
        <input
          type="text"
          value={player.name}
          onChange={(e) => onUpdateName(player.id, e.target.value)}
          placeholder={`Nom du joueur ${index + 1}`}
          className="flex-1 bg-transparent border-none outline-none text-zinc-200 placeholder-zinc-600 py-3 pr-4 font-sans text-base focus:ring-0"
          autoComplete="off"
        />

        {/* Mobile-only divider */}
        <div className="w-[1px] h-6 bg-zinc-800 mx-1 sm:hidden"></div>
      </div>

      {/* Delete Action */}
      <button
        onClick={() => onDelete(player.id)}
        className="p-3 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all duration-200 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-900/50"
        title={`Supprimer ${player.name}`}
        aria-label={`Supprimer le joueur ${player.name}`}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
});

export default PlayerInputRow;