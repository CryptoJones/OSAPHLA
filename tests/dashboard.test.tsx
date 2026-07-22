import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import spanishJson from "../src/data/es/course.json";
import { CourseProvider } from "../src/course";
import { Dashboard } from "../src/components/Dashboard";
import type { Course } from "../src/types";

describe("dashboard module lookup", () => {
  it("renders a safe heading when the active module is missing", () => {
    const course = { ...spanishJson, modules: spanishJson.modules.slice(1) } as Course;
    render(<MemoryRouter><CourseProvider course={course}><Dashboard course={course} progress={{}} /></CourseProvider></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Week 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Begin week one" })).toHaveAttribute("href", "/es/lesson/w01-briefing");
  });
});
