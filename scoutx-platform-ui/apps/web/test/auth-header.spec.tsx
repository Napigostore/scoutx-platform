import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthHeaderActions } from "../src/components/auth/auth-header";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

import { useSession } from "next-auth/react";

const mockUseSession = useSession as ReturnType<typeof vi.fn>;

describe("AuthHeaderActions", () => {
  it("should show loading state", () => {
    mockUseSession.mockReturnValue({ data: null, status: "loading" });
    const { container } = render(<AuthHeaderActions />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThanOrEqual(1);
  });

  it("should show sign-in button when unauthenticated", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    render(<AuthHeaderActions />);
    expect(screen.getByText("Sign in")).toBeDefined();
    expect(screen.getByText("Launch mission")).toBeDefined();
  });

  it("should show dashboard when authenticated as REQUESTER", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", email: "t@t.com", role: "REQUESTER" } },
      status: "authenticated",
    });
    render(<AuthHeaderActions />);
    expect(screen.getByText("t@t.com")).toBeDefined();
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Sign out")).toBeDefined();
    expect(screen.getByText("Dashboard").closest("a")?.getAttribute("href")).toBe("/missions");
  });

  it("should link to scout dashboard for SCOUT", () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "s1", email: "s@t.com", role: "SCOUT" } },
      status: "authenticated",
    });
    render(<AuthHeaderActions />);
    expect(screen.getByText("Dashboard").closest("a")?.getAttribute("href")).toBe("/scout/missions");
  });
});
