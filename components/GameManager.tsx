import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Player, AssignedPlayer, GameEvent, GameLog, VictoryType } from '../types';
import { ROLES_DATA } from '../data/roles';
import { 
  Skull, Moon, Sun, Eye, 
  ArrowRight, RefreshCw, CheckCircle, Heart, HeartCrack, 
  Gavel, Trophy, Crosshair, User, FlaskConical, AlertTriangle, Users, Crown, AlertOctagon, History, Dog, PawPrint, Search, Ban, X, Shield, Scale, Syringe, Flame, EyeOff
} from 'lucide-react';

interface GameManagerProps {
  players: Player[];
  selectedRoles: Record<string, number>;
  comedianExtras: string[];
  onRestart: () => void;
  onNewGame: () => void;
}

type Phase = 'DISTRIBUTION' | 'NIGHT' | 'MORNING' | 'DAY_VOTE' | 'HUNTER_ACTION' | 'SCAPEGOAT_BAN' | 'VICTORY';

const LOVERS_RECOGNITION_ID = 'lovers_recognition';
const INFECT_ACTION_ID = 'infect_action'; // Virtual ID for Infection Phase

const GameManager: React.FC<GameManagerProps> = ({ players, selectedRoles, comedianExtras, onRestart, onNewGame }) => {
  
  // --- STATE ---
  const [gamePlayers, setGamePlayers] = useState<AssignedPlayer[]>([]);
  const [phase, setPhase] = useState<Phase>('DISTRIBUTION');
  const [turnCount, setTurnCount] = useState(1);
  const [logs, setLogs] = useState<GameLog[]>([]);
  
  // Victory States
  const [winner, setWinner] = useState<{ type: VictoryType, label: string, survivors: AssignedPlayer[] } | null>(null);
  const [suggestedWinner, setSuggestedWinner] = useState<{ type: VictoryType, label: string, survivors: AssignedPlayer[] } | null>(null);
  
  // Night Logic State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [nightEvents, setNightEvents] = useState<GameEvent[]>([]);
  const [comedianCurrentRole, setComedianCurrentRole] = useState<string | null>(null);
  
  // Role Specific States
  const [seerReveal, setSeerReveal] = useState<{ name: string, roleName: string, isTransformed?: boolean } | null>(null);
  
  // Witch: Flexible Inventory
  const [witchInventory, setWitchInventory] = useState<{ hasLife: boolean, hasDeath: boolean }>({ hasLife: true, hasDeath: true });
  const [witchUseCount, setWitchUseCount] = useState<{ life: number, death: number }>({ life: 0, death: 0 });

  const [ravenTargetId, setRavenTargetId] = useState<string | null>(null);
  const [foxResult, setFoxResult] = useState<'FOUND' | 'NOT_FOUND' | null>(null);
  const [lastProtectedId, setLastProtectedId] = useState<string | null>(null); // For Salvager
  const [showBearModal, setShowBearModal] = useState(false); // For Bear Tamer
  
  // New Role States
  const [elderLives, setElderLives] = useState(2);
  const [infectPowerUsed, setInfectPowerUsed] = useState(false);
  const [isLittleGirlSurprised, setIsLittleGirlSurprised] = useState(false);
  const [rustySwordTarget, setRustySwordTarget] = useState<{ id: string, killTurn: number } | null>(null);

  // Temporary Action States
  const [currentTargets, setCurrentTargets] = useState<string[]>([]);
  const [specialAction, setSpecialAction] = useState<string | null>(null);

  // Vote State
  const [voteCandidateId, setVoteCandidateId] = useState<string | null>(null);

  // Flow Control & Mayor
  const pendingNextPhase = useRef<Phase>('DAY_VOTE'); 
  const [deathQueue, setDeathQueue] = useState<string[]>([]);
  const [mayorDeathPending, setMayorDeathPending] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // --- THEME MANAGEMENT ---
  useEffect(() => {
    const root = document.documentElement;
    if (phase === 'NIGHT' || phase === 'DISTRIBUTION' || phase === 'HUNTER_ACTION' || phase === 'SCAPEGOAT_BAN') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [phase]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, phase]);

  // --- HELPER: Is Wolf? ---
  const isWolf = (p: AssignedPlayer) => {
    const role = ROLES_DATA.find(r => r.id === p.roleId);
    return (
        role?.category === 'WEREWOLF' || 
        p.roleId === 'white-wolf' || 
        (p.roleId === 'wild-child' && p.isTransformed) ||
        (p.roleId === 'wolf-dog' && p.isWolfSide) ||
        p.isWolfSide // For infected players
    );
  };

  // --- STATS CALCULATION (Real-time Dashboard) ---
  const stats = useMemo(() => {
    const alive = gamePlayers.filter(p => p.status === 'ALIVE');
    const wolvesCount = alive.filter(p => isWolf(p)).length;
    
    return {
        wolves: wolvesCount,
        villagers: alive.length - wolvesCount
    };
  }, [gamePlayers]);

  // --- INITIALIZATION ---
  useEffect(() => {
    distributeRoles();
  }, []); 

  const distributeRoles = () => {
    let roleDeck: string[] = [];
    
    // CORRECTION CRITIQUE DISTRIBUTION
    Object.entries(selectedRoles).forEach(([roleId, qty]) => {
      const count = Number(qty);
      const roleDef = ROLES_DATA.find(r => r.id === roleId);
      if (!roleDef || count <= 0) return;
      
      const cardsToAdd = count * roleDef.countValue;
      
      for (let i = 0; i < cardsToAdd; i++) {
        roleDeck.push(roleId);
      }
    });

    while (roleDeck.length < players.length) {
        roleDeck.push('simple-villager');
    }

    // Shuffle (Fisher-Yates)
    for (let i = roleDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roleDeck[i], roleDeck[j]] = [roleDeck[j], roleDeck[i]];
    }

    const assigned: AssignedPlayer[] = players.map((p, i) => ({
      ...p,
      roleId: roleDeck[i] || 'simple-villager',
      status: 'ALIVE',
      isTransformed: false,
      isWolfSide: false,
      isMayor: false,
      isPowerLost: false,
      isBannedFromVoting: false
    }));
    
    setGamePlayers(assigned);
    // Reset states
    setTurnCount(1);
    setWinner(null);
    setSuggestedWinner(null);
    setLogs([]);
    setElderLives(2);
    setInfectPowerUsed(false);
    setIsLittleGirlSurprised(false);
    setRustySwordTarget(null);
  };

  // --- HELPERS ---
  const getRole = (id: string) => ROLES_DATA.find(r => r.id === id);
  
  const formatPlayer = (p: Player | AssignedPlayer | undefined) => {
      if (!p) return 'Inconnu';
      const idx = players.findIndex(raw => raw.id === p.id);
      return `J${idx + 1} ${p.name}`;
  };

  const addLog = (phaseStr: 'MATIN' | 'SOIR' | 'NUIT', message: string, deadIds: string[] = []) => {
      setLogs(prev => [...prev, {
          turn: turnCount,
          phase: phaseStr,
          message,
          deadPlayerIds: deadIds
      }]);
  };

  const getAlivePlayers = () => gamePlayers.filter(p => p.status === 'ALIVE');
  
  const getActiveRolePlayers = (roleId: string) => {
    if (roleId === 'simple-werewolf') {
        return gamePlayers.filter(p => p.status === 'ALIVE' && isWolf(p));
    }
    return gamePlayers.filter(p => p.roleId === roleId && p.status === 'ALIVE');
  };

  const getCurrentStepPlayers = () => {
     if (!currentStepRole) return [];
     if (currentStepRole.id === LOVERS_RECOGNITION_ID) return [];
     if (currentStepRole.id === INFECT_ACTION_ID) return getActiveRolePlayers('infected-father');
     if (currentStepRole.id === 'comedian') return getActiveRolePlayers('comedian');
     if (comedianCurrentRole === currentStepRole.id) return getActiveRolePlayers('comedian');
     if (currentStepRole.id === 'simple-werewolf') return getActiveRolePlayers('simple-werewolf');
     return getActiveRolePlayers(currentStepRole.id);
  };

  const getLivingNeighbors = (targetId: string) => {
      const alivePlayers = gamePlayers.filter(p => p.status === 'ALIVE'); 
      if (alivePlayers.length < 2) return [];

      const idx = alivePlayers.findIndex(p => p.id === targetId);
      if (idx === -1) return [];

      const left = alivePlayers[(idx - 1 + alivePlayers.length) % alivePlayers.length];
      const right = alivePlayers[(idx + 1) % alivePlayers.length];
      
      if (left.id === right.id) return [left];
      return [left, right];
  };

  // --- MAYOR LOGIC ---
  const handleSetMayor = (playerId: string) => {
      setGamePlayers(prev => prev.map(p => ({
          ...p,
          isMayor: p.id === playerId ? true : false
      })));
      setMayorDeathPending(false);
      
      const newMayor = gamePlayers.find(p => p.id === playerId);
      if (newMayor) {
          addLog(phase === 'NIGHT' ? 'NUIT' : 'SOIR', `${formatPlayer(newMayor)} a été désigné comme nouveau Maire.`);
      }
  };

  // --- VICTORY CHECKER (SUGGESTED) ---
  const checkVictoryConditions = (currentPlayers: AssignedPlayer[]) => {
    const alive = currentPlayers.filter(p => p.status === 'ALIVE');
    const wolves = alive.filter(p => isWolf(p));
    const solo = alive.filter(p => getRole(p.roleId)?.category === 'LONER');

    // 1. White Wolf Win
    const whiteWolf = alive.find(p => p.roleId === 'white-wolf');
    if (alive.length === 1 && whiteWolf) {
      setSuggestedWinner({ type: 'SOLO', label: 'Le Loup Blanc', survivors: [whiteWolf] });
      return;
    }

    // 2. Lovers Win
    const lovers = alive.filter(p => p.loverId);
    const isMixedCoupleAlive = lovers.length === 2 && 
                               lovers.some(p => isWolf(p)) && 
                               lovers.some(p => !isWolf(p) && getRole(p.roleId)?.category !== 'LONER');

    if (lovers.length === alive.length && lovers.length > 0) {
       setSuggestedWinner({ type: 'LOVER', label: 'Les Amoureux', survivors: lovers });
       return;
    }

    // 3. Village Win
    if (wolves.length === 0 && solo.length === 0) {
      setSuggestedWinner({ type: 'VILLAGE', label: 'Le Village', survivors: alive });
      return;
    }

    // 4. Wolves Win
    if (wolves.length >= (alive.length - wolves.length) && solo.length === 0) {
        if (isMixedCoupleAlive) return; // Game continues for couple
        
        const witch = alive.find(p => p.roleId === 'witch');
        if (witch && witchInventory.hasLife) return; // Last hope

        setSuggestedWinner({ type: 'WEREWOLVES', label: 'Les Loups-Garous', survivors: wolves });
        return;
    }
  };

  const confirmVictory = () => {
    if (suggestedWinner) {
        setWinner(suggestedWinner);
        setPhase('VICTORY');
        setSuggestedWinner(null);
    }
  };

  // --- NIGHT LOGIC SEQUENCE ---
  const nightSequence = useMemo(() => {
    const isRoleActive = (roleId: string) => {
        if (roleId === LOVERS_RECOGNITION_ID) return true;
        if (roleId === INFECT_ACTION_ID) return true;
        
        if (roleId === 'wolf-dog') return turnCount === 1 && gamePlayers.some(p => p.roleId === 'wolf-dog' && p.status === 'ALIVE');
        if (roleId === 'fox') return gamePlayers.some(p => p.roleId === 'fox' && p.status === 'ALIVE' && !p.isPowerLost);

        if (roleId === 'comedian') return gamePlayers.some(p => p.roleId === 'comedian' && p.status === 'ALIVE');
        
        // Wolf roles check
        if (roleId === 'simple-werewolf') return gamePlayers.some(p => p.status === 'ALIVE' && isWolf(p));
        
        // Big Bad Wolf: Only if NO WOLF has died yet.
        if (roleId === 'big-bad-wolf') {
             // Check if any player with Wolf status has died
             const anyWolfDead = logs.some(l => l.deadPlayerIds.some(dId => {
                 const deadPlayer = gamePlayers.find(gp => gp.id === dId); // State might still have role info if status is DEAD
                 if (deadPlayer) return isWolf(deadPlayer);
                 return false;
             }));
             return !anyWolfDead && gamePlayers.some(p => p.roleId === 'big-bad-wolf' && p.status === 'ALIVE');
        }

        return gamePlayers.some(p => p.roleId === roleId && p.status === 'ALIVE');
    };

    const presentRoleIds = new Set(gamePlayers.map(p => p.roleId));
    if (comedianCurrentRole) presentRoleIds.add(comedianCurrentRole);
    if (isRoleActive('simple-werewolf')) presentRoleIds.add('simple-werewolf');

    let sequence = ROLES_DATA
      .filter(role => {
        const wakesUp = role.wakeUpPriority > 0;
        
        if (role.id === 'cupid' && turnCount > 1) return false;
        if (role.id === 'wild-child' && turnCount > 1) return false;
        if (role.id === 'wolf-dog' && turnCount > 1) return false;
        if (role.id === 'white-wolf' && turnCount % 2 !== 0) return false;
        
        if (!isRoleActive(role.id)) return false;
        if (!presentRoleIds.has(role.id) && role.id !== 'simple-werewolf') return false;

        return wakesUp;
      })
      .sort((a, b) => a.wakeUpPriority - b.wakeUpPriority);

    // Insert Special Steps
    if (presentRoleIds.has('comedian') && comedianExtras.length > 0 && isRoleActive('comedian')) {
        const comedianStep = ROLES_DATA.find(r => r.id === 'comedian');
        if (comedianStep && !sequence.find(r => r.id === 'comedian')) sequence.unshift(comedianStep);
    }

    if (turnCount === 1 && presentRoleIds.has('cupid')) {
        const cupidIndex = sequence.findIndex(r => r.id === 'cupid');
        if (cupidIndex !== -1) {
            sequence.splice(cupidIndex + 1, 0, {
                id: LOVERS_RECOGNITION_ID,
                name: 'Les Amoureux',
                description: 'Les Amoureux se réveillent et se reconnaissent.',
                category: 'VILLAGER',
                wakeUpPriority: 21,
                countValue: 0, maxQuantity: 0, expansion: ''
            });
        }
    }

    // Insert Infect Father action after Wolves if Infect Father is alive and hasn't used power
    if (presentRoleIds.has('infected-father') && !infectPowerUsed) {
        const wolfIndex = sequence.findIndex(r => r.id === 'simple-werewolf');
        if (wolfIndex !== -1) {
             sequence.splice(wolfIndex + 1, 0, {
                id: INFECT_ACTION_ID,
                name: "L'Infect Père des Loups",
                description: "Peut transformer la victime des loups en loup-garou.",
                category: 'WEREWOLF',
                wakeUpPriority: 75, // Same as data, just placeholder
                countValue: 0, maxQuantity: 0, expansion: ''
             });
        }
    }

    return sequence;
  }, [gamePlayers, turnCount, comedianCurrentRole, comedianExtras, infectPowerUsed, logs, players]);

  const currentStepRole = nightSequence[currentStepIndex];

  // --- ACTIONS HANDLERS ---

  const handleNextStep = () => {
    if (currentStepRole) {
      // Logic unchanged for standard actions...
      if (currentStepRole.id === 'comedian' && specialAction) {
         setComedianCurrentRole(specialAction);
      }
      else if (currentStepRole.id === 'seer') {
        if (!seerReveal && currentTargets.length === 1) {
           const target = gamePlayers.find(p => p.id === currentTargets[0]);
           if (target) {
              setSeerReveal({ 
                 name: formatPlayer(target), 
                 roleName: getRole(target.roleId)?.name || 'Inconnu',
                 isTransformed: target.isTransformed || target.isWolfSide
              });
           }
           return; 
        } else {
           setSeerReveal(null);
        }
      }
      else if (currentStepRole.id === 'fox') {
          if (!foxResult && currentTargets.length === 1) {
              const targetId = currentTargets[0];
              const target = gamePlayers.find(p => p.id === targetId);
              if (target) {
                  const neighbors = getLivingNeighbors(targetId);
                  const groupToCheck = [target, ...neighbors];
                  const hasWolf = groupToCheck.some(p => isWolf(p));

                  if (hasWolf) {
                      setFoxResult('FOUND');
                      addLog('NUIT', `Le Renard a flairé un Loup parmi ${formatPlayer(target)} et ses voisins.`);
                  } else {
                      setFoxResult('NOT_FOUND');
                      setGamePlayers(prev => prev.map(p => p.roleId === 'fox' ? { ...p, isPowerLost: true } : p));
                      addLog('NUIT', `Le Renard n'a rien senti autour de ${formatPlayer(target)}. Il perd son flair.`);
                  }
              }
              return;
          } else {
              setFoxResult(null);
          }
      }
      else if (currentStepRole.id === 'wolf-dog') {
          const dog = gamePlayers.find(p => p.roleId === 'wolf-dog');
          if (dog) {
             const choseWolf = specialAction === 'BECOME_WOLF';
             if (choseWolf) {
                 const newPlayers = gamePlayers.map(p => p.id === dog.id ? { ...p, isWolfSide: true } : p);
                 setGamePlayers(newPlayers);
                 addLog('NUIT', `${formatPlayer(dog)} a choisi de rejoindre la meute des Loups-Garous.`);
             } else {
                 addLog('NUIT', `${formatPlayer(dog)} a choisi de rester un fidèle Villageois.`);
             }
          }
      }
      else if (currentStepRole.id === INFECT_ACTION_ID) {
           if (specialAction === 'INFECT') {
               // Get the victim of the wolves from the current night's events
               const wolfKillEventIndex = nightEvents.findIndex(e => e.roleId === 'simple-werewolf' && e.actionType === 'KILL');
               if (wolfKillEventIndex !== -1) {
                   const victimId = nightEvents[wolfKillEventIndex].targetIds[0];
                   const victim = gamePlayers.find(p => p.id === victimId);
                   
                   if (victim) {
                       // Remove kill event
                       const newEvents = [...nightEvents];
                       newEvents.splice(wolfKillEventIndex, 1);
                       
                       // Add Infect Event
                       newEvents.push({ roleId: 'infected-father', actionType: 'INFECT', targetIds: [victimId] });
                       setNightEvents(newEvents);
                       
                       // Transform player immediately in state (visual feedback + logic)
                       setGamePlayers(prev => prev.map(p => p.id === victimId ? { ...p, isWolfSide: true } : p));
                       setInfectPowerUsed(true);
                       addLog('NUIT', `L'Infect Père des Loups a transformé ${formatPlayer(victim)} en Loup-Garou !`);
                   }
               }
           }
      }
      else if (currentTargets.length > 0 || specialAction || isLittleGirlSurprised) {
        let type: GameEvent['actionType'] = 'KILL';
        if (specialAction) {
           type = specialAction as GameEvent['actionType'];
        } else {
           switch (currentStepRole.id) {
              case 'cupid': type = 'LINK'; break;
              case 'salvager': type = 'SAVE'; break;
              case 'wild-child': type = 'TRANSFORM'; break;
              case 'raven': type = 'CURSE'; break;
              case 'thief': type = 'TRANSFORM'; break;
              case 'scapegoat': type = 'BAN_VOTE'; break; // Should be handled in Scapegoat Phase but safe here
              default: type = 'KILL'; 
           }
        }
        
        // LITTLE GIRL SURPRISED (ADDITIONAL KILL)
        if (currentStepRole.id === 'simple-werewolf' && isLittleGirlSurprised) {
            const littleGirl = gamePlayers.find(p => p.roleId === 'little-girl' && p.status === 'ALIVE');
            if (littleGirl) {
                // Add explicit kill event for Little Girl
                setNightEvents(prev => [...prev, {
                    roleId: 'simple-werewolf',
                    actionType: 'KILL',
                    targetIds: [littleGirl.id]
                }]);
                addLog('NUIT', `La Petite Fille a été surprise et dévorée par les Loups !`);
            }
        }

        if (type === 'LINK') {
             const newPlayers = [...gamePlayers];
             currentTargets.forEach(tId => {
                 const pIndex = newPlayers.findIndex(p => p.id === tId);
                 if (pIndex >= 0) newPlayers[pIndex].loverId = 'LINKED';
             });
             setGamePlayers(newPlayers);
        } else if (type === 'SAVE') {
             setLastProtectedId(currentTargets[0]);
        } else if (type === 'TRANSFORM' && currentStepRole.id === 'wild-child') {
             const newPlayers = [...gamePlayers];
             const childIndex = newPlayers.findIndex(p => p.roleId === 'wild-child');
             if (childIndex >= 0) newPlayers[childIndex].roleModelId = currentTargets[0];
             setGamePlayers(newPlayers);
        } else if (type === 'CURSE') {
            setRavenTargetId(currentTargets[0]);
        }

        if (currentTargets.length > 0) {
            setNightEvents(prev => [...prev, {
            roleId: currentStepRole.id,
            actionType: type,
            targetIds: currentTargets
            }]);
        }
      }
    }

    setCurrentTargets([]);
    setSpecialAction(null);
    setIsLittleGirlSurprised(false);

    if (currentStepIndex < nightSequence.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      
      // RUSTY KNIGHT VENGEANCE CHECK (End of Night)
      if (rustySwordTarget && rustySwordTarget.killTurn === turnCount) {
          const victim = gamePlayers.find(p => p.id === rustySwordTarget.id);
          if (victim && victim.status === 'ALIVE') {
              setNightEvents(prev => [...prev, {
                  roleId: 'rusty-knight',
                  actionType: 'KILL',
                  targetIds: [victim.id]
              }]);
              addLog('MATIN', `La malédiction de l'Épée Rouillée a frappé : ${formatPlayer(victim)} meurt du tétanos !`);
          }
          setRustySwordTarget(null); // Clear
      }

      setPhase('MORNING');
    }
  };

  const handleWitchAction = (type: 'WITCH_SAVE' | 'WITCH_KILL', targetId?: string) => {
      setNightEvents(prev => [...prev, {
          roleId: 'witch',
          actionType: type,
          targetIds: targetId ? [targetId] : []
      }]);

      if (type === 'WITCH_SAVE' && targetId) {
          setWitchUseCount(prev => ({ ...prev, life: prev.life + 1 }));
          const victim = gamePlayers.find(p => p.id === targetId);
          if (victim) {
             addLog('NUIT', `La Sorcière a utilisé sa potion de vie sur ${formatPlayer(victim)} (${getRole(victim.roleId)?.name}).`);
          }
      } else {
          setWitchUseCount(prev => ({ ...prev, death: prev.death + 1 }));
          setCurrentTargets([]);
          setSpecialAction(null);
      }
  };

  const toggleTarget = (playerId: string, limit = 1) => {
    setCurrentTargets(prev => {
      if (prev.includes(playerId)) return prev.filter(id => id !== playerId);
      if (prev.length >= limit) {
         if (limit === 1) return [playerId];
         return [...prev]; 
      }
      return [...prev, playerId];
    });
  };

  // --- DEATH ENGINE ---
  
  const getDeathCause = (playerId: string, context: 'MORNING' | 'EVENING', override?: string): string => {
      if (override) return override;
      if (context === 'EVENING') return 'Vote du Village';
      if (phase === 'HUNTER_ACTION') return 'Tir du Chasseur';
      
      const witchKill = nightEvents.find(e => e.actionType === 'WITCH_KILL' && e.targetIds.includes(playerId));
      if (witchKill) return 'Potion de Mort (Sorcière)';

      const whiteWolfKill = nightEvents.find(e => e.roleId === 'white-wolf' && e.actionType === 'KILL' && e.targetIds.includes(playerId));
      if (whiteWolfKill) return 'Loup-Garou Blanc';

      const bigBadWolfKill = nightEvents.find(e => e.roleId === 'big-bad-wolf' && e.actionType === 'KILL' && e.targetIds.includes(playerId));
      if (bigBadWolfKill) return 'Grand Méchant Loup';
      
      // Rusty Knight Vengeance (delayed)
      const rustyKill = nightEvents.find(e => e.roleId === 'rusty-knight' && e.actionType === 'KILL' && e.targetIds.includes(playerId));
      if (rustyKill) return 'Tétanos (Épée Rouillée)';

      const wolfKill = nightEvents.find(e => e.roleId === 'simple-werewolf' && e.actionType === 'KILL' && e.targetIds.includes(playerId));
      if (wolfKill) return 'Loups-Garous';

      return 'Inconnue'; 
  };

  const processDeaths = (initialDeadIds: string[], context: 'MORNING' | 'EVENING', causeOverride?: string) => {
    
    // BEAR TAMER CHECK (Morning Only)
    if (context === 'MORNING') {
        const bearTamer = gamePlayers.find(p => p.roleId === 'bear-tamer' && p.status === 'ALIVE');
        if (bearTamer) {
            const neighbors = getLivingNeighbors(bearTamer.id);
            if (neighbors.some(n => isWolf(n))) {
                setShowBearModal(true);
                addLog('MATIN', "🐻 GRRRR ! L'Ours du Montreur grogne !");
            }
        }
    }

    let processedDeadIds = new Set<string>();
    let queue = [...initialDeadIds];
    let iterations = 0;
    let newMayorDeath = false;
    let elderCurseTriggered = false;
    
    const deathLogs: string[] = [];

    const processSingleDeath = (id: string) => {
        if (deathLogs.includes(id)) return;
        const player = gamePlayers.find(p => p.id === id);
        if (!player) return;

        // --- ELDER RESISTANCE ---
        const isElder = player.roleId === 'elder';
        const isWolfAttack = nightEvents.some(e => 
            (e.roleId === 'simple-werewolf' || e.roleId === 'big-bad-wolf') && 
            e.actionType === 'KILL' && 
            e.targetIds.includes(id)
        );

        if (isElder && isWolfAttack && elderLives > 1) {
            setElderLives(prev => prev - 1);
            addLog('MATIN', `L'Ancien (${formatPlayer(player)}) a survécu à l'attaque des Loups-Garous ! (Vies restantes: 1)`);
            return; // STOP DEATH
        }

        let finalCause = getDeathCause(id, context, causeOverride);
        const roleName = getRole(player.roleId)?.name;
        
        // --- RUSTY KNIGHT MARKING (Circular Logic) ---
        if (player.roleId === 'rusty-knight' && (finalCause === 'Loups-Garous' || finalCause === 'Grand Méchant Loup')) {
            // Find next living wolf to the left (clockwise in array)
            const knightIndex = gamePlayers.findIndex(p => p.id === id);
            let targetWolf = null;
            const playerCount = gamePlayers.length;
            
            for (let i = 1; i < playerCount; i++) {
                const checkIndex = (knightIndex + i) % playerCount;
                const candidate = gamePlayers[checkIndex];
                if (candidate.status === 'ALIVE' && isWolf(candidate)) {
                    targetWolf = candidate;
                    break;
                }
            }

            if (targetWolf) {
                addLog('MATIN', `Le Chevalier à l'Épée Rouillée a blessé ${formatPlayer(targetWolf)} dans sa chute ! (Mort différée)`);
                setRustySwordTarget({ id: targetWolf.id, killTurn: turnCount + 1 }); // Die next morning (end of next night)
            }
        }

        // --- ELDER CURSE CHECK ---
        if (isElder && ['Vote du Village', 'Potion de Mort (Sorcière)', 'Tir du Chasseur'].includes(finalCause)) {
            elderCurseTriggered = true;
        }

        addLog(context === 'MORNING' ? 'MATIN' : 'SOIR', `${formatPlayer(player)} (${roleName}) est mort. Cause : ${finalCause}.`, [id]);
        processedDeadIds.add(id);
        deathLogs.push(id);

        // --- CASCADES ---
        if (player.isMayor) newMayorDeath = true;

        // Lovers
        if (player.loverId) {
            const lovers = gamePlayers.filter(p => p.loverId && p.id !== id && p.status === 'ALIVE');
            lovers.forEach(lover => {
                if (!processedDeadIds.has(lover.id) && !queue.includes(lover.id)) {
                    queue.push(lover.id);
                }
            });
        }
        
        // Wild Child
        const wildChild = gamePlayers.find(p => p.roleId === 'wild-child');
        if (wildChild && !wildChild.isTransformed && wildChild.roleModelId === id) {
             addLog(context === 'MORNING' ? 'MATIN' : 'SOIR', `ALERT: Le modèle de l'Enfant Sauvage (${formatPlayer(player)}) est mort. ${formatPlayer(wildChild)} devient un Loup-Garou !`);
        }
    };

    while (queue.length > 0 && iterations < 50) {
        const currentId = queue.shift()!;
        processSingleDeath(currentId);
        iterations++;
    }

    const finalDeadIds = Array.from(processedDeadIds);

    // --- APPLY ELDER CURSE ---
    if (elderCurseTriggered) {
        addLog('SOIR', "☠️ MALÉDICTION : Le Village a tué l'Ancien ! Tous les villageois perdent leurs pouvoirs !");
        setGamePlayers(prev => prev.map(p => {
             const role = getRole(p.roleId);
             if (role?.category === 'VILLAGER' && p.roleId !== 'simple-villager' && !isWolf(p)) {
                 return { ...p, isPowerLost: true };
             }
             return p;
        }));
    }

    if (finalDeadIds.length === 0) {
      if (context === 'MORNING') {
          // Clear bans from previous day
          setGamePlayers(prev => prev.map(p => ({...p, isBannedFromVoting: false})));
          setPhase('DAY_VOTE');
      }
      else startNextNight();
      return;
    }

    const idiot = gamePlayers.find(p => p.roleId === 'idiot');
    if (idiot && context === 'EVENING' && finalDeadIds.includes(idiot.id) && initialDeadIds.includes(idiot.id) && !causeOverride) {
         addLog('SOIR', `${formatPlayer(idiot)} révèle qu'il est l'Idiot du Village ! Il survit mais ne vote plus.`);
         const index = finalDeadIds.indexOf(idiot.id);
         if (index > -1) finalDeadIds.splice(index, 1);
    }

    const nextGamePlayers = gamePlayers.map(p => {
        let updates: Partial<AssignedPlayer> = {};
        if (finalDeadIds.includes(p.id)) {
            updates.status = 'DEAD';
            if (p.isMayor) updates.isMayor = false;
        }
        if (p.roleId === 'wild-child' && !p.isTransformed && p.roleModelId && finalDeadIds.includes(p.roleModelId)) {
            updates.isTransformed = true;
        }
        // Angel Instant Win Check
        if (p.roleId === 'angel' && finalDeadIds.includes(p.id) && turnCount === 1) {
             setSuggestedWinner({ type: 'SOLO', label: "L'Ange", survivors: [p] });
        }
        return { ...p, ...updates };
    });
    
    setGamePlayers(nextGamePlayers);

    if (newMayorDeath) {
        setMayorDeathPending(true);
    }

    checkVictoryConditions(nextGamePlayers);

    const deadPlayersObjects = nextGamePlayers.filter(p => finalDeadIds.includes(p.id));
    const hunter = deadPlayersObjects.find(p => p.roleId === 'hunter');
    
    // SCAPEGOAT CHECK TRIGGER (If Scapegoat died by equality)
    const scapegoatDied = deadPlayersObjects.find(p => p.roleId === 'scapegoat');
    const isScapegoatEquality = causeOverride === 'Égalité (Bouc Émissaire)';

    if (hunter) {
      setDeathQueue(prev => [...prev, hunter.id]);
      pendingNextPhase.current = isScapegoatEquality ? 'SCAPEGOAT_BAN' : (context === 'MORNING' ? 'DAY_VOTE' : 'NIGHT');
      setPhase('HUNTER_ACTION');
    } else if (scapegoatDied && isScapegoatEquality) {
        setPhase('SCAPEGOAT_BAN');
    } else {
      if (context === 'MORNING') {
          // Clear bans when day starts
           setGamePlayers(prev => prev.map(p => ({...p, isBannedFromVoting: false})));
           setPhase('DAY_VOTE');
      }
      else startNextNight();
    }
  };

  const handleScapegoatAction = () => {
      const scapegoat = gamePlayers.find(p => p.roleId === 'scapegoat' && p.status === 'ALIVE');
      if (scapegoat) {
          if (window.confirm(`Confirmer la mort du Bouc Émissaire (${formatPlayer(scapegoat)}) pour cause d'égalité ?`)) {
              // FORCE NEXT PHASE TO BE SCAPEGOAT_BAN BEFORE DEATH PROCESS
              pendingNextPhase.current = 'SCAPEGOAT_BAN';
              processDeaths([scapegoat.id], 'EVENING', 'Égalité (Bouc Émissaire)');
          }
      } else {
          alert("Le Bouc Émissaire est déjà mort ou n'est pas dans la partie !");
      }
  };

  const handleHunterShot = (targetId: string) => {
    if (!targetId) return;
    
    const nextP = pendingNextPhase.current;
    
    // Manually add log and kill
    const target = gamePlayers.find(p => p.id === targetId);
    if(target) {
        addLog(phase === 'MORNING' ? 'MATIN' : 'SOIR', `Le Chasseur a abattu ${formatPlayer(target)} !`);
        const newPlayers = gamePlayers.map(p => p.id === targetId ? { ...p, status: 'DEAD' as const } : p);
        setGamePlayers(newPlayers);
        checkVictoryConditions(newPlayers);
    }
    
    setPhase(nextP);
  };
  
  const confirmScapegoatBan = () => {
      const newPlayers = gamePlayers.map(p => ({
          ...p,
          isBannedFromVoting: currentTargets.includes(p.id)
      }));
      setGamePlayers(newPlayers);
      setCurrentTargets([]);
      addLog('NUIT', `Le Bouc Émissaire a interdit de vote : ${currentTargets.map(id => formatPlayer(gamePlayers.find(p => p.id === id))).join(', ')}.`);
      startNextNight();
  };

  const startNextNight = () => {
    // Check if Mayor is alive or exists if one was ever assigned
    const aliveMayor = gamePlayers.find(p => p.isMayor && p.status === 'ALIVE');
    const mayorNeeded = gamePlayers.some(p => p.isMayor); 
    
    if (mayorDeathPending || (mayorNeeded && !aliveMayor)) {
        if (!window.confirm("⚠️ ATTENTION : Le Village n'a pas de Maire vivant ! Il est recommandé d'en élire un avant la nuit. Continuer quand même ?")) {
            return;
        }
        setMayorDeathPending(false);
    }

    setTurnCount(prev => prev + 1);
    setPhase('NIGHT');
    setCurrentStepIndex(0);
    setNightEvents([]);
    setComedianCurrentRole(null);
    setVoteCandidateId(null);
    setRavenTargetId(null);
    setFoxResult(null);
  };

  // --- RENDER ---

  if (phase === 'DISTRIBUTION') {
    return (
      <div className="w-full animate-in fade-in duration-500">
        <h2 className="text-2xl font-serif text-center mb-6 text-werewolf-accent">Distribution des Rôles</h2>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden mb-8">
          <table className="w-full text-left">
            <thead className="bg-zinc-950 text-zinc-400 font-serif text-sm uppercase">
              <tr>
                <th className="p-4">Joueur</th>
                <th className="p-4">Rôle</th>
                <th className="p-4 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {gamePlayers.map(p => (
                <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 font-bold text-zinc-200">{formatPlayer(p)}</td>
                  <td className="p-4 text-zinc-400 flex items-center gap-2">{getRole(p.roleId)?.name}</td>
                  <td className="p-4 text-center">
                    <span className="inline-block px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded border border-green-800">Vivant</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center gap-4">
           <button onClick={distributeRoles} className="px-6 py-3 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-2 transition-all">
             <RefreshCw size={18} /> Relancer
           </button>
           <button onClick={() => setPhase('NIGHT')} className="px-8 py-3 rounded-lg bg-werewolf-700 text-white font-serif font-bold shadow-lg shadow-werewolf-900/50 hover:bg-werewolf-600 hover:-translate-y-1 transition-all flex items-center gap-2">
             <Moon size={20} /> Lancer la Nuit 1
           </button>
        </div>
      </div>
    );
  }

  // --- MAIN GAME CONTAINER ---
  return (
    <div className="flex flex-col h-full relative animate-in fade-in duration-500">
        
        {/* SOFT VICTORY BANNER */}
        {suggestedWinner && phase !== 'VICTORY' && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-lg animate-in slide-in-from-top-4">
                <div className="bg-zinc-800/90 backdrop-blur border-2 border-werewolf-accent rounded-xl shadow-2xl p-4 flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 text-werewolf-accent font-serif font-bold mb-2">
                        <Trophy size={20} />
                        <span>Condition de Victoire Détectée</span>
                    </div>
                    <p className="text-white text-lg font-bold mb-4">{suggestedWinner.label}</p>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setSuggestedWinner(null)}
                            className="flex-1 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm font-bold"
                        >
                            Continuer
                        </button>
                        <button 
                            onClick={confirmVictory}
                            className="flex-1 py-2 rounded bg-werewolf-600 hover:bg-werewolf-500 text-white text-sm font-bold shadow-lg shadow-werewolf-900/50"
                        >
                            Terminer la partie
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* BEAR ALERT MODAL */}
        {showBearModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-red-950 border-2 border-red-500 rounded-xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-in zoom-in-95">
                    <div className="bg-red-900/50 p-4 rounded-full w-fit mx-auto mb-6">
                        <AlertTriangle size={64} className="text-red-500 animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-serif font-black text-white mb-4">L'Ours Grogne !</h2>
                    <p className="text-red-200 mb-8 text-lg">Le Montreur d'Ours sent la présence d'un Loup-Garou parmi ses voisins immédiats !</p>
                    <button 
                        onClick={() => setShowBearModal(false)}
                        className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors w-full"
                    >
                        J'ai compris
                    </button>
                </div>
            </div>
        )}

        {/* PERMANENT DASHBOARD HEADER */}
        {phase !== 'VICTORY' && (
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 shadow-lg sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-red-500 font-bold font-serif" title="Loups Vivants">
                        <span className="text-xl">🐺</span>
                        <span className="text-lg">{stats.wolves}</span>
                    </div>
                    <div className="w-px h-6 bg-zinc-800"></div>
                    <div className="flex items-center gap-2 text-blue-300 font-bold font-serif" title="Villageois Vivants">
                        <span className="text-xl">🧑‍🌾</span>
                        <span className="text-lg">{stats.villagers}</span>
                    </div>
                </div>
                
                {/* Phase Indicator */}
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest border border-zinc-800 px-2 py-1 rounded bg-zinc-900">
                    {phase === 'NIGHT' ? `Nuit ${turnCount}` : phase === 'SCAPEGOAT_BAN' ? 'Bannissement' : `Jour ${turnCount}`}
                </div>
            </div>
        )}

        {/* 2. NIGHT PHASE CONTENT */}
        {phase === 'NIGHT' && currentStepRole && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
             
             {/* 2.0 LOVERS RECOGNITION */}
             {currentStepRole.id === LOVERS_RECOGNITION_ID ? (
                <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-500 p-4">
                    <div className="p-6 bg-pink-900/30 rounded-full mb-6 ring-4 ring-pink-500/20">
                        <Heart size={64} className="text-pink-400" />
                    </div>
                    <h2 className="text-3xl font-serif text-zinc-200 mb-2">Amour Interdit</h2>
                    <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-xl text-center mb-8 shadow-2xl max-w-md w-full">
                        <p className="text-zinc-500 mb-4">Ces joueurs sont désormais liés par le destin :</p>
                        <div className="space-y-2">
                            {gamePlayers.filter(p => p.loverId).map(p => (
                                <div key={p.id} className="text-2xl font-bold text-pink-300 font-serif flex items-center justify-center gap-2">
                                    {formatPlayer(p)} <span className="text-zinc-600 text-sm">({getRole(p.roleId)?.name})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleNextStep} className="px-8 py-4 bg-zinc-100 text-zinc-950 font-bold rounded-full hover:scale-105 transition-all">Ils se rendorment...</button>
                </div>
             ) : currentStepRole.id === 'wolf-dog' ? (
                /* 2.0.1 WOLF-DOG DECISION */
                <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-500 p-4">
                    <div className="p-6 bg-yellow-900/30 rounded-full mb-6 ring-4 ring-yellow-500/20">
                        <Dog size={64} className="text-yellow-500" />
                    </div>
                    <h2 className="text-3xl font-serif text-zinc-200 mb-2">Le Chien-Loup</h2>
                    <p className="text-zinc-500 mb-8 max-w-md text-center">
                        {(() => {
                            const dog = gamePlayers.find(p => p.roleId === 'wolf-dog');
                            return dog ? formatPlayer(dog) : 'Inconnu';
                        })()} doit choisir son destin pour le reste de la partie.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mb-8">
                         <button 
                            onClick={() => setSpecialAction('STAY_VILLAGER')}
                            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                specialAction === 'STAY_VILLAGER' 
                                ? 'bg-blue-900/50 border-blue-400 text-white' 
                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-blue-800'
                            }`}
                         >
                            <Users size={32} />
                            <span className="font-bold">Rester Villageois</span>
                         </button>
                         <button 
                            onClick={() => setSpecialAction('BECOME_WOLF')}
                            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                specialAction === 'BECOME_WOLF' 
                                ? 'bg-red-900/50 border-red-500 text-white' 
                                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-red-800'
                            }`}
                         >
                            <PawPrint size={32} />
                            <span className="font-bold">Devenir Loup-Garou</span>
                         </button>
                    </div>

                    <button onClick={handleNextStep} disabled={!specialAction} className="px-8 py-4 bg-zinc-100 text-zinc-950 font-bold rounded-full hover:scale-105 transition-all disabled:opacity-50">Confirmer le choix</button>
                </div>
             ) : currentStepRole.id === INFECT_ACTION_ID ? (
                 /* 2.0.2 INFECT FATHER ACTION */
                 <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-500 p-4">
                     <div className="p-6 bg-green-900/30 rounded-full mb-6 ring-4 ring-green-500/20">
                         <Syringe size={64} className="text-green-500" />
                     </div>
                     <h2 className="text-3xl font-serif text-zinc-200 mb-2">L'Infect Père des Loups</h2>
                     <p className="text-zinc-500 mb-8 max-w-md text-center">
                         Les loups ont désigné une victime. Voulez-vous la transformer en Loup-Garou au lieu de la tuer ?
                     </p>
                     
                     {/* Show Victim Name */}
                     <div className="bg-red-900/20 border border-red-800 p-4 rounded-lg mb-8">
                         <span className="text-red-400 text-sm uppercase font-bold tracking-widest">Victime désignée :</span>
                         {(() => {
                             const wolfKill = nightEvents.find(e => e.roleId === 'simple-werewolf' && e.actionType === 'KILL');
                             const victim = wolfKill ? gamePlayers.find(p => p.id === wolfKill.targetIds[0]) : null;
                             return <div className="text-2xl font-bold text-white">{victim ? formatPlayer(victim) : "Personne"}</div>
                         })()}
                     </div>

                     <div className="flex gap-4">
                         <button 
                             onClick={() => { setSpecialAction('SKIP'); handleNextStep(); }}
                             className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg font-bold"
                         >
                             Non, laissez-la mourir
                         </button>
                         <button 
                             onClick={() => { setSpecialAction('INFECT'); handleNextStep(); }}
                             className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg font-bold shadow-lg shadow-green-900/50 flex items-center gap-2"
                         >
                             <Syringe size={18} /> Infecter (Unique)
                         </button>
                     </div>
                 </div>
             ) : seerReveal ? (
                /* 2.1 SEER REVEAL */
                <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-500 p-4">
                    <div className="p-6 bg-blue-900/30 rounded-full mb-6 ring-4 ring-blue-500/20">
                        <Eye size={64} className="text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-serif text-zinc-200 mb-2">La vision se dissipe...</h2>
                    <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-xl text-center mb-8 shadow-2xl">
                        <p className="text-zinc-500 uppercase text-xs tracking-widest mb-2">L'identité de</p>
                        <h3 className="text-2xl font-bold text-white mb-4">{seerReveal.name}</h3>
                        <p className="text-zinc-500 uppercase text-xs tracking-widest mb-2">est révélée :</p>
                        <div className="text-4xl font-serif font-black text-blue-400">
                            {seerReveal.roleName}
                            {seerReveal.isTransformed && <span className="block text-lg text-red-500 mt-2">(Allié aux Loups)</span>}
                        </div>
                    </div>
                    <button onClick={handleNextStep} className="px-8 py-4 bg-zinc-100 text-zinc-950 font-bold rounded-full hover:scale-105 transition-all">Refermer l'œil</button>
                </div>
             ) : foxResult ? (
                 /* 2.1.1 FOX RESULT */
                 <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-500 p-4">
                    <div className={`p-6 rounded-full mb-6 ring-4 ${foxResult === 'FOUND' ? 'bg-red-900/30 ring-red-500/20' : 'bg-green-900/30 ring-green-500/20'}`}>
                        <Search size={64} className={foxResult === 'FOUND' ? 'text-red-500' : 'text-green-500'} />
                    </div>
                    <h2 className="text-3xl font-serif text-zinc-200 mb-6">Le Flair du Renard</h2>
                    
                    {foxResult === 'FOUND' ? (
                        <div className="text-center space-y-4">
                            <h3 className="text-4xl font-black text-red-500">OUI !</h3>
                            <p className="text-zinc-400">Le Renard a senti la présence d'un Loup-Garou<br/>parmi la cible et ses voisins.</p>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <h3 className="text-4xl font-black text-green-500">NON...</h3>
                            <p className="text-zinc-400">Aucune odeur suspecte.<br/>Le Renard a perdu son flair définitivement.</p>
                        </div>
                    )}
                    
                    <button onClick={handleNextStep} className="mt-8 px-8 py-4 bg-zinc-100 text-zinc-950 font-bold rounded-full hover:scale-105 transition-all">Continuer</button>
                 </div>
             ) : (currentStepRole.id === 'two-sisters' || currentStepRole.id === 'three-brothers') ? (
                 /* 2.1.2 SIBLINGS RECOGNITION (PASSIVE) */
                 <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-500 p-4">
                     <div className="p-6 bg-purple-900/30 rounded-full mb-6 ring-4 ring-purple-500/20">
                        <Users size={64} className="text-purple-400" />
                     </div>
                     <h2 className="text-3xl font-serif text-zinc-200 mb-2">{currentStepRole.name}</h2>
                     <div className="bg-zinc-900 border border-zinc-700 p-8 rounded-xl text-center mb-8 shadow-2xl max-w-md w-full">
                        <p className="text-zinc-500 mb-4">La famille se réunit :</p>
                        <div className="space-y-2">
                             {getCurrentStepPlayers().map(p => (
                                 <div key={p.id} className="text-2xl font-bold text-purple-300 font-serif flex items-center justify-center gap-2">
                                     {formatPlayer(p)}
                                 </div>
                             ))}
                        </div>
                     </div>
                     <button onClick={handleNextStep} className="px-8 py-4 bg-zinc-100 text-zinc-950 font-bold rounded-full hover:scale-105 transition-all">
                         Ils se rendorment...
                     </button>
                 </div>
             ) : (
                /* 2.2 STANDARD NIGHT ROLE */
                <>
                    <div className="text-center py-6 space-y-1 bg-zinc-900/30 border-b border-zinc-800/50">
                        <h2 className="text-3xl md:text-5xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
                            {currentStepRole.name}
                        </h2>
                        <div className="flex items-center justify-center gap-2 text-werewolf-accent bg-werewolf-900/30 py-1 px-4 rounded-full mx-auto w-fit border border-werewolf-800/50 mt-2">
                            <User size={14} />
                            <span className="text-sm font-bold font-serif uppercase tracking-wide">
                                {getCurrentStepPlayers().length > 0 ? getCurrentStepPlayers().map(p => formatPlayer(p)).join(', ') : 'PERSONNE'}
                            </span>
                        </div>
                        {currentStepRole.id === 'big-bad-wolf' && (
                             <div className="text-red-500 font-bold text-sm mt-2 animate-pulse flex items-center justify-center gap-2">
                                 <Flame size={16} /> 2ème Victime Autorisée !
                             </div>
                        )}
                        {currentStepRole.id === 'simple-werewolf' && gamePlayers.some(p => p.roleId === 'little-girl' && p.status === 'ALIVE') && (
                            <div className="mt-4 flex justify-center">
                                <label className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={isLittleGirlSurprised} 
                                        onChange={(e) => setIsLittleGirlSurprised(e.target.checked)} 
                                        className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-werewolf-600 focus:ring-werewolf-500"
                                    />
                                    <span className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                                        <EyeOff size={16} className="text-purple-400"/> 
                                        La Petite Fille a été surprise !
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto py-6 px-1">
                        {/* COMEDIAN */}
                        {currentStepRole.id === 'comedian' ? (
                            <div className="flex flex-col items-center justify-center space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl px-4">
                                {comedianExtras.map(roleId => {
                                const role = ROLES_DATA.find(r => r.id === roleId);
                                return (
                                    <button key={roleId} onClick={() => setSpecialAction(roleId)} className={`p-6 rounded-xl border-2 transition-all text-center space-y-2 ${specialAction === roleId ? 'bg-werewolf-800/50 border-werewolf-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>
                                    <h3 className="font-serif font-bold text-lg">{role?.name}</h3>
                                    <p className="text-xs">{role?.description}</p>
                                    </button>
                                )
                                })}
                            </div>
                            <button onClick={handleNextStep} disabled={!specialAction} className="mt-8 px-8 py-4 bg-zinc-100 text-zinc-950 font-bold rounded-full hover:scale-105 transition-all disabled:opacity-50">Confirmer</button>
                            </div>
                        ) : currentStepRole.id === 'witch' ? (
                            /* WITCH OVERHAUL */
                            <div className="space-y-6 max-w-2xl mx-auto px-4">
                                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                                    <h3 className="text-zinc-400 font-serif font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Skull size={16} /> Victimes de la Nuit
                                    </h3>
                                    {nightEvents.filter(e => e.actionType === 'KILL').length === 0 ? (
                                        <div className="text-zinc-500 italic text-center py-4">Aucune victime pour le moment.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {nightEvents.filter(e => e.actionType === 'KILL').map((event, idx) => {
                                                const victimId = event.targetIds[0];
                                                const victim = gamePlayers.find(p => p.id === victimId);
                                                const attackerRole = getRole(event.roleId);
                                                if (!victim) return null;

                                                return (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-zinc-950 rounded border border-zinc-800">
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-bold text-lg">{formatPlayer(victim)}</span>
                                                            <span className="text-xs text-red-400">Tué par : {attackerRole?.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => handleWitchAction('WITCH_SAVE', victim.id)}
                                                                disabled={!witchInventory.hasLife}
                                                                className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all ${
                                                                    witchInventory.hasLife 
                                                                    ? 'bg-green-900 text-green-100 hover:bg-green-800 border border-green-700' 
                                                                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
                                                                }`}
                                                            >
                                                                <Heart size={14} />
                                                                {witchInventory.hasLife ? 'Sauver' : 'Épuisée'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* LIFE POTION CONTROLS */}
                                    <div className={`p-4 rounded-xl border transition-all ${witchInventory.hasLife ? 'bg-green-950/30 border-green-900' : 'bg-zinc-900/20 border-zinc-800 opacity-50'}`}>
                                         <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-green-400 font-serif font-bold text-sm">Potion de Vie</h3>
                                            <button onClick={() => setWitchInventory(p => ({...p, hasLife: !p.hasLife}))} className="text-xs p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400" title={witchInventory.hasLife ? "Désactiver" : "Activer"}>
                                                <Ban size={16}/>
                                            </button>
                                         </div>
                                         <div className="text-xs text-zinc-500">Utilisée {witchUseCount.life} fois</div>
                                    </div>

                                    {/* DEATH POTION CONTROLS */}
                                    <div className={`p-4 rounded-xl border transition-all ${witchInventory.hasDeath ? 'bg-red-950/30 border-red-900' : 'bg-zinc-900/20 border-zinc-800 opacity-50'}`}>
                                         <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-red-400 font-serif font-bold text-sm">Potion de Mort</h3>
                                            <button onClick={() => setWitchInventory(p => ({...p, hasDeath: !p.hasDeath}))} className="text-xs p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400" title={witchInventory.hasDeath ? "Désactiver" : "Activer"}>
                                                <Ban size={16}/>
                                            </button>
                                         </div>
                                         <div className="text-xs text-zinc-500 mb-2">Utilisée {witchUseCount.death} fois</div>
                                    </div>
                                </div>

                                {/* DEATH POTION SELECTION GRID */}
                                {witchInventory.hasDeath && (
                                    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                        <h4 className="text-xs text-zinc-400 uppercase font-bold mb-3">Cibler pour tuer</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                            {gamePlayers.map(p => {
                                                if (p.status === 'DEAD') return null; 
                                                const isSelected = currentTargets.includes(p.id);
                                                return (
                                                    <button key={p.id} onClick={() => { toggleTarget(p.id, 1); setSpecialAction('WITCH_KILL'); }} className={`p-3 rounded border text-sm font-bold truncate transition-colors text-left ${isSelected ? 'bg-red-600 border-red-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}>
                                                        {formatPlayer(p)}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        {specialAction === 'WITCH_KILL' && currentTargets.length > 0 && (
                                            <button onClick={() => handleWitchAction('WITCH_KILL', currentTargets[0])} className="w-full mt-4 p-3 bg-red-900 text-white text-sm font-bold rounded animate-in fade-in flex items-center justify-center gap-2 hover:bg-red-800">
                                                <Skull size={16} /> Confirmer le poison
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* STANDARD GRID */
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-2">
                                {gamePlayers.map(player => {
                                    const activeRolePlayers = getCurrentStepPlayers();
                                    const isDead = player.status === 'DEAD';
                                    const isSelf = activeRolePlayers.some(p => p.id === player.id);
                                    const isCupid = currentStepRole.id === 'cupid';
                                    
                                    // Salvager Constraint
                                    const isProtectedLastTurn = currentStepRole.id === 'salvager' && player.id === lastProtectedId;

                                    let isDisabled = isDead || isProtectedLastTurn;

                                    if (currentStepRole.id === 'seer') isDisabled = isDead || isSelf;
                                    else if (currentStepRole.id === 'raven') isDisabled = isDead;
                                    else if (currentStepRole.id === 'fox') {
                                        // Fox can sniff anyone alive
                                    }
                                    else if (currentStepRole.id === 'simple-werewolf' || currentStepRole.id === 'big-bad-wolf') {
                                        const targetRole = getRole(player.roleId);
                                        // Standard wolves cannot kill other wolves/allies
                                        if (targetRole?.category === 'WEREWOLF' || player.isTransformed || player.roleId === 'white-wolf' || player.isWolfSide) isDisabled = true;
                                    }

                                    const isSelected = currentTargets.includes(player.id);
                                    let activeClass = 'bg-zinc-700 text-white';
                                    if (currentStepRole.category === 'WEREWOLF') activeClass = 'bg-red-900 border-red-600 text-red-100';
                                    if (currentStepRole.id === 'seer' || currentStepRole.id === 'fox') activeClass = 'bg-blue-900 border-blue-500 text-blue-100';
                                    if (isCupid) activeClass = 'bg-pink-900 border-pink-500 text-pink-100';
                                    if (currentStepRole.id === 'raven') activeClass = 'bg-purple-900 border-purple-500 text-purple-100';
                                    if (currentStepRole.id === 'salvager') activeClass = 'bg-blue-800 border-blue-400 text-blue-100';

                                    const originalIndex = players.findIndex(p => p.id === player.id);
                                    const avatarLabel = originalIndex >= 0 ? `J${originalIndex + 1}` : '??';

                                    return (
                                    <button key={player.id} disabled={isDisabled} onClick={() => toggleTarget(player.id, isCupid ? 3 : 1)} className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${isDisabled ? 'opacity-30 grayscale cursor-not-allowed bg-zinc-950 border-zinc-900' : ''} ${isSelected ? `${activeClass} scale-105` : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}>
                                        <div className="w-10 h-10 rounded-full bg-zinc-950 flex items-center justify-center font-serif font-bold text-sm border border-white/10 relative shrink-0">
                                            {avatarLabel}
                                            {isDead && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full"><Skull size={16} className="text-zinc-500"/></div>}
                                            {isProtectedLastTurn && !isDead && <div className="absolute inset-0 flex items-center justify-center bg-blue-900/40 rounded-full"><Shield size={16} className="text-blue-300"/></div>}
                                        </div>
                                        <span className="font-bold text-sm truncate w-full text-center">{player.name}</span>
                                        {isSelected && <div className="absolute top-2 right-2"><CheckCircle size={16} /></div>}
                                    </button>
                                    );
                                })}
                            </div>
                        )}
                        
                        <div className="mt-8 text-center pb-20">
                            {currentStepRole.id === 'cupid' && currentTargets.length >= 2 && <div className="mb-4 text-pink-400 text-sm font-bold animate-pulse">{currentTargets.length} amoureux sélectionnés</div>}
                            {currentStepRole.id !== 'witch' && (
                                <button onClick={() => { setCurrentTargets([]); setSpecialAction(null); }} className="text-zinc-600 text-sm hover:text-zinc-400 underline decoration-zinc-800 underline-offset-4">Réinitialiser / Aucune action</button>
                            )}
                        </div>
                    </div>
                </>
             )}
          </div>
        )}

        {/* 3. MORNING SUMMARY */}
        {phase === 'MORNING' && (
            <div className="flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-bottom-4 duration-500 bg-zinc-50 text-zinc-900 p-4">
                <div className="p-4 bg-orange-100 rounded-full mb-6 ring-1 ring-orange-200">
                    <Sun size={48} className="text-orange-500" />
                </div>
                <h2 className="text-4xl font-serif font-black text-center mb-2 text-zinc-900">Le Village se Réveille</h2>
                <p className="text-zinc-500 mb-8">Bilan de la Nuit {turnCount}</p>

                <div className="w-full max-w-md bg-white border border-zinc-200 rounded-xl overflow-hidden mb-8 shadow-sm">
                    {(() => {
                        const kills = nightEvents.filter(e => e.actionType === 'KILL' || e.actionType === 'WITCH_KILL');
                        const saves = nightEvents.filter(e => e.actionType === 'WITCH_SAVE' || e.actionType === 'SAVE'); // Include Salvager SAVE
                        const logsForMorning = logs.filter(l => l.turn === turnCount && l.phase === 'MATIN' && l.message.includes('Ours'));

                        let victims = new Set<string>();
                        kills.forEach(e => e.targetIds.forEach(id => victims.add(id)));
                        saves.forEach(e => e.targetIds.forEach(id => victims.delete(id)));
                        const deadPlayers = gamePlayers.filter(p => victims.has(p.id));

                        return (
                            <div className="divide-y divide-zinc-100">
                                {logsForMorning.map((l, i) => (
                                    <div key={`alert-${i}`} className="p-4 bg-yellow-50 flex items-center gap-3 text-yellow-800 font-bold border-b border-yellow-100">
                                        <AlertTriangle size={20} />
                                        <span>{l.message}</span>
                                    </div>
                                ))}

                                {deadPlayers.length === 0 ? (
                                    <div className="p-8 text-center text-green-600 font-serif">Aucune victime cette nuit !</div>
                                ) : (
                                    deadPlayers.map(p => {
                                        const cause = getDeathCause(p.id, 'MORNING');
                                        return (
                                            <div key={p.id} className="p-4 flex flex-col bg-red-50">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-zinc-900">{formatPlayer(p)}</span>
                                                    <span className="text-xs uppercase tracking-wider text-red-600 font-bold flex items-center gap-1"><HeartCrack size={14}/> Mort</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm text-zinc-600">
                                                    <span>{getRole(p.roleId)?.name}</span>
                                                    <span className="italic text-xs text-red-500">Cause : {cause}</span>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        );
                    })()}
                </div>
                
                {(() => {
                    const kills = nightEvents.filter(e => e.actionType === 'KILL' || e.actionType === 'WITCH_KILL');
                    const saves = nightEvents.filter(e => e.actionType === 'WITCH_SAVE' || e.actionType === 'SAVE');
                    let victims = new Set<string>();
                    kills.forEach(e => e.targetIds.forEach(id => victims.add(id)));
                    saves.forEach(e => e.targetIds.forEach(id => victims.delete(id)));
                    return (
                        <button onClick={() => processDeaths(Array.from(victims), 'MORNING')} className="px-8 py-4 bg-zinc-900 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-all">Lancer le Jour</button>
                    );
                })()}
            </div>
        )}

        {/* 4. DAY VOTE */}
        {phase === 'DAY_VOTE' && (
             <div className="flex-1 overflow-y-auto p-4 bg-zinc-50 pb-64">
                <header className="text-center py-6 mb-4">
                    <h2 className="text-3xl font-serif font-black text-zinc-900">Débats du Village</h2>
                    <p className="text-zinc-500">Qui les villageois souhaitent-ils éliminer ?</p>
                    {mayorDeathPending && (
                        <div className="mt-2 flex items-center justify-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 animate-pulse w-fit mx-auto">
                            <AlertOctagon size={16} />
                            <span className="text-sm font-bold">Le Maire est mort ! Désignez un successeur.</span>
                        </div>
                    )}
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {getAlivePlayers().map(p => {
                        const isSelected = voteCandidateId === p.id;
                        const isRavenTarget = ravenTargetId === p.id;
                        const originalIndex = players.findIndex(rawP => rawP.id === p.id);
                        const avatarLabel = originalIndex >= 0 ? `J${originalIndex + 1}` : '??';

                        return (
                        <div key={p.id} className={`flex items-center justify-between p-4 border rounded-lg transition-all ${isSelected ? 'bg-red-50 border-red-200 ring-2 ring-red-500/20' : 'bg-white border-zinc-200 hover:border-zinc-300'} ${p.isBannedFromVoting ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-sm text-zinc-500 relative shrink-0">
                                    {avatarLabel}
                                    {isRavenTarget && (
                                        <div className="absolute -top-1 -right-1 bg-purple-600 text-white rounded-full p-0.5 border border-white" title="Malédiction du Corbeau (+2 votes)">
                                            <AlertTriangle size={10} />
                                        </div>
                                    )}
                                    {p.isMayor && (
                                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 rounded-full p-0.5 border border-white shadow-sm z-10">
                                            <Crown size={12} fill="currentColor" />
                                        </div>
                                    )}
                                    {p.isBannedFromVoting && (
                                        <div className="absolute top-0 left-0 w-full h-full bg-black/50 rounded-full flex items-center justify-center">
                                            <Ban size={24} className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-zinc-800">{p.name}</span>
                                    <div className="flex items-center gap-2">
                                        {isRavenTarget && <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-1 rounded w-fit">+2 Votes (Corbeau)</span>}
                                        {p.isBannedFromVoting && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1 rounded w-fit">Vote Interdit</span>}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); handleSetMayor(p.id); }} className={`p-2 rounded-full transition-colors ${p.isMayor ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-zinc-300 hover:text-yellow-400 hover:bg-zinc-50'}`} title={p.isMayor ? "Est le Maire" : "Nommer Maire"}>
                                    <Crown size={20} fill={p.isMayor ? "currentColor" : "none"} />
                                </button>
                                {isSelected ? (
                                    <button onClick={() => processDeaths([p.id], 'EVENING')} className="px-4 py-2 bg-red-600 text-white rounded shadow-lg hover:bg-red-700 transition-all text-sm font-bold flex items-center gap-2 animate-in fade-in zoom-in">
                                    <Skull size={16} /> Confirmer
                                    </button>
                                ) : (
                                    <button onClick={() => setVoteCandidateId(p.id)} className="px-4 py-2 bg-zinc-100 text-zinc-600 border border-zinc-200 rounded hover:bg-zinc-200 hover:text-zinc-900 transition-all text-sm font-bold flex items-center gap-2">
                                    <Gavel size={16} /> Voter
                                    </button>
                                )}
                            </div>
                        </div>
                        )})}
                </div>
                
                <div className="mt-8 max-w-2xl mx-auto flex flex-col gap-3">
                    <button onClick={() => startNextNight()} className="w-full py-4 bg-zinc-100 text-zinc-500 font-bold rounded-lg hover:bg-zinc-200 hover:text-zinc-800 transition-all flex items-center justify-center gap-2">
                        <span>Passer la nuit sans vote</span>
                        <Moon size={18} />
                    </button>
                    
                    {/* SCAPEGOAT BUTTON */}
                    {gamePlayers.some(p => p.roleId === 'scapegoat' && p.status === 'ALIVE') && (
                        <button onClick={handleScapegoatAction} className="w-full py-3 bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 hover:bg-indigo-200 transition-all flex items-center justify-center gap-2">
                            <Scale size={18} />
                            <span>Égalité de votes (Bouc Émissaire)</span>
                        </button>
                    )}
                </div>
             </div>
        )}

        {/* 5. HUNTER ACTION */}
        {phase === 'HUNTER_ACTION' && (
          <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-300 bg-red-950/20 text-red-50 p-10">
            <div className="p-6 bg-red-900/40 rounded-full mb-6 ring-4 ring-red-900/20">
                <Crosshair size={64} className="text-red-500" />
            </div>
            <h2 className="text-4xl font-serif font-black text-red-500 mb-2">Le Chasseur est Mort !</h2>
            <p className="text-zinc-400 mb-8 max-w-md text-center">Avant de rendre son dernier soupir, le Chasseur tire une balle réflexe. Qui emporte-t-il dans la tombe ?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl px-4">
                {getAlivePlayers().map(p => (
                   <button key={p.id} onClick={() => handleHunterShot(p.id)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-red-900 hover:border-red-600 hover:text-white transition-all group">
                      <div className="font-bold text-lg mb-1 text-zinc-200">{formatPlayer(p)}</div>
                      <div className="text-xs text-zinc-500 group-hover:text-red-200">Cibler</div>
                   </button>
                ))}
            </div>
          </div>
        )}

        {/* 5.1 SCAPEGOAT BAN PHASE */}
        {phase === 'SCAPEGOAT_BAN' && (
             <div className="flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-500 p-4">
                 <div className="p-6 bg-indigo-900/30 rounded-full mb-6 ring-4 ring-indigo-500/20">
                     <Scale size={64} className="text-indigo-500" />
                 </div>
                 <h2 className="text-3xl font-serif text-zinc-200 mb-2">Le Dernier Mot du Bouc</h2>
                 <p className="text-zinc-500 mb-8 max-w-md text-center">
                     Avant de mourir, le Bouc Émissaire peut désigner les joueurs qui seront <strong>interdits de vote</strong> au prochain jour.
                 </p>
                 
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl mb-8">
                     {getAlivePlayers().map(p => {
                         const isSelected = currentTargets.includes(p.id);
                         return (
                             <button 
                                 key={p.id} 
                                 onClick={() => toggleTarget(p.id, 99)} 
                                 className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${isSelected ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                             >
                                 <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center font-bold text-xs">{formatPlayer(p).split(' ')[0]}</div>
                                 <span className="font-bold text-sm truncate w-full text-center">{p.name}</span>
                                 {isSelected && <Ban size={16} className="text-white" />}
                             </button>
                         )
                     })}
                 </div>

                 <button onClick={confirmScapegoatBan} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full shadow-lg transition-all flex items-center gap-2">
                     <CheckCircle size={20} />
                     Confirmer les Interdictions
                 </button>
             </div>
        )}

        {/* BOTTOM FIXED AREA: CONTROLS & LOGS */}
        {phase !== 'VICTORY' && phase !== 'SCAPEGOAT_BAN' && (
             <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col shadow-2xl pointer-events-none">
                
                {/* 1. NEXT STEP CONTROLS (NIGHT ONLY) */}
                {phase === 'NIGHT' && currentStepRole && (
                    <div className="p-4 bg-zinc-950 border-t border-zinc-900 pointer-events-auto">
                        <div className="max-w-2xl mx-auto flex justify-between items-center">
                            <span className="text-zinc-600 text-xs font-mono">Étape {currentStepIndex + 1} / {nightSequence.length}</span>
                            
                            {currentStepRole.id === 'cupid' ? (
                                <button onClick={handleNextStep} disabled={currentTargets.length < 2} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors ${currentTargets.length >= 2 ? 'bg-pink-600 text-white hover:bg-pink-500' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}>Lier les Amoureux <Heart size={18} fill="currentColor" /></button>
                            ) : currentStepRole.id === 'fox' ? (
                                <button onClick={handleNextStep} disabled={currentTargets.length !== 1} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors ${currentTargets.length === 1 ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}>
                                    Flairer <Search size={18} />
                                </button>
                            ) : (
                                <button onClick={handleNextStep} className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2">Suivant <ArrowRight size={18} /></button>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. LOGS */}
                {logs.length > 0 && phase !== 'HUNTER_ACTION' && (
                    <div className="bg-white border-t border-zinc-200 max-h-40 sm:max-h-60 flex flex-col pointer-events-auto">
                        <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 border-b border-zinc-100">
                            <div className="flex items-center gap-2 text-zinc-500 font-serif font-bold text-xs uppercase tracking-widest">
                                <History size={14} /> Journal de la partie
                            </div>
                        </div>
                        <div ref={logContainerRef} className="overflow-y-auto p-4 space-y-2 flex-1 scroll-smooth">
                            {logs.map((log, i) => (
                                <div key={i} className={`text-sm p-2 rounded border-l-4 flex gap-2 ${log.phase === 'MATIN' ? 'bg-orange-50 border-orange-300 text-zinc-700' : 'bg-indigo-50 border-indigo-300 text-zinc-700'}`}>
                                    <span className="font-bold text-xs uppercase min-w-[60px] text-zinc-400 mt-0.5">
                                        {log.phase} J{log.turn}
                                    </span>
                                    <span className="flex-1">{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
             </div>
        )}

        {/* 6. IMMERSIVE VICTORY SCREEN */}
        {phase === 'VICTORY' && winner && (
            <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center animate-in zoom-in-95 duration-1000 overflow-hidden">
                {/* Background Ambience */}
                <div className={`absolute inset-0 opacity-30 ${winner.type === 'VILLAGE' ? 'bg-gradient-to-br from-green-900 to-blue-900' : 'bg-gradient-to-br from-red-900 to-black'}`}></div>
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-6">
                    <Trophy size={100} className={`mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] ${winner.type === 'VILLAGE' ? 'text-yellow-400' : 'text-red-500'}`} />
                    
                    <h1 className="text-5xl md:text-7xl font-serif font-black text-center mb-4 tracking-tighter uppercase drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400">
                        {winner.label}
                    </h1>
                    <h2 className="text-2xl text-zinc-400 font-serif mb-12 tracking-widest uppercase">Remporte la partie</h2>
                    
                    <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 w-full shadow-2xl">
                        <h3 className="text-zinc-500 uppercase tracking-widest text-xs font-bold mb-6 text-center border-b border-zinc-800 pb-2">
                            Survivants ({winner.survivors.length})
                        </h3>
                        
                        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar mb-8 pr-2">
                            {winner.survivors.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-4 bg-zinc-950/80 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                    <span className="font-bold text-lg text-zinc-200 font-serif">{formatPlayer(p)}</span>
                                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                                        getRole(p.roleId)?.category === 'WEREWOLF' 
                                            ? 'bg-red-900/30 text-red-400 border border-red-900/50' 
                                            : 'bg-blue-900/30 text-blue-400 border border-blue-900/50'
                                    }`}>
                                        {getRole(p.roleId)?.name}
                                    </span>
                                </div>
                            ))}
                            {winner.survivors.length === 0 && <div className="text-center text-zinc-500 italic py-4">Le silence règne sur le village...</div>}
                        </div>
                        
                        <div className="flex gap-4">
                            <button onClick={onRestart} className="flex-1 py-4 bg-zinc-100 text-zinc-950 font-bold rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg">
                                <RefreshCw size={20} /> Recommencer
                            </button>
                            <button onClick={onNewGame} className="flex-1 py-4 bg-zinc-800 text-zinc-300 font-bold rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
                                <Users size={20} /> Nouvelle Partie
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default GameManager;