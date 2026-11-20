/* Unit 5 make-up summative test (absent students): same parts, same skills, other questions.
   Questions only: the answer key is kept on the server (tej2o_exam_keys, "sommative5r"). */
export const EXAMEN = {
  id: 'sommative5r',
  titre: 'Unité 5 : Les algorithmes (reprise)',
  duree: 75,
  consignes: [
    'Lis chaque question attentivement. Pour les choix multiples, choisis une seule réponse.',
    'Dans les algorithmes, ← veut dire « reçoit une valeur ». Les lignes décalées font partie du bloc au-dessus.',
    'Dans la partie D, le pseudocode utilise les mots clés Lire, Afficher, Si, Sinon Si, Sinon, FinSi, Pour, FinPour. En Python : input, int, print, if / elif / else, for et range, avec les deux-points et l’indentation (4 espaces).'
  ],
  parties: [
    { id: 'A', titre: 'Connaissance et compréhension', consigne: 'Choix multiples : choisis une seule réponse.', questions: [
      { n: 1, type: 'qcm', texte: 'Dans un algorithme, une boucle permet de :', opts: ['Choisir entre deux chemins', 'Répéter des instructions plusieurs fois', 'Donner un nom à une valeur', 'Afficher un message à l’écran'] },
      { n: 2, type: 'qcm', texte: 'Un élève reçoit une médaille seulement si sa note est de 90 ou plus. Quel élément de l’algorithme décide s’il reçoit la médaille ?', opts: ['Une boucle', 'Un compteur', 'Une entrée (input)', 'Une condition'] },
      { n: 3, type: 'qcm', texte: 'Laquelle de ces affirmations sur les variables est correcte ?', opts: ['Une variable garde toujours sa première valeur', 'Le nom d’une variable peut contenir des espaces', 'La valeur d’une variable peut changer pendant l’algorithme', 'Une variable ne peut contenir que du texte'] },
      { n: 4, type: 'qcm', texte: 'Si N = 4, combien de fois la boucle suivante s’exécute-t-elle ?', code: 'Pour i de 0 à N\n    Afficher(i)\nFinPour', opts: ['3', '4', '5', '6'] },
      { n: 5, type: 'qcm', texte: 'Pour additionner 20 nombres lus au clavier, de quoi a-t-on besoin ?', opts: ['D’une boucle et d’une variable total qui commence à 0', 'De 20 conditions Si', 'D’une seule instruction Lire', 'D’une boucle TantQue qui ne s’arrête jamais'] },
      { n: 6, type: 'qcm', texte: 'Quelle condition vérifie que N est plus petit que 0 ou plus grand que 100 ?', opts: ['N < 0 ET N > 100', 'N < 0 OU N > 100', 'N >= 0 ET N <= 100', 'N > 0 OU N < 100'] },
      { n: 7, type: 'qcm', texte: 'Quelle structure convient le mieux pour redemander un mot de passe tant qu’il est faux ?', opts: ['Une boucle Pour de 1 à 3', 'Une condition Si seulement', 'Une boucle TantQue', 'Aucune boucle'] },
      { n: 8, type: 'qcm', texte: 'Que fait Sinon dans une structure Si… Sinon ?', opts: ['Il s’exécute quand la condition du Si est fausse', 'Il répète le bloc Si', 'Il ajoute une deuxième condition', 'Il arrête l’algorithme'] }
    ] },
    { id: 'B', titre: 'Mise en application', consigne: 'Choix multiples : lis l’algorithme, puis réponds.', questions: [
      { n: 9, type: 'qcm', texte: 'Quel est le problème dans cet algorithme ?', code: 'Lire A\nLire B\nSi A > B\n    Afficher("A est plus grand")\nFinSi\nSi A > B\n    Afficher("B est plus grand")\nFinSi', opts: ['Il manque un Lire', 'La deuxième condition devrait être B > A', 'Il faut remplacer Si par Pour', 'Afficher doit être placé avant Lire'] },
      { n: 10, type: 'qcm', texte: 'Cet algorithme doit afficher combien de nombres positifs ont été lus. Que lui manque-t-il ?', code: 'compteur ← 0\nPour i de 1 à 10\n    Lire X\n    Si X > 0\n        compteur ← compteur + 1\n    FinSi\nFinPour', opts: ['compteur doit commencer à 1', 'Il manque Lire X avant la boucle', 'Il faut un Sinon', 'Il manque Afficher(compteur) après FinPour'] },
      { n: 11, type: 'qcm', texte: 'Qu’affiche cet algorithme ?', code: 'x ← 3\nx ← x + 2\nx ← x × 2\nAfficher(x)', opts: ['7', '10', '8', '3'] },
      { n: 12, type: 'qcm', texte: 'L’utilisateur entre 18. Qu’affiche cet algorithme ?', code: 'Lire age\nSi age >= 65\n    Afficher("Tarif aîné")\nSinon Si age >= 18\n    Afficher("Tarif adulte")\nSinon\n    Afficher("Tarif jeune")\nFinSi', opts: ['Tarif jeune', 'Rien', 'Tarif adulte', 'Tarif aîné'] },
      { n: 13, type: 'qcm', texte: 'Qu’affiche cet algorithme ?', code: 'total ← 0\nTantQue total < 10\n    total ← total + 3\nFinTantQue\nAfficher(total)', opts: ['9', '10', '12', '3'] }
    ] },
    { id: 'C', titre: 'Habiletés de la pensée', consigne: 'Les étapes sont mélangées. Pour chaque rang, choisis la lettre de l’étape, de la première à la dernière.', questions: [
      { n: 14, type: 'ordre', texte: 'Algorithme qui lit un nombre N et affiche « Positif », « Négatif » ou « Zéro ».', etapes: ['Sinon', 'Afficher("Négatif")', 'Lire N', 'FinSi', 'Si N > 0', 'Afficher("Zéro")', 'Afficher("Positif")', 'Sinon Si N < 0'] },
      { n: 15, type: 'ordre', texte: 'Algorithme qui lit N notes et affiche leur moyenne.', etapes: ['moyenne ← somme / N', 'Lire note', 'FinPour', 'somme ← 0', 'Afficher(moyenne)', 'Pour i de 1 à N', 'Lire N', 'somme ← somme + note'] }
    ] },
    { id: 'D', titre: 'Écrire des algorithmes et des programmes', consigne: 'Pseudocode et Python. Indente les lignes qui sont dans un bloc (Si, Pour, if, for…) : touche Tab = 4 espaces.', questions: [
      { n: 16, type: 'pseudo', texte: 'Écris un algorithme qui lit le prix d’un article et la somme donnée par le client. Si la somme suffit, il affiche la monnaie à rendre ; sinon, il affiche « Somme insuffisante ».' },
      { n: 17, type: 'python', texte: 'Écris un programme Python qui demande 8 nombres et affiche combien d’entre eux sont plus grands que 50.', exemple: '60\n20\n51\n50\n90\n10\n75\n3' },
      { n: 18, type: 'python', texte: 'Écris un programme Python qui demande une température en °C. Il affiche « Froid » si elle est plus petite que 10, « Chaud » si elle est de 25 ou plus, sinon « Doux ».', exemple: '18' }
    ] }
  ]
};
export const LETTRES = 'ABCDEFGHI';
