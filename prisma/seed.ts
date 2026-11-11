import { PrismaClient, Section } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test questions and passages...");

  // Clean existing questions and passages
  await prisma.answer.deleteMany({});
  await prisma.attempt.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.passage.deleteMany({});

  // 1. Structure Questions
  const q1 = await prisma.question.create({
    data: {
      section: Section.STRUCTURE,
      text: "The committee decided to postpone the evaluation until further data ______ collected.",
      options: {
        A: "is",
        B: "were",
        C: "has been",
        D: "was",
      },
      answerKey: "D",
      order: 1,
    },
  });

  const q2 = await prisma.question.create({
    data: {
      section: Section.STRUCTURE,
      text: "Neither the principal nor the teachers ______ present at the annual institutional symposium.",
      options: {
        A: "was",
        B: "were",
        C: "is",
        D: "are being",
      },
      answerKey: "B",
      order: 2,
    },
  });

  const q3 = await prisma.question.create({
    data: {
      section: Section.STRUCTURE,
      text: "Had the researchers known about the anomaly earlier, they ______ the test parameters immediately.",
      options: {
        A: "would adjust",
        B: "will adjust",
        C: "would have adjusted",
        D: "had adjusted",
      },
      answerKey: "C",
      order: 3,
    },
  });

  // 2. Reading Passage
  const passage = await prisma.passage.create({
    data: {
      title: "Institutional Integrity in Standardized Testing",
      section: Section.READING,
      content:
        "Standardized testing serves as a foundational benchmark for institutional accountability and academic credentialing. To preserve public trust, integrity protocols must eliminate bias and prevent credential inflation.\n\nContemporary assessment systems leverage cryptographic verification and centralized telemetry to establish auditability without compromising user privacy. The implementation of server-enforced countdown timers and append-only audit trails further mitigates client-side tamper risks.",
    },
  });

  // 3. Reading Questions linked to passage
  const q4 = await prisma.question.create({
    data: {
      passageId: passage.id,
      section: Section.READING,
      text: "According to the passage, what is a primary goal of contemporary assessment systems?",
      options: {
        A: "To accelerate commercial test marketing",
        B: "To establish auditability without compromising privacy",
        C: "To replace human invigilators with automated grading",
        D: "To eliminate the need for institutional accreditation",
      },
      answerKey: "B",
      order: 4,
    },
  });

  const q5 = await prisma.question.create({
    data: {
      passageId: passage.id,
      section: Section.READING,
      text: "The word 'benchmark' in the first paragraph is closest in meaning to:",
      options: {
        A: "Standard",
        B: "Obstacle",
        C: "Hypothesis",
        D: "Anomaly",
      },
      answerKey: "A",
      order: 5,
    },
  });

  console.log("Seeding complete. Seeded 1 passage and 5 questions:", [
    q1.id,
    q2.id,
    q3.id,
    q4.id,
    q5.id,
  ]);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
