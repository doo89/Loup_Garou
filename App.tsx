import React, { useState, useCallback, useRef } from 'react';
import { Plus, Users, ArrowRight, Skull, Moon, ArrowLeft } from 'lucide-react';
import { Player, GameState } from './types';
import PlayerInputRow from './components/PlayerInputRow';
import RoleSelection from './components/RoleSelection';
import GameManager from './components/GameManager';

// Helper to generate unique IDs
const generateId = () => `p_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const App: React.FC = () => {
  // --- STATE ---
  const [currentPhase, setCurrentPhase] = useState<GameState['currentPhase']>('PLAYERS');
  const [gameId, setGameId] = useState(0); // Used to force remount of GameManager
  
  const [players, setPlayers] = useState<Player[]>(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: generateId() + i, 
      name: `Joueur ${i + 1}`
    }));
  });

  const [selectedRoles, setSelectedRoles] = useState<Record<string, number>>({
    'simple-werewolf': 2,
    'seer': 1,
    'simple-villager': 0 // Will be calculated by user or auto-fill
  });

  const [comedianExtras, setComedianExtras] = useState<string[]>([]);

  const scrollBottomRef = useRef<HTMLDivElement>(null);

  // --- HANDLERS (PHASE 1) ---

  const handleAddPlayer = useCallback(() => {
    setPlayers((prev) => [
      ...prev,
      {
        id: generateId(),
        name: `Joueur ${prev.length + 1}`
      }
    ]);
    setTimeout(() => {
      scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const handleUpdateName = useCallback((id: string, newName: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
  }, []);

  const handleDeletePlayer = useCallback((id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleNextPhase = useCallback(() => {
    setCurrentPhase('ROLES');
  }, []);

  // --- HANDLERS (PHASE 2) ---

  const handleUpdateRole = useCallback((roleId: string, delta: number) => {
    setSelectedRoles(prev => {
      const current = prev[roleId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [roleId]: next };
    });
  }, []);

  const handleUpdateComedianExtras = useCallback((roleId: string, action: 'add' | 'remove') => {
    setComedianExtras(prev => {
      if (action === 'add') {
        if (prev.length >= 3) return prev;
        return [...prev, roleId];
      } else {
        return prev.filter(id => id !== roleId);
      }
    });
  }, []);

  const handleStartGame = useCallback(() => {
     setGameId(prev => prev + 1); // Force new instance
     setCurrentPhase('GAME');
  }, []);

  // --- HANDLERS (GAME END / REPLAY) ---

  // Recommencer avec les mêmes joueurs et rôles (Juste une nouvelle distribution)
  const handleRestartGame = useCallback(() => {
    setGameId(prev => prev + 1); // Force remount
    setCurrentPhase('ROLES'); 
    setTimeout(() => setCurrentPhase('GAME'), 0);
  }, []);

  // Nouvelle partie (Retour au lobby, mais garde les rôles pré-configurés)
  const handleNewGame = useCallback(() => {
    setGameId(prev => prev + 1);
    setCurrentPhase('PLAYERS');
  }, []);

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center py-6 px-4 sm:px-6">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-werewolf-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10 flex flex-col h-full">
        
        {/* Header - Only show in setup phases to save space during game */}
        {currentPhase !== 'GAME' && (
          <header className="text-center mb-8 space-y-2 relative">
            {currentPhase === 'ROLES' && (
              <button 
                onClick={() => setCurrentPhase('PLAYERS')}
                className="absolute left-0 top-2 p-2 text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="flex justify-center mb-4">
               <div className="p-3 bg-zinc-900 rounded-full border border-zinc-800 shadow-2xl shadow-werewolf-900/50">
                  <Moon className="text-werewolf-600 fill-werewolf-900" size={32} />
               </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-br from-zinc-100 to-zinc-500 tracking-tight">
              Le Village Maudit
            </h1>
            <p className="text-werewolf-600 font-serif italic text-lg flex items-center justify-center gap-2">
              <span className="h-[1px] w-8 bg-werewolf-800/50"></span>
              {currentPhase === 'PLAYERS' ? 'Gestion des Joueurs' : 'Sélection des Rôles'}
              <span className="h-[1px] w-8 bg-werewolf-800/50"></span>
            </p>
          </header>
        )}

        {/* Phase 1: Player Management */}
        {currentPhase === 'PLAYERS' && (
          <>
            {/* Stats Bar */}
            <div className="flex justify-between items-center mb-6 px-4 py-3 bg-zinc-900/30 border border-zinc-800/50 rounded-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Users size={18} />
                    <span className="font-serif text-sm">Joueurs vivants</span>
                </div>
                <span className="text-xl font-serif font-bold text-white">{players.length}</span>
            </div>

            {/* Players List */}
            <div className="flex-1 space-y-3 mb-24">
              {players.map((player, index) => (
                <PlayerInputRow
                  key={player.id}
                  index={index}
                  player={player}
                  onUpdateName={handleUpdateName}
                  onDelete={handleDeletePlayer}
                />
              ))}

              <div className="pt-4 pb-2" ref={scrollBottomRef}>
                <button
                  onClick={handleAddPlayer}
                  className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900/50 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  <div className="p-1 rounded-full bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
                    <Plus size={20} />
                  </div>
                  <span className="font-serif font-semibold">Ajouter un villageois</span>
                </button>
              </div>
            </div>

            {/* Phase 1 Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-50">
              <div className="max-w-2xl mx-auto flex items-center gap-4">
                <button
                    onClick={handleNextPhase}
                    disabled={players.length < 5}
                    className={`flex-1 py-4 px-6 rounded-lg font-serif font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${
                        players.length < 5 
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-werewolf-700 hover:bg-werewolf-600 text-white shadow-werewolf-900/50 hover:shadow-werewolf-700/30 hover:-translate-y-1'
                    }`}
                >
                    {players.length < 5 ? (
                        <>
                            <Skull size={20} />
                            <span>Min. 5 joueurs requis</span>
                        </>
                    ) : (
                        <>
                            <span>Choisir les Rôles</span>
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Phase 2: Role Selection */}
        {currentPhase === 'ROLES' && (
          <RoleSelection 
            totalPlayers={players.length}
            selectedRoles={selectedRoles}
            comedianExtras={comedianExtras}
            onUpdateRole={handleUpdateRole}
            onUpdateComedianExtras={handleUpdateComedianExtras}
            onConfirm={handleStartGame}
          />
        )}

        {/* Phase 3: Game Manager */}
        {currentPhase === 'GAME' && (
          <GameManager 
            key={gameId} // Critical: Forces full reset on new game
            players={players}
            selectedRoles={selectedRoles}
            comedianExtras={comedianExtras}
            onRestart={handleRestartGame}
            onNewGame={handleNewGame}
          />
        )}

      </div>
    </div>
  );
};

export default App;