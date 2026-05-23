describe("collaboration-tools exports", () => {
  test("reviewCode returns formatted review message", async () => {
    const { reviewCode } = await import("./index.mjs");
    expect(reviewCode("const x = 1;")).toBe("Reviewing code: const x = 1;");
  });

  test("trackIssue returns formatted tracking message", async () => {
    const { trackIssue } = await import("./index.mjs");
    expect(trackIssue("BUG-123")).toBe("Tracking issue: BUG-123");
  });
});
