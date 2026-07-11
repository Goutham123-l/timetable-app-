const prisma = require("../prisma");

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const key = (a, b, c) => `${a}-${b}-${c}`;

/**
 * Generates a conflict-free timetable using randomized greedy placement.
 * Locked entries are preserved and treated as already-occupied slots.
 */
async function generateTimetable() {
  const [days, periods, assignments, classrooms, lockedEntries] = await Promise.all([
    prisma.workingDay.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.period.findMany({ where: { isLunch: false }, orderBy: { index: "asc" } }),
    prisma.assignment.findMany({ include: { teacher: true, subject: true, section: true } }),
    prisma.classroom.findMany(),
    prisma.timetableEntry.findMany({ where: { locked: true } }),
  ]);

  if (days.length === 0) return { success: false, message: "No working days configured. Add working days first." };
  if (periods.length === 0) return { success: false, message: "No periods configured. Add periods first." };
  if (assignments.length === 0) return { success: false, message: "No teacher-subject-section assignments found. Fill the assignment table first." };

  // occupancy trackers
  const sectionBusy = new Set(); // key(sectionId, dayId, periodId)
  const teacherBusy = new Set(); // key(teacherId, dayId, periodId)
  const roomBusy = new Set();    // key(roomId, dayId, periodId)
  const teacherDailyCount = {};  // teacherId-dayId -> count

  const newEntries = [];

  // seed with locked entries so generator never overwrites them
  for (const e of lockedEntries) {
    sectionBusy.add(key(e.sectionId, e.dayId, e.periodId));
    teacherBusy.add(key(e.teacherId, e.dayId, e.periodId));
    if (e.classroomId) roomBusy.add(key(e.classroomId, e.dayId, e.periodId));
    const dKey = `${e.teacherId}-${e.dayId}`;
    teacherDailyCount[dKey] = (teacherDailyCount[dKey] || 0) + 1;
  }

  const labRooms = classrooms.filter((r) => r.type === "LAB");
  const normalRooms = classrooms.filter((r) => r.type === "CLASSROOM");

  const conflicts = [];

  // build all (day, period) slot pairs, and all consecutive pairs (for labs) within same day
  const allSlots = [];
  for (const d of days) {
    for (const p of periods) {
      allSlots.push({ day: d, period: p });
    }
  }

  const consecutivePairs = [];
  for (const d of days) {
    const sorted = [...periods].sort((a, b) => a.index - b.index);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1].index === sorted[i].index + 1) {
        consecutivePairs.push({ day: d, p1: sorted[i], p2: sorted[i + 1] });
      }
    }
  }

  function findRoom(dayId, periodId, isLab) {
    const pool = isLab ? (labRooms.length ? labRooms : normalRooms) : (normalRooms.length ? normalRooms : labRooms);
    for (const room of shuffle(pool)) {
      if (!roomBusy.has(key(room.id, dayId, periodId))) return room;
    }
    return null;
  }

  function tryPlaceSingle(assignment) {
    const candidates = shuffle(allSlots);
    for (const slot of candidates) {
      const { day, period } = slot;
      const sKey = key(assignment.sectionId, day.id, period.id);
      const tKey = key(assignment.teacherId, day.id, period.id);
      const dailyKey = `${assignment.teacherId}-${day.id}`;
      if (sectionBusy.has(sKey)) continue;
      if (teacherBusy.has(tKey)) continue;
      if ((teacherDailyCount[dailyKey] || 0) >= assignment.teacher.maxPeriodsDay) continue;

      const room = findRoom(day.id, period.id, assignment.subject.type === "LAB");

      sectionBusy.add(sKey);
      teacherBusy.add(tKey);
      teacherDailyCount[dailyKey] = (teacherDailyCount[dailyKey] || 0) + 1;
      if (room) roomBusy.add(key(room.id, day.id, period.id));

      newEntries.push({
        sectionId: assignment.sectionId,
        teacherId: assignment.teacherId,
        subjectId: assignment.subjectId,
        dayId: day.id,
        periodId: period.id,
        classroomId: room ? room.id : null,
      });
      return true;
    }
    return false;
  }

  function tryPlaceLabPair(assignment) {
    const candidates = shuffle(consecutivePairs);
    for (const c of candidates) {
      const { day, p1, p2 } = c;
      const sKey1 = key(assignment.sectionId, day.id, p1.id);
      const sKey2 = key(assignment.sectionId, day.id, p2.id);
      const tKey1 = key(assignment.teacherId, day.id, p1.id);
      const tKey2 = key(assignment.teacherId, day.id, p2.id);
      const dailyKey = `${assignment.teacherId}-${day.id}`;

      if (sectionBusy.has(sKey1) || sectionBusy.has(sKey2)) continue;
      if (teacherBusy.has(tKey1) || teacherBusy.has(tKey2)) continue;
      if ((teacherDailyCount[dailyKey] || 0) + 2 > assignment.teacher.maxPeriodsDay) continue;

      const room = findRoom(day.id, p1.id, true);
      // require the same room free for both periods
      if (room && roomBusy.has(key(room.id, day.id, p2.id))) continue;

      sectionBusy.add(sKey1);
      sectionBusy.add(sKey2);
      teacherBusy.add(tKey1);
      teacherBusy.add(tKey2);
      teacherDailyCount[dailyKey] = (teacherDailyCount[dailyKey] || 0) + 2;
      if (room) {
        roomBusy.add(key(room.id, day.id, p1.id));
        roomBusy.add(key(room.id, day.id, p2.id));
      }

      newEntries.push({
        sectionId: assignment.sectionId,
        teacherId: assignment.teacherId,
        subjectId: assignment.subjectId,
        dayId: day.id,
        periodId: p1.id,
        classroomId: room ? room.id : null,
      });
      newEntries.push({
        sectionId: assignment.sectionId,
        teacherId: assignment.teacherId,
        subjectId: assignment.subjectId,
        dayId: day.id,
        periodId: p2.id,
        classroomId: room ? room.id : null,
      });
      return true;
    }
    return false;
  }

  // process assignments in random order for variety between generations
  for (const assignment of shuffle(assignments)) {
    let remaining = assignment.periodsPerWeek;
    const isLab = assignment.subject.type === "LAB";

    if (isLab) {
      while (remaining >= 2) {
        if (tryPlaceLabPair(assignment)) {
          remaining -= 2;
        } else {
          break;
        }
      }
      while (remaining > 0) {
        if (tryPlaceSingle(assignment)) {
          remaining -= 1;
        } else {
          break;
        }
      }
    } else {
      while (remaining > 0) {
        if (tryPlaceSingle(assignment)) {
          remaining -= 1;
        } else {
          break;
        }
      }
    }

    if (remaining > 0) {
      conflicts.push({
        type: "INSUFFICIENT_SLOTS",
        teacher: assignment.teacher.name,
        subject: assignment.subject.name,
        section: assignment.section.name,
        message: `Could only place ${assignment.periodsPerWeek - remaining} of ${assignment.periodsPerWeek} required periods for ${assignment.subject.name} (${assignment.section.name}, ${assignment.teacher.name}). Increase working days/periods or reduce teacher workload conflicts.`,
      });
    }
  }

  // wipe old unlocked entries, then insert fresh ones
  await prisma.timetableEntry.deleteMany({ where: { locked: false } });
  if (newEntries.length > 0) {
    await prisma.timetableEntry.createMany({ data: newEntries });
  }

  return {
    success: true,
    entriesCreated: newEntries.length,
    conflicts,
    message:
      conflicts.length > 0
        ? `Timetable generated with ${conflicts.length} unresolved item(s). Review conflicts and adjust manually.`
        : "Timetable generated successfully with no conflicts.",
  };
}

module.exports = { generateTimetable };
