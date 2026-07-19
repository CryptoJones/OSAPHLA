import { describe, expect, it } from "vitest";
import { scheduleReview } from "../src/lib/review";

const card = { id:"v1",sectionId:"s1",prompt:"hello",answer:"hola",intervalDays:1,ease:2.5,repetitions:0,dueAt:"2026-01-01T00:00:00.000Z" };
describe("spaced review", () => {
  it("advances a successful recall", () => { const result = scheduleReview(card, 5, new Date("2026-01-01T00:00:00Z")); expect(result.repetitions).toBe(1); expect(result.intervalDays).toBe(1); });
  it("resets a failed recall", () => { const result = scheduleReview({ ...card, repetitions:4,intervalDays:20 }, 1); expect(result.repetitions).toBe(0); expect(result.intervalDays).toBe(1); });
});
