"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ClipboardCopy,
  Crown,
  DoorOpen,
  Gauge,
  GraduationCap,
  KeyRound,
  Play,
  RefreshCcw,
  Users,
} from "lucide-react";

const initialTeacherForm = {
  password: "",
  mode: "words",
  exerciseId: "words-1",
  customText: "",
};

export default function Home() {
  const [view, setView] = useState("home");
  const [exercises, setExercises] = useState({ words: [], long: [] });
  const [joinForm, setJoinForm] = useState({ code: "", name: "" });
  const [teacherForm, setTeacherForm] = useState(initialTeacherForm);
  const [room, setRoom] = useState(null);
  const [teacherKey, setTeacherKey] = useState("");
  const [studentId, setStudentId] = useState("");
  const [typed, setTyped] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const typingRef = useRef(null);

  const currentStudent = useMemo(
    () => room?.students.find((student) => student.id === studentId),
    [room, studentId],
  );

  const targetText = room?.exercise.text ?? "";
  const canType = view === "student" && room?.status === "running";

  useEffect(() => {
    fetch("/api/classroom")
      .then((res) => res.json())
      .then((data) => setExercises(data.exercises ?? { words: [], long: [] }))
      .catch(() => setMessage("연습 목록을 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    if (!room?.code) return;
    const interval = window.setInterval(async () => {
      try {
        const data = await api(`/api/classroom?code=${room.code}`);
        setRoom(data.room);
      } catch {
        // 방이 일시적으로 조회되지 않아도 입력 흐름은 끊지 않습니다.
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [room?.code]);

  useEffect(() => {
    if (canType) typingRef.current?.focus();
  }, [canType]);

  async function createTeacherRoom(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const data = await api("/api/classroom", {
        method: "POST",
        body: { action: "create", ...teacherForm },
      });
      setRoom(data.room);
      setTeacherKey(data.teacherKey);
      setView("teacher");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function joinStudentRoom(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const code = joinForm.code.trim().toUpperCase();
      const data = await api("/api/classroom", {
        method: "POST",
        body: { action: "join", code, name: joinForm.name },
      });
      setRoom(data.room);
      setStudentId(data.studentId);
      setTyped("");
      setView("student");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function startRoom() {
    if (!room) return;
    setBusy(true);
    setMessage("");

    try {
      const data = await api("/api/classroom", {
        method: "POST",
        body: { action: "start", code: room.code, teacherKey },
      });
      setRoom(data.room);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resetRoom() {
    if (!room) return;
    setBusy(true);
    setMessage("");

    try {
      const data = await api("/api/classroom", {
        method: "POST",
        body: { action: "reset", code: room.code, teacherKey },
      });
      setRoom(data.room);
      setTyped("");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateTyped(nextValue) {
    if (!room || !studentId || !canType) return;
    const nextTyped = nextValue.slice(0, targetText.length);
    setTyped(nextTyped);

    try {
      const data = await api("/api/classroom", {
        method: "POST",
        body: { action: "progress", code: room.code, studentId, typed: nextTyped },
      });
      setRoom(data.room);
    } catch (err) {
      setMessage(err.message);
    }
  }

  function copyCode() {
    if (!room?.code) return;
    navigator.clipboard?.writeText(room.code);
    setMessage("참여코드를 복사했습니다.");
  }

  return (
    <main className="shell">
      <section className="topbar">
        <div className="brand">
          <GraduationCap size={28} />
          <div>
            <strong>교실 타자 레이스</strong>
            <span>25명 동시 참여 · 실시간 순위</span>
          </div>
        </div>
        {room ? (
          <button className="ghostButton" onClick={() => window.location.reload()}>
            <DoorOpen size={18} />
            나가기
          </button>
        ) : null}
      </section>

      {message ? <div className="notice">{message}</div> : null}

      {view === "home" ? (
        <section className="homeGrid">
          <form className="panel joinPanel" onSubmit={joinStudentRoom}>
            <div className="panelTitle">
              <Users size={22} />
              <h1>참여코드로 입장</h1>
            </div>
            <label>
              참여코드
              <input
                inputMode="numeric"
                maxLength={6}
                placeholder="예: 123456"
                value={joinForm.code}
                onChange={(event) => setJoinForm({ ...joinForm, code: event.target.value })}
              />
            </label>
            <label>
              이름
              <input
                maxLength={16}
                placeholder="학생 이름"
                value={joinForm.name}
                onChange={(event) => setJoinForm({ ...joinForm, name: event.target.value })}
              />
            </label>
            <button className="primaryButton" disabled={busy}>
              <DoorOpen size={18} />
              입장하기
            </button>
          </form>

          <form className="panel teacherPanel" onSubmit={createTeacherRoom}>
            <div className="panelTitle">
              <KeyRound size={22} />
              <h2>교사 관리자 페이지</h2>
            </div>
            <label>
              교사 비밀번호
              <input
                type="password"
                placeholder="비밀번호"
                value={teacherForm.password}
                onChange={(event) => setTeacherForm({ ...teacherForm, password: event.target.value })}
              />
            </label>
            <div className="segmented">
              <button
                type="button"
                className={teacherForm.mode === "words" ? "active" : ""}
                onClick={() =>
                  setTeacherForm({
                    ...teacherForm,
                    mode: "words",
                    exerciseId: exercises.words[0]?.id ?? "words-1",
                  })
                }
              >
                단어연습
              </button>
              <button
                type="button"
                className={teacherForm.mode === "long" ? "active" : ""}
                onClick={() =>
                  setTeacherForm({
                    ...teacherForm,
                    mode: "long",
                    exerciseId: exercises.long[0]?.id ?? "long-1",
                  })
                }
              >
                장문연습
              </button>
            </div>
            <label>
              연습문제
              <select
                value={teacherForm.exerciseId}
                onChange={(event) => setTeacherForm({ ...teacherForm, exerciseId: event.target.value })}
              >
                {(exercises[teacherForm.mode] ?? []).map((exercise) => (
                  <option value={exercise.id} key={exercise.id}>
                    {exercise.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              직접 입력
              <textarea
                rows={4}
                placeholder="비워두면 선택한 연습문제로 진행됩니다."
                value={teacherForm.customText}
                onChange={(event) => setTeacherForm({ ...teacherForm, customText: event.target.value })}
              />
            </label>
            <button className="primaryButton" disabled={busy}>
              <GraduationCap size={18} />
              방 만들기
            </button>
          </form>
        </section>
      ) : null}

      {view === "teacher" && room ? (
        <TeacherRoom room={room} busy={busy} onCopy={copyCode} onStart={startRoom} onReset={resetRoom} />
      ) : null}

      {view === "student" && room ? (
        <StudentRoom
          canType={canType}
          currentStudent={currentStudent}
          room={room}
          targetText={targetText}
          typed={typed}
          typingRef={typingRef}
          onTyped={updateTyped}
        />
      ) : null}
    </main>
  );
}

function TeacherRoom({ room, busy, onCopy, onStart, onReset }) {
  return (
    <section className="dashboard">
      <div className="commandBand">
        <div>
          <span className="eyebrow">참여코드</span>
          <button className="codeButton" onClick={onCopy} title="참여코드 복사">
            {room.code}
            <ClipboardCopy size={20} />
          </button>
        </div>
        <div className="statusBox">
          <span>{room.status === "running" ? "진행 중" : "대기 중"}</span>
          <strong>
            {room.students.length}/{room.maxStudents}명
          </strong>
        </div>
        <div className="buttonRow">
          <button className="primaryButton" disabled={busy || room.status === "running"} onClick={onStart}>
            <Play size={18} />
            시작
          </button>
          <button className="ghostButton" disabled={busy} onClick={onReset}>
            <RefreshCcw size={18} />
            초기화
          </button>
        </div>
      </div>

      <div className="exerciseStrip">
        <strong>{room.exercise.title}</strong>
        <p>{room.exercise.text}</p>
      </div>

      <div className="rankLayout">
        <section className="ranking">
          <div className="sectionHeader">
            <Crown size={21} />
            <h2>실시간 순위</h2>
          </div>
          <div className="rankList">
            {room.students.length ? (
              room.students.map((student, index) => <RankCard key={student.id} rank={index + 1} student={student} />)
            ) : (
              <div className="empty">학생이 참여코드로 입장하면 여기에 표시됩니다.</div>
            )}
          </div>
        </section>

        <section className="monitor">
          <div className="sectionHeader">
            <BarChart3 size={21} />
            <h2>진행상황</h2>
          </div>
          <div className="studentTable">
            {room.students.map((student) => (
              <div className="studentRow" key={student.id}>
                <strong>{student.name}</strong>
                <Progress value={student.progress} />
                <span>{student.accuracy}%</span>
                <span>{student.cpm}타/분</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function StudentRoom({ canType, currentStudent, room, targetText, typed, typingRef, onTyped }) {
  const isFinished = currentStudent?.finishedAt;

  return (
    <section className="studentScreen">
      <div className="studentHeader">
        <div>
          <span className="eyebrow">참여코드 {room.code}</span>
          <h1>{currentStudent?.name ?? "학생"}님</h1>
        </div>
        <div className="scoreBadge">
          <Gauge size={20} />
          <strong>{currentStudent?.score ?? 0}</strong>
          <span>점</span>
        </div>
      </div>

      <div className="targetBox" aria-label="입력할 문장">
        {targetText.split("").map((char, index) => {
          const typedChar = typed[index];
          const className =
            typedChar == null ? "" : typedChar === char ? "correctChar" : "wrongChar";
          return (
            <span className={className} key={`${char}-${index}`}>
              {char}
            </span>
          );
        })}
      </div>

      <textarea
        ref={typingRef}
        className="typingArea"
        value={typed}
        disabled={!canType || isFinished}
        placeholder={room.status === "running" ? "여기에 입력하세요." : "교사가 시작을 누르면 입력할 수 있습니다."}
        onChange={(event) => onTyped(event.target.value)}
      />

      <div className="studentStats">
        <Stat icon={<BarChart3 size={20} />} label="진행률" value={`${currentStudent?.progress ?? 0}%`} />
        <Stat icon={<CheckCircle2 size={20} />} label="정확도" value={`${currentStudent?.accuracy ?? 100}%`} />
        <Stat icon={<Gauge size={20} />} label="속도" value={`${currentStudent?.cpm ?? 0}타/분`} />
      </div>

      {isFinished ? <div className="finishBanner">완료했습니다. 순위표가 곧 갱신됩니다.</div> : null}
    </section>
  );
}

function RankCard({ rank, student }) {
  return (
    <div className={`rankCard rank${rank}`}>
      <div className="rankNumber">{rank}</div>
      <div className="rankInfo">
        <strong>{student.name}</strong>
        <Progress value={student.progress} />
      </div>
      <div className="rankScore">
        <strong>{student.score}</strong>
        <span>{student.accuracy}% · {student.cpm}타/분</span>
      </div>
    </div>
  );
}

function Progress({ value }) {
  return (
    <div className="progressTrack">
      <div className="progressFill" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "요청을 처리하지 못했습니다.");
  return data;
}
