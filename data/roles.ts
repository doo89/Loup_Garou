import { Role } from '../types';

export const ROLES_DATA: Role[] = [
  // ==========================================
  // AMBIGUS / CHOIX DE DÉPART (Priorité 0-15)
  // ==========================================
  {
    id: 'comedian',
    name: 'Le Comédien',
    description: 'Choisit chaque nuit d\'incarner un des 3 rôles spéciaux mis de côté.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    requiresExtras: true,
    wakeUpPriority: 5
  },
  {
    id: 'thief',
    name: 'Le Voleur',
    description: 'Peut échanger sa carte avec une des deux cartes non distribuées au début.',
    category: 'AMBIGUOUS',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Base',
    wakeUpPriority: 10
  },
  {
    id: 'wolf-dog',
    name: 'Le Chien-Loup',
    description: 'Au début de la partie, choisit s\'il devient Loup-Garou ou reste Simple Villageois.',
    category: 'AMBIGUOUS',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 15
  },

  // ==========================================
  // LES AMOUREUX (Priorité 20)
  // ==========================================
  {
    id: 'cupid',
    name: 'Cupidon',
    description: 'Désigne deux amoureux au début de la partie qui devront survivre ensemble.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Base',
    wakeUpPriority: 20
  },

  // ==========================================
  // INFORMATION / PROTECTION (Priorité 30-49)
  // ==========================================
  {
    id: 'salvager',
    name: 'Le Salvateur',
    description: 'Se réveille chaque nuit pour protéger un joueur de l\'attaque des Loups.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 35
  },
  {
    id: 'seer',
    name: 'La Voyante',
    description: 'Découvre le rôle exact d\'un joueur de son choix chaque nuit.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Base',
    wakeUpPriority: 40
  },
  {
    id: 'fox',
    name: 'Le Renard',
    description: 'Peut flairer un groupe de 3 joueurs pour savoir s\'il contient un Loup. Perd son pouvoir s\'il se trompe.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 45
  },
  {
    id: 'bear-tamer',
    name: 'Le Montreur d\'Ours',
    description: 'Si un Loup est son voisin direct, l\'ours grogne au réveil du village.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 0
  },

  // ==========================================
  // FRATRIES (Priorité 50)
  // ==========================================
  {
    id: 'two-sisters',
    name: 'Les Deux Sœurs',
    description: 'Deux joueuses qui se connaissent et se réveillent ensemble la nuit pour parlementer.',
    category: 'VILLAGER',
    countValue: 2,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 50
  },
  {
    id: 'three-brothers',
    name: 'Les Trois Frères',
    description: 'Trois joueurs qui se connaissent et se réveillent ensemble la nuit pour parlementer.',
    category: 'VILLAGER',
    countValue: 3,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 50
  },

  // ==========================================
  // TRAÎTRES ET LOUPS (Priorité 60-90)
  // ==========================================
  {
    id: 'wild-child',
    name: 'L\'Enfant Sauvage',
    description: 'Choisit un modèle au début. Si le modèle meurt, il devient Loup-Garou.',
    category: 'AMBIGUOUS',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 60
  },
  {
    id: 'simple-werewolf',
    name: 'Loup-Garou',
    description: 'Se réveille la nuit pour dévorer un Villageois. Doit passer inaperçu le jour.',
    category: 'WEREWOLF',
    countValue: 1,
    maxQuantity: -1,
    expansion: 'Base',
    wakeUpPriority: 70
  },
  {
    id: 'big-bad-wolf',
    name: 'Le Grand Méchant Loup',
    description: 'Mange une deuxième victime tant qu\'aucun Loup-Garou n\'est mort.',
    category: 'WEREWOLF',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 80
  },
  {
    id: 'infected-father',
    name: 'L\'Infect Père des Loups',
    description: 'Peut transformer la victime des loups en Loup-Garou (une seule fois).',
    category: 'WEREWOLF',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 75
  },
  {
    id: 'white-wolf',
    name: 'Le Loup-Garou Blanc',
    description: 'Loup-Garou solitaire. Peut tuer un autre Loup-Garou une nuit sur deux.',
    category: 'LONER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 90
  },

  // ==========================================
  // ACTIONS FIN DE NUIT (Priorité 100-110)
  // ==========================================
  {
    id: 'witch',
    name: 'La Sorcière',
    description: 'Possède deux potions (vie et mort) à usage unique.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Base',
    wakeUpPriority: 100
  },
  {
    id: 'raven',
    name: 'Le Corbeau',
    description: 'Peut désigner un suspect chaque nuit qui aura 2 voix contre lui au vote.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Nouvelle Lune',
    wakeUpPriority: 105
  },
  {
    id: 'piper',
    name: 'Le Joueur de Flûte',
    description: 'Ennemi solitaire. Charme deux joueurs par nuit. Gagne si tous les vivants sont charmés.',
    category: 'LONER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Nouvelle Lune',
    wakeUpPriority: 110
  },
  {
    id: 'pyromaniac',
    name: 'Le Pyromane',
    description: 'Peut brûler un bâtiment une fois par partie, tuant son occupant. Gagne s\'il est le dernier.',
    category: 'LONER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Le Village',
    wakeUpPriority: 108
  },

  // ==========================================
  // RÔLES PASSIFS OU DÉCLENCHÉS (Priorité 0)
  // ==========================================
  {
    id: 'hunter',
    name: 'Le Chasseur',
    description: 'S\'il meurt, il a le pouvoir d\'éliminer immédiatement un autre joueur.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Base',
    wakeUpPriority: 0
  },
  {
    id: 'elder',
    name: 'L\'Ancien',
    description: 'Résiste à la première attaque des Loups. S\'il est tué par le village, tous perdent leurs pouvoirs.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 0
  },
  {
    id: 'idiot',
    name: 'L\'Idiot du Village',
    description: 'S\'il est voté par le village, il ne meurt pas mais perd son droit de vote.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 0
  },
  {
    id: 'scapegoat',
    name: 'Le Bouc Émissaire',
    description: 'En cas d\'égalité parfaite au vote du village, c\'est lui qui meurt automatiquement.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 0
  },
  {
    id: 'rusty-knight',
    name: 'Le Chevalier à l\'épée rouillée',
    description: 'S\'il est mangé par les Loups, le premier Loup à sa gauche meurt le lendemain de tétanos.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 0
  },
  {
    id: 'little-girl',
    name: 'La Petite Fille',
    description: 'Peut entrouvrir les yeux pendant le tour des Loups-Garous pour les espionner.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Base',
    wakeUpPriority: 0
  },
  {
    id: 'stuttering-judge',
    name: 'Le Juge Bègue',
    description: 'Peut déclencher un deuxième vote immédiat une fois dans la partie.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 0
  },
  {
    id: 'angel',
    name: 'L\'Ange',
    description: 'Son but est de se faire éliminer au premier vote du village ou par les Loups la première nuit.',
    category: 'LONER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 0
  },
  {
    id: 'devoted-servant',
    name: 'La Servante Dévouée',
    description: 'Peut échanger son rôle avec celui d\'un joueur qui vient de mourir (avant révélation).',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 0
  },
  {
    id: 'scandalmonger',
    name: 'L\'Abominable Sectaire',
    description: 'Divise le village en deux clans. Gagne si son clan l\'emporte.',
    category: 'LONER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Personnages',
    wakeUpPriority: 0
  },
  {
    id: 'gypsy',
    name: 'La Gitane',
    description: 'Permet d\'inclure des cartes Spiritisme (Nouvelle Lune) dans la partie.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Nouvelle Lune',
    wakeUpPriority: 0
  },
  {
    id: 'confessor',
    name: 'Le Confesseur',
    description: 'Peut obliger un joueur à lui montrer sa carte (une fois par partie).',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Le Village',
    wakeUpPriority: 0
  },
  {
    id: 'bone-setter',
    name: 'Le Rebouteux',
    description: 'Peut rendre son pouvoir unique à un joueur qui l\'a déjà utilisé.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Le Village',
    wakeUpPriority: 0
  },
  {
    id: 'school-teacher',
    name: 'L\'Institutrice',
    description: 'Peut interdire à deux joueurs de voter pendant ce tour.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: 1,
    expansion: 'Le Village',
    wakeUpPriority: 0
  },
  {
    id: 'simple-villager',
    name: 'Simple Villageois',
    description: 'N\'a pas de pouvoir particulier, mais son vote est essentiel.',
    category: 'VILLAGER',
    countValue: 1,
    maxQuantity: -1,
    expansion: 'Base',
    wakeUpPriority: 0
  }
];