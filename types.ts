export interface Player {
  id: string;
  name: string;
}

export type RoleCategory = 'WEREWOLF' | 'VILLAGER' | 'LONER' | 'AMBIGUOUS';

export interface Role {
  id: string;
  name: string;
  description?: string;
  category: RoleCategory;
  countValue: number;
  maxQuantity: number;
  expansion: string;
  isExtra?: boolean;
  requiresExtras?: boolean;
  wakeUpPriority: number; // 0 = Passive/Start, 1-100 = Night Order
}

export type PlayerStatus = 'ALIVE' | 'DEAD';

export interface AssignedPlayer extends Player {
  roleId: string;
  status: PlayerStatus;
  roleModelId?: string; // Pour l'Enfant Sauvage
  isTransformed?: boolean; // Si l'Enfant Sauvage est devenu loup
  isWolfSide?: boolean; // Si le Chien-Loup a choisi le camp des loups
  isPowerLost?: boolean; // Pour le Renard (si a échoué) ou l'Ancien (malédiction)
  loverId?: string; // Pour Cupidon (stocke l'ID de l'autre amoureux, ou un tag de groupe)
  isCharmed?: boolean; // Pour le Joueur de Flûte
  isMayor?: boolean; // Si le joueur est le Maire
  isBannedFromVoting?: boolean; // Pour le Bouc Émissaire
}

export interface GameLog {
  turn: number;
  phase: 'MATIN' | 'SOIR' | 'NUIT';
  message: string;
  deadPlayerIds: string[];
}

export interface GameEvent {
  roleId: string; // Qui a agi (ex: 'witch')
  actionType: 'KILL' | 'SAVE' | 'PEEK' | 'LINK' | 'TRANSFORM' | 'WITCH_KILL' | 'WITCH_SAVE' | 'CURSE' | 'SNIFF' | 'INFECT' | 'BAN_VOTE';
  targetIds: string[]; // Qui a été ciblé
}

export type VictoryType = 'VILLAGE' | 'WEREWOLVES' | 'LOVER' | 'SOLO' | null;

export interface GameState {
  players: Player[];
  selectedRoles: Record<string, number>;
  comedianExtras: string[];
  currentPhase: 'PLAYERS' | 'ROLES' | 'GAME';
}