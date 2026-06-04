import { nanoid } from "./utils.js";

const globalStore = globalThis.__CLASS_TYPING_STORE__ ?? {
  rooms: new Map(),
};

globalThis.__CLASS_TYPING_STORE__ = globalStore;

export const TEACHER_PASSWORD = "0121";
export const MAX_STUDENTS = 25;

export const EXERCISES = {
  words: [
    {
      id: "words-1",
      title: "기본 단어",
      text: "학교 친구 교실 선생님 책상 연필 공책 운동장 도서관 컴퓨터 키보드 화면 창의력 집중 협동 도전 성공",
    },
    {
      id: "words-2",
      title: "생활 단어",
      text: "아침 점심 저녁 가족 약속 시간 정리 계획 발표 질문 대답 생각 기록 연습 습관 배움 성장",
    },
  ],
  long: [
    {
      id: "long-1",
      title: "짧은 글",
      text: "우리는 함께 연습할 때 더 멀리 갈 수 있습니다. 천천히 정확하게 입력하고, 마지막까지 포기하지 않는 마음이 중요합니다.",
    },
    {
      id: "long-2",
      title: "교실 글",
      text: "오늘의 타자연습은 속도와 정확도를 함께 겨루는 활동입니다. 친구들의 진행상황을 보며 즐겁게 참여하고 자신의 기록을 조금씩 높여 봅시다.",
    },
  ],
};

export function createRoom({ mode, exerciseId, customText }) {
  const code = createRoomCode();
  const teacherKey = nanoid(18);
  const exercise = getExercise(mode, exerciseId, customText);
  const room = {
    code,
    teacherKey,
    mode,
    exercise,
    status: "waiting",
    createdAt: Date.now(),
    startedAt: null,
    students: new Map(),
  };

  globalStore.rooms.set(code, room);
  return room;
}

export function getRoom(code) {
  return globalStore.rooms.get(String(code || "").trim().toUpperCase());
}

export function serializeRoom(room) {
  const students = [...room.students.values()]
    .map((student) => ({
      id: student.id,
      name: student.name,
      typedLength: student.typedLength,
      progress: student.progress,
      accuracy: student.accuracy,
      cpm: student.cpm,
      score: student.score,
      finishedAt: student.finishedAt,
      updatedAt: student.updatedAt,
    }))
    .sort((a, b) => b.score - a.score || b.progress - a.progress || a.name.localeCompare(b.name, "ko"));

  return {
    code: room.code,
    mode: room.mode,
    exercise: room.exercise,
    status: room.status,
    startedAt: room.startedAt,
    maxStudents: MAX_STUDENTS,
    students,
  };
}

export function joinRoom(room, name) {
  if (room.students.size >= MAX_STUDENTS) {
    throw new Error("방이 가득 찼습니다. 최대 25명까지 참여할 수 있어요.");
  }

  const cleanName = String(name || "").trim().slice(0, 16);
  if (!cleanName) {
    throw new Error("이름을 입력해 주세요.");
  }

  const student = {
    id: nanoid(16),
    name: cleanName,
    typedLength: 0,
    progress: 0,
    accuracy: 100,
    cpm: 0,
    score: 0,
    finishedAt: null,
    updatedAt: Date.now(),
  };

  room.students.set(student.id, student);
  return student;
}

export function updateProgress(room, studentId, typed) {
  const student = room.students.get(studentId);
  if (!student) {
    throw new Error("참가자를 찾을 수 없습니다.");
  }

  const target = room.exercise.text;
  const typedText = String(typed || "").slice(0, target.length);
  const correctChars = countCorrectChars(target, typedText);
  const progress = target.length ? Math.round((typedText.length / target.length) * 100) : 0;
  const accuracy = typedText.length ? Math.round((correctChars / typedText.length) * 100) : 100;
  const elapsedMinutes = room.startedAt ? Math.max((Date.now() - room.startedAt) / 60000, 1 / 60) : 1 / 60;
  const cpm = Math.round(correctChars / elapsedMinutes);
  const finished = typedText.length >= target.length && correctChars === target.length;
  const score = Math.round(progress * 7 + accuracy * 2 + Math.min(cpm, 600) * 0.5 + (finished ? 150 : 0));

  student.typedLength = typedText.length;
  student.progress = progress;
  student.accuracy = accuracy;
  student.cpm = cpm;
  student.score = score;
  student.finishedAt = finished ? student.finishedAt ?? Date.now() : null;
  student.updatedAt = Date.now();

  return student;
}

function createRoomCode() {
  let code = "";
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (globalStore.rooms.has(code));
  return code;
}

function getExercise(mode, exerciseId, customText) {
  const cleanMode = mode === "long" ? "long" : "words";
  const cleanCustomText = String(customText || "").trim();

  if (cleanCustomText) {
    return {
      id: "custom",
      title: "직접 입력",
      text: cleanCustomText.slice(0, 600),
    };
  }

  const list = EXERCISES[cleanMode];
  return list.find((item) => item.id === exerciseId) ?? list[0];
}

function countCorrectChars(target, typed) {
  let count = 0;
  for (let i = 0; i < typed.length; i += 1) {
    if (target[i] === typed[i]) count += 1;
  }
  return count;
}
