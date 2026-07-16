import { states } from "./data.js";

const titleOptions = {
  rumination: ["让反复暂时停下", "把念头放远一点", "为脑海留出空隙"],
  anticipation: ["给未确定留些空间", "把此刻带回现在", "先照顾眼前这一步"],
  overload: ["从过载里退开片刻", "先只留下一件事", "让思绪彼此离远一点"],
  blocked: ["今天先走一小步", "靠近第一个动作", "从停住到开始之间"],
  aftershock: ["等这一阵余波经过", "给身体多一点空间", "让此刻慢慢落下"],
  "low-energy": ["允许自己先恢复", "此刻能做多少就多少", "先听见身体的需要"],
};

const feedbackLabels = {
  steadier: "稍微稳定一些",
  same: "没有明显变化",
  worse: "感觉更不舒服",
};

const defaultSummaries = {
  steadier: "这一点稳定，被轻轻留了下来。",
  same: "没有明显变化，也仍是一段被照看的时间。",
  worse: "这次没有变轻，先给自己留一点空间。",
};

function stableTitleIndex(record, count) {
  const minute = Number.isFinite(Date.parse(record.at)) ? Math.floor(Date.parse(record.at) / 60000) : 0;
  const feedbackOffset = Object.keys(feedbackLabels).indexOf(record.feedback) + 1;
  const sceneOffset = Number(record.sceneIndex) || 0;
  return Math.abs(minute + feedbackOffset + sceneOffset) % count;
}

export function getRecordTitle(record) {
  if (record.title?.trim()) return record.title.trim();
  if (record.type === "encounter") return "与一段声音相遇";
  const options = titleOptions[record.stateId] ?? ["留下一次状态调整"];
  return options[stableTitleIndex(record, options.length)];
}

export function getRecordSummary(record) {
  const note = typeof record.note === "string" ? record.note.trim() : "";
  if (note) return note;
  if (record.type === "encounter") return "在一段声音里，暂时停留了一会儿。";
  return defaultSummaries[record.feedback] ?? "这一次状态调整，已经安静地完成。";
}

export function getFeedbackLabel(feedback) {
  return feedbackLabels[feedback] ?? "未留下反馈";
}

export function getRecordState(record) {
  return states.find((state) => state.id === record.stateId) ?? states[0];
}

export function getRecordScene(record) {
  const state = getRecordState(record);
  return state.scenes[Number(record.sceneIndex) || 0] ?? state.scenes[0];
}

export function createMeditationRecord({ stateId, sceneIndex = 0, feedback, duration = 0, at = new Date().toISOString(), id }) {
  const draft = { id, type: "meditation", stateId, sceneIndex: Number(sceneIndex) || 0, feedback, duration: Math.max(0, Math.round(duration)), at, note: "" };
  return { ...draft, title: getRecordTitle(draft) };
}
