import {
  createRoom,
  EXERCISES,
  getRoom,
  joinRoom,
  serializeRoom,
  TEACHER_PASSWORD,
  updateProgress,
} from "../store.js";
import { error, json, readJson } from "../utils.js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return json({ exercises: EXERCISES });
  }

  const room = getRoom(code);
  if (!room) return error("방을 찾을 수 없습니다.", 404);

  return json({ room: serializeRoom(room) });
}

export async function POST(request) {
  const body = await readJson(request);
  const action = body.action;

  if (action === "create") {
    if (String(body.password || "") !== TEACHER_PASSWORD) {
      return error("교사 비밀번호가 올바르지 않습니다.", 401);
    }

    const room = createRoom({
      mode: body.mode,
      exerciseId: body.exerciseId,
      customText: body.customText,
    });

    return json({ room: serializeRoom(room), teacherKey: room.teacherKey });
  }

  const room = getRoom(body.code);
  if (!room) return error("방을 찾을 수 없습니다.", 404);

  if (action === "join") {
    if (room.status !== "waiting") return error("이미 시작된 방에는 입장할 수 없습니다.", 409);

    try {
      const student = joinRoom(room, body.name);
      return json({ studentId: student.id, room: serializeRoom(room) });
    } catch (err) {
      return error(err.message);
    }
  }

  if (action === "start") {
    if (body.teacherKey !== room.teacherKey) return error("교사 권한이 필요합니다.", 403);

    room.status = "running";
    room.startedAt = Date.now();
    return json({ room: serializeRoom(room) });
  }

  if (action === "reset") {
    if (body.teacherKey !== room.teacherKey) return error("교사 권한이 필요합니다.", 403);

    room.status = "waiting";
    room.startedAt = null;
    for (const student of room.students.values()) {
      student.typedLength = 0;
      student.progress = 0;
      student.accuracy = 100;
      student.cpm = 0;
      student.score = 0;
      student.finishedAt = null;
      student.updatedAt = Date.now();
    }
    return json({ room: serializeRoom(room) });
  }

  if (action === "progress") {
    if (room.status !== "running") return error("아직 게임이 시작되지 않았습니다.", 409);

    try {
      updateProgress(room, body.studentId, body.typed);
      return json({ room: serializeRoom(room) });
    } catch (err) {
      return error(err.message);
    }
  }

  return error("알 수 없는 요청입니다.");
}
