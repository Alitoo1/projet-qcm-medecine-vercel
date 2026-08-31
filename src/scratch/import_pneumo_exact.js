const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/^Page \d+:Ataraxie/i, '')
    .replace(/^Page \d+/i, '')
    .replace(/^-- \d+ of \d+ --/i, '')
    .replace(/: Ataraxie/gi, '')
    .replace(/Ataraxie/gi, '')
    .replace(/^>\s*/gm, '')
    .replace(/🏥/g, '')
    .replace(/ℹ️/g, '')
    .replace(/\*\*/g, '')
    .replace(/(^|\s)\*([^\*]+)\*(\s|$)/g, '$1$2$3')
    .replace(/\*/g, '')
    .trim();
}

function createBlocks(baseEnonce, rawProps) {
  const total = rawProps.length;
  if (total <= 6) {
    const chunk = rawProps.map((p, idx) => ({
      i: idx,
      t: cleanText(p.replace(/^[A-Z0-9]{1,2}[\.\-\)]\s*/i, '')),
      c: false
    }));
    if (chunk.length === 3) {
      chunk.push({
        i: 3,
        t: "Aucune des réponses ci-dessus n'est juste",
        c: false
      });
    }
    return [{
      enonce: baseEnonce,
      propositions: chunk
    }];
  }

  let numBlocks = Math.ceil(total / 5);
  while (total / numBlocks < 3.5 && numBlocks > 1) numBlocks--;

  const result = [];
  let remaining = total;
  let offset = 0;

  for (let b = 0; b < numBlocks; b++) {
    const blocksLeft = numBlocks - b;
    let chunkSize = Math.ceil(remaining / blocksLeft);
    if (chunkSize > 5) chunkSize = 5;

    const chunk = rawProps.slice(offset, offset + chunkSize).map((p, idx) => ({
      i: idx,
      t: cleanText(p.replace(/^[A-Z0-9]{1,2}[\.\-\)]\s*/i, '')),
      c: false
    }));

    if (chunk.length === 3) {
      chunk.push({
        i: 3,
        t: "Aucune des réponses ci-dessus n'est juste",
        c: false
      });
    }

    result.push({
      enonce: `${baseEnonce} (bloc ${b + 1}/${numBlocks})`,
      propositions: chunk
    });

    offset += chunkSize;
    remaining -= chunkSize;
  }

  return result;
}

async function runImportPneumo() {
  console.log('--- IMPORT EXHAUSTIF PNEUMOLOGIE & CHIRURGIE THORACIQUE (MODULE 28 - SEMESTRE 5) ---');

  const smPneumo = await prisma.sousModule.findFirst({
    where: { moduleId: 28, nom: 'Pneumologie' },
    include: { cours: { orderBy: { ordre: 'asc' } } }
  });

  const smChirThor = await prisma.sousModule.findFirst({
    where: { moduleId: 28, nom: 'Chirurgie thoracique' },
    include: { cours: { orderBy: { ordre: 'asc' } } }
  });

  if (!smPneumo || !smChirThor) {
    throw new Error('Sous-modules de Pneumologie non trouvés !');
  }

  const pneumoMap = {};
  for (const c of smPneumo.cours) pneumoMap[c.ordre] = c.id;

  const chirThorMap = {};
  for (const c of smChirThor.cours) chirThorMap[c.ordre] = c.id;

  // Clear existing questions
  await prisma.questionQcm.deleteMany({
    where: { coursId: { in: [...Object.values(pneumoMap), ...Object.values(chirThorMap)] } }
  });
  await prisma.questionRedactionnelle.deleteMany({
    where: { coursId: { in: [...Object.values(pneumoMap), ...Object.values(chirThorMap)] } }
  });

  const raw = fs.readFileSync('c:\\Users\\alita\\OneDrive\\Bureau\\alito-next\\extracted_pneumo_text.txt', 'utf8');
  const lines = raw.split('\n').map(l => l.replace(/\r$/, '').trim());

  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("1. Infections Respiratoires Aiguës") && i > 5) {
      startIdx = i;
      break;
    }
  }

  console.log(`Parsing from line ${startIdx} to ${lines.length}...`);

  const allQuestions = [];
  let currentSm = 'pneumo'; // 'pneumo' or 'chir'
  let currentCourseOrdre = 1;
  let currentCaseContext = '';
  let currentQ = null;
  let pendingQrLabel = '';

  function finalizeCurrentQ() {
    if (!currentQ) return;
    if (currentQ.caseContext) {
      currentQ.fullEnonce = `${currentQ.caseContext}\n\n${cleanText(currentQ.rawEnonce)}`;
    } else {
      currentQ.fullEnonce = cleanText(currentQ.rawEnonce);
    }
    allQuestions.push(currentQ);
    currentQ = null;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = cleanText(rawLine);
    if (!line || line === ':') continue;

    // Detect Chirurgie thoracique section divider (around line 2438)
    if (i > 2400 && rawLine.match(/^Chirurgie thoracique/i)) {
      finalizeCurrentQ();
      currentSm = 'chir';
      currentCourseOrdre = 1;
      currentCaseContext = '';
      continue;
    }

    // Course headers (e.g. "1. Infections...", "1. Drainage thoracique : ( 3 questions )")
    const courseMatch = rawLine.match(/^(\d+)\.\s+(.*?):(?:\s*\(\s*(\d+)\s*questions?\s*\))?/i);
    if (courseMatch) {
      finalizeCurrentQ();
      currentCourseOrdre = parseInt(courseMatch[1]);
      currentCaseContext = '';
      continue;
    }

    // Ignore section banners
    if (rawLine.startsWith('Pneumologie') && i < 2000) {
      continue;
    }
    if (rawLine.includes('Pas de questions disponibles')) {
      continue;
    }

    // Clinical Case Header detection (e.g. "Cas clinique 1:", "Profil clinique 1 :", etc.)
    const caseMatch = rawLine.match(/^(?:🏥\s*)?(?:\*\*)?(Cas clinique\s*\d+.*?|Profil clinique\s*\d+.*?|Observation\s*\d+.*?)(?:\*\*)?:?$/i);
    if (caseMatch) {
      finalizeCurrentQ();
      currentCaseContext = caseMatch[1].replace(/:$/, '').trim();
      continue;
    }

    // Reading clinical case observation
    if (currentCaseContext && !currentQ && !rawLine.match(/^(\d+)\s*[\-\.]\s+/)) {
      currentCaseContext += '\n' + line;
      continue;
    }

    // Intermediate observation note inside a case
    if (currentCaseContext && currentQ && (
      rawLine.includes('Elle quitte l\'hôpital') ||
      rawLine.includes('Le patient s’est nettement amélioré') ||
      rawLine.includes('La patiente revient après') ||
      rawLine.includes('Le patient revient vous voir') ||
      rawLine.includes('Après 3 jours de traitement') ||
      rawLine.includes('Le diagnostic de TPM') ||
      rawLine.includes('Le Diagnostic de Tuberculose') ||
      rawLine.includes('Le diagnostic de tuberculose') ||
      rawLine.includes('Après 15 jours de traitement') ||
      rawLine.includes('Au 15 eme jour') ||
      rawLine.includes('Après 1 semaine') ||
      rawLine.includes('Une spirométrie a été réalisée') ||
      rawLine.includes('La radiographie thoracique est la suivante') ||
      rawLine.includes('Vous réalisez une ponction pleurale') ||
      rawLine.includes('Après évacuation du liquide pleural') ||
      rawLine.includes('Sachant que l’examen pleuro-pulmonaire') ||
      rawLine.includes('Une radiographie thoracique de face a été réalisée') ||
      rawLine.includes('Après 7 j de traitement') ||
      rawLine.includes('La radiographie thoracique montre') ||
      rawLine.includes('Cet examen a confirmé') ||
      rawLine.includes('Avant de démarrer le traitement') ||
      rawLine.includes('Le patient vous demande si') ||
      rawLine.includes('Voici sa radiographie thoracique')
    )) {
      finalizeCurrentQ();
      currentCaseContext += '\n' + line;
      continue;
    }

    // QR detection (e.g. "QR 1 :", "QR 2 :", etc.)
    const qrMatch = rawLine.match(/^QR\s*(\d+)\s*:(.*)/i);
    if (qrMatch) {
      finalizeCurrentQ();
      pendingQrLabel = `QR ${qrMatch[1]} :`;
      if (qrMatch[2] && qrMatch[2].trim()) {
        currentQ = {
          sm: currentSm,
          courseOrdre: currentCourseOrdre,
          caseContext: currentCaseContext,
          type: 'QR',
          rawEnonce: `${pendingQrLabel} ${cleanText(qrMatch[2])}`,
          props: []
        };
        pendingQrLabel = '';
      }
      continue;
    }

    // Question start
    const qMatch = rawLine.match(/^(\d+)\s*[\-\.]\s+(.*)/);
    const isOption = rawLine.match(/^([A-Z]{1,2})[\.\-\)]\s+(.*)/);

    if (qMatch && !isOption) {
      finalizeCurrentQ();
      let label = `${qMatch[1]}- ${cleanText(qMatch[2])}`;
      let isQrType = false;

      if (pendingQrLabel) {
        label = `${pendingQrLabel} ${label}`;
        pendingQrLabel = '';
        isQrType = true;
      }

      if (currentSm === 'chir') {
        isQrType = true;
      }

      currentQ = {
        sm: currentSm,
        courseOrdre: currentCourseOrdre,
        caseContext: currentCaseContext,
        type: isQrType ? 'QR' : 'QCM',
        qNum: qMatch[1],
        rawEnonce: label,
        props: []
      };
      continue;
    }

    // Option
    if (isOption && currentQ) {
      currentQ.props.push(rawLine);
      continue;
    }

    // Active question with props: continue multiline option
    if (currentQ && currentQ.props.length > 0) {
      currentQ.props[currentQ.props.length - 1] += ' ' + rawLine;
      continue;
    }

    // Active question still reading enonce
    if (currentQ && currentQ.props.length === 0) {
      currentQ.rawEnonce += ' ' + rawLine;
      continue;
    }
  }

  finalizeCurrentQ();

  console.log(`Parsed ${allQuestions.length} total questions for Module 28.`);

  let totalQcmInserted = 0;
  let totalQrInserted = 0;

  const pneumoCounts = {};
  for (let ord = 1; ord <= 18; ord++) pneumoCounts[ord] = { qcm: 0, qr: 0 };

  const chirCounts = {};
  for (let ord = 1; ord <= 5; ord++) chirCounts[ord] = { qcm: 0, qr: 0 };

  for (const q of allQuestions) {
    const targetCoursId = q.sm === 'pneumo' ? pneumoMap[q.courseOrdre] : chirThorMap[q.courseOrdre];
    if (!targetCoursId) continue;

    const isActuallyQr = q.type === 'QR' || q.props.length === 0;

    if (isActuallyQr) {
      await prisma.questionRedactionnelle.create({
        data: {
          coursId: targetCoursId,
          enonce: cleanText(q.fullEnonce),
          reponseModele: "",
          motsCles: [],
          images: []
        }
      });
      totalQrInserted++;
      if (q.sm === 'pneumo') pneumoCounts[q.courseOrdre].qr++;
      else chirCounts[q.courseOrdre].qr++;
    } else {
      const blocks = createBlocks(cleanText(q.fullEnonce), q.props);
      for (const b of blocks) {
        await prisma.questionQcm.create({
          data: {
            coursId: targetCoursId,
            type: 'QCM',
            enonce: b.enonce,
            propositions: b.propositions,
            explication: null,
            images: []
          }
        });
        totalQcmInserted++;
        if (q.sm === 'pneumo') pneumoCounts[q.courseOrdre].qcm++;
        else chirCounts[q.courseOrdre].qcm++;
      }
    }
  }

  console.log('\n======================================================');
  console.log('✅ BILAN DÉTAILLÉ DU SOUS-MODULE PNEUMOLOGIE :');
  for (let ord = 1; ord <= 18; ord++) {
    const c = smPneumo.cours.find(x => x.ordre === ord);
    console.log(`- Cours ${ord} (${c?.titre}) : ${pneumoCounts[ord].qcm} QCM | ${pneumoCounts[ord].qr} QR`);
  }

  console.log('\n✅ BILAN DÉTAILLÉ DU SOUS-MODULE CHIRURGIE THORACIQUE :');
  for (let ord = 1; ord <= 5; ord++) {
    const c = smChirThor.cours.find(x => x.ordre === ord);
    console.log(`- Cours ${ord} (${c?.titre}) : ${chirCounts[ord].qcm} QCM | ${chirCounts[ord].qr} QR`);
  }

  console.log(`\n👉 TOTAL GÉNÉRAL EN BASE : ${totalQcmInserted} QCM + ${totalQrInserted} QR = ${totalQcmInserted + totalQrInserted} questions.`);
  console.log('======================================================');
}

runImportPneumo().finally(() => prisma.$disconnect());
