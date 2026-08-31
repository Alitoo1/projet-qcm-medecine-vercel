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

async function runImportAnatPathVasc() {
  console.log('--- IMPORT EXACT DU SOUS-MODULE PATHOLOGIES VASCULAIRES (ANATOMIE PATHOLOGIQUE) ---');

  const sm = await prisma.sousModule.findFirst({
    where: { id: 10 },
    include: { cours: { orderBy: { ordre: 'asc' } } }
  });

  if (!sm) throw new Error('Sous-Module 10 non trouvé !');

  const coursMap = {};
  for (const c of sm.cours) coursMap[c.ordre] = c.id;

  // Clear existing questions in SM 10
  await prisma.questionQcm.deleteMany({ where: { coursId: { in: Object.values(coursMap) } } });
  await prisma.questionRedactionnelle.deleteMany({ where: { coursId: { in: Object.values(coursMap) } } });

  const raw = fs.readFileSync('c:\\Users\\alita\\OneDrive\\Bureau\\alito-next\\extracted_anatpath_vasc_text.txt', 'utf8');
  const lines = raw.split('\n').map(l => l.replace(/\r$/, '').trim());

  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("1. Athérosclérose : (5 questions)")) {
      startIdx = i;
      break;
    }
  }

  console.log(`Parsing Pathologies Vasculaires from line ${startIdx} to ${lines.length}...`);

  const allQuestions = [];
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

    // Strict Course headers: e.g. "1. Athérosclérose : (5 questions)"
    const courseMatch = rawLine.match(/^(\d+)\.\s+(.*?):\s*\(\s*(\d+)\s*questions?\s*\)/i);
    if (courseMatch) {
      finalizeCurrentQ();
      currentCourseOrdre = parseInt(courseMatch[1]);
      currentCaseContext = '';
      continue;
    }

    // Ignore section banners
    if (rawLine.startsWith('Pathologies Vasculaires')) {
      continue;
    }

    // Clinical Case Header detection
    const caseMatch = rawLine.match(/^(?:🏥\s*)?(?:\*\*)?(Cas clinique\s*\d+.*?)(?:\*\*)?:?$/i);
    if (caseMatch) {
      finalizeCurrentQ();
      currentCaseContext = caseMatch[1].replace(/:$/, '').trim();
      continue;
    }

    // Reading clinical case observation
    if (currentCaseContext && !currentQ && !rawLine.match(/^(\d+)[\.\-]\s+/)) {
      currentCaseContext += '\n' + line;
      continue;
    }

    // Intermediate observation note inside a case
    if (currentCaseContext && currentQ && (
      rawLine.includes('Ce patient se présente aux urgences') ||
      rawLine.includes('Une résection intestinale a été réalisée') ||
      rawLine.includes('L\'examen histologique de son aorte')
    )) {
      finalizeCurrentQ();
      currentCaseContext += '\n' + line;
      continue;
    }

    // QR detection
    const qrMatch = rawLine.match(/^QR\s*(\d+)\s*:(.*)/i);
    if (qrMatch) {
      finalizeCurrentQ();
      pendingQrLabel = `QR ${qrMatch[1]} :`;
      if (qrMatch[2] && qrMatch[2].trim()) {
        currentQ = {
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

    // Question start (matches "1. ...", "1- ...")
    const qMatch = rawLine.match(/^(\d+)[\.\-]\s+(.*)/);
    const isOption = rawLine.match(/^([A-Z]{1,2})[\.\-\)]\s+(.*)/);

    if (qMatch && !isOption) {
      finalizeCurrentQ();
      let label = `${qMatch[1]}- ${cleanText(qMatch[2])}`;
      let isQrType = false;

      // In Course 5 (Cas cliniques), all 14 questions are QR!
      if (currentCourseOrdre === 5) isQrType = true;
      // In Course 1, Q2-5 are QR
      if (currentCourseOrdre === 1 && parseInt(qMatch[1]) >= 2) isQrType = true;
      // In Course 2, Q5-9 are QR
      if (currentCourseOrdre === 2 && parseInt(qMatch[1]) >= 5) isQrType = true;
      // In Course 3, Q4-7 are QR
      if (currentCourseOrdre === 3 && parseInt(qMatch[1]) >= 4) isQrType = true;
      // In Course 4, Q2-12 are QR
      if (currentCourseOrdre === 4 && parseInt(qMatch[1]) >= 2) isQrType = true;

      if (pendingQrLabel) {
        label = `${pendingQrLabel} ${label}`;
        pendingQrLabel = '';
        isQrType = true;
      }

      currentQ = {
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

  console.log(`Parsed ${allQuestions.length} total questions for Pathologies Vasculaires.`);

  let totalQcmInserted = 0;
  let totalQrInserted = 0;
  const courseCounts = {};
  for (let ord = 1; ord <= 5; ord++) {
    courseCounts[ord] = { qcm: 0, qr: 0 };
  }

  for (const q of allQuestions) {
    const targetCoursId = coursMap[q.courseOrdre];
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
      courseCounts[q.courseOrdre].qr++;
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
        courseCounts[q.courseOrdre].qcm++;
      }
    }
  }

  console.log('\n======================================================');
  console.log('✅ BILAN DÉTAILLÉ DE PATHOLOGIES VASCULAIRES :');
  for (let ord = 1; ord <= 5; ord++) {
    const c = sm.cours.find(x => x.ordre === ord);
    console.log(`- Cours ${ord} (${c?.titre}) : ${courseCounts[ord].qcm} QCM | ${courseCounts[ord].qr} QR`);
  }
  console.log(`👉 TOTAL GÉNÉRAL EN BASE : ${totalQcmInserted} QCM + ${totalQrInserted} QR = ${totalQcmInserted + totalQrInserted} questions.`);
  console.log('======================================================');
}

runImportAnatPathVasc().finally(() => prisma.$disconnect());
