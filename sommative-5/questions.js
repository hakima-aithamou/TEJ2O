/* Unit 5 summative test: questions only. The answer key is kept on the server (tej2o_exam_keys)
   and is never sent to the students' browsers. */
export const EXAMEN = {
  id: 'sommative5',
  titre: 'Unité 5 : Les algorithmes',
  duree: 75,
  consignes: [
    'Lis chaque question attentivement. Pour les choix multiples, choisis une seule réponse.',
    'Dans les algorithmes, ← veut dire « reçoit une valeur ». Les lignes décalées font partie du bloc au-dessus.',
    'Dans la partie D, le pseudocode utilise les mots clés Lire, Afficher, Si, Sinon Si, Sinon, FinSi, Pour, FinPour. En Python : input, int, print, if / elif / else, for et range, avec les deux-points et l’indentation (4 espaces).'
  ],
  parties: [
    { id: 'A', titre: 'Connaissance et compréhension', consigne: 'Choix multiples : choisis une seule réponse.', questions: [
      { n: 1, type: 'qcm', texte: 'Dans un algorithme, une condition permet de :', opts: ['Répéter une action un nombre fixe de fois', 'Exécuter une action seulement si une règle est vraie', 'Arrêter immédiatement l’algorithme', 'Ajouter des couleurs dans un programme'] },
      { n: 2, type: 'qcm', texte: 'Une alarme sonne seulement si la porte est ouverte ET qu’il est plus tard que 22 h. Quel élément de l’algorithme décide si l’alarme doit sonner ?', opts: ['Une boucle', 'Une variable', 'Une condition', 'Une sortie (output)'] },
      { n: 3, type: 'qcm', texte: 'Laquelle de ces affirmations sur les variables est correcte ?', opts: ['Une variable peut seulement contenir des nombres', 'Une variable doit recevoir une valeur avant d’être utilisée', 'Une variable change automatiquement de valeur dans une boucle', 'Une variable ne peut pas être utilisée dans une condition'] },
      { n: 4, type: 'qcm', texte: 'Si N = 5, combien de fois la boucle suivante s’exécute-t-elle ?', code: 'Pour i de 1 à N\n    Afficher(i)\nFinPour', opts: ['4', '5', '6', '1'] },
      { n: 5, type: 'qcm', texte: 'Pour compter combien de nombres pairs il y a parmi 10 nombres lus, quelle approche est la plus adaptée ?', opts: ['Placer une boucle à l’intérieur d’une condition', 'Placer une condition à l’intérieur d’une boucle', 'Utiliser seulement une suite Si… Sinon Si… Sinon', 'Utiliser deux boucles l’une dans l’autre'] },
      { n: 6, type: 'qcm', texte: 'Quelle condition vérifie que N est compris entre 10 et 20, 10 et 20 inclus ?', opts: ['N > 10 ET N < 20', 'N >= 10 ET N <= 20', 'N >= 10 OU N <= 20', 'N > 20 ET N < 10'] },
      { n: 7, type: 'qcm', texte: 'Dans quel cas est-il préférable d’utiliser une boucle TantQue plutôt qu’une boucle Pour ?', opts: ['Lorsque le nombre de répétitions est connu d’avance', 'Lorsque la boucle doit continuer tant qu’une condition est vraie', 'Lorsqu’on doit répéter exactement 10 fois', 'Lorsqu’on veut afficher les nombres de 1 à 100'] },
      { n: 8, type: 'qcm', texte: 'Quelle structure permet de tester plusieurs cas l’un après l’autre ?', opts: ['Une boucle Pour', 'Une structure Si… Sinon Si… Sinon', 'Une boucle TantQue', 'Une variable compteur'] }
    ] },
    { id: 'B', titre: 'Mise en application', consigne: 'Choix multiples : lis l’algorithme, puis réponds.', questions: [
      { n: 9, type: 'qcm', texte: 'Quel est le problème dans cet algorithme ?', code: 'N ← 0\nAfficher("Entrez un nombre entre 1 et 3")\nTantQue N < 1 ET N > 3\n    Afficher("Le nombre n’est pas entre 1 et 3")\n    Lire N\nFinTantQue', opts: ['Il manque un Lire dans la boucle', 'La condition est impossible : la boucle ne s’exécute jamais', 'Le TantQue devrait être un Pour', 'La première ligne doit être N ← 1'] },
      { n: 10, type: 'qcm', texte: 'Quelle erreur contient cet algorithme ?', code: 'Afficher("Entrez votre âge :")\nSi age >= 18\n    Afficher("Accès autorisé")\nFinSi', opts: ['Il manque Lire age après la question', 'Il faut remplacer Si par TantQue', 'Le message doit être écrit sans guillemets', 'Un Si doit toujours avoir un Sinon'] },
      { n: 11, type: 'qcm', texte: 'Quel est le problème dans cet algorithme ?', code: 'Si X > 10\n    Afficher("Grand nombre")\n    Lire X\nFinSi', opts: ['La condition est incorrecte', 'Lire X doit être placé avant le Si', 'Le Si doit utiliser OU', 'FinSi doit être placé avant Lire X'] },
      { n: 12, type: 'qcm', texte: 'Trouve l’erreur dans cet algorithme.', code: 'Lire note\nSi note >= 90\n    Afficher("Excellent")\nSinon note >= 75\n    Afficher("Bien")\nSinon\n    Afficher("Faible")\nFinSi', opts: ['La variable note n’est pas lue', 'Si doit être remplacé par TantQue', 'Le premier Sinon devrait être Sinon Si', 'Le dernier Sinon devrait avoir une condition'] },
      { n: 13, type: 'qcm', texte: 'Cet algorithme doit afficher la somme 1 + 2 + 3 + 4 + 5. Que lui manque-t-il ?', code: 'total ← 0\nPour i de 1 à 5\n    total ← total + i\nFinPour', opts: ['total doit commencer à 1', 'Il manque un Lire dans la boucle', 'Il manque Afficher(total) après FinPour', 'Il manque Afficher(total) avant FinPour'] }
    ] },
    { id: 'C', titre: 'Habiletés de la pensée', consigne: 'Les étapes sont mélangées. Pour chaque rang, choisis la lettre de l’étape, de la première à la dernière.', questions: [
      { n: 14, type: 'ordre', texte: 'Algorithme qui lit deux nombres A et B et affiche le plus grand.', etapes: ['Afficher("B est le plus grand")', 'Si A > B', 'FinSi', 'Lire A et B', 'Sinon', 'Afficher("A est le plus grand")'] },
      { n: 15, type: 'ordre', texte: 'Algorithme qui lit N nombres et compte combien sont plus grands que 50.', etapes: ['FinPour', 'Si X > 50', 'Lire N', 'Afficher(compteur)', 'compteur ← compteur + 1', 'Pour i de 1 à N', 'FinSi', 'compteur ← 0', 'Lire X'] }
    ] },
    { id: 'D', titre: 'Écrire des algorithmes et des programmes', consigne: 'Pseudocode et Python. Indente les lignes qui sont dans un bloc (Si, Pour, if, for…) : touche Tab = 4 espaces.', questions: [
      { n: 16, type: 'pseudo', texte: 'Écris un algorithme qui lit trois notes, calcule leur moyenne et l’affiche. Ensuite, il affiche « Réussi » si la moyenne est de 50 ou plus, sinon « Échec ».' },
      { n: 17, type: 'python', texte: 'Écris un programme Python qui demande 10 nombres et affiche combien d’entre eux sont pairs. Aide : en Python, un nombre x est pair si x % 2 == 0.', exemple: '4\n7\n10\n3\n8\n1\n2\n9\n6\n5' },
      { n: 18, type: 'python', texte: 'Écris un programme Python qui demande l’âge de l’utilisateur. Il affiche « Tarif enfant » si l’âge est plus petit que 12, « Tarif aîné » si l’âge est de 65 ou plus, sinon « Tarif régulier ».', exemple: '15' }
    ] }
  ]
};
export const LETTRES = 'ABCDEFGHI';
