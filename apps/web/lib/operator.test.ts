import { describe, expect, it } from "vitest";

import { resolveOperator } from "./operator";

describe("resolveOperator", () => {
  it("falls back to an explicit notice when nothing is configured", () => {
    const operator = resolveOperator({});
    expect(operator.name).toBe("Operator not configured");
    expect(operator.representative).toBeNull();
    expect(operator.address).toEqual([]);
    expect(operator.email).toBeNull();
    expect(operator.location).toBeNull();
    expect(operator.authority).toBeNull();
  });

  it("splits the address on pipes and trims every value", () => {
    const operator = resolveOperator({
      NEXT_PUBLIC_OPERATOR_NAME: "  Example Studio ",
      NEXT_PUBLIC_OPERATOR_REPRESENTATIVE: "Jane Doe",
      NEXT_PUBLIC_OPERATOR_ADDRESS: "Example Street 1 | 12345 Example City |  | Germany",
      NEXT_PUBLIC_OPERATOR_EMAIL: "hello@example.com",
      NEXT_PUBLIC_OPERATOR_LOCATION: "Example City, Germany"
    });
    expect(operator.name).toBe("Example Studio");
    expect(operator.address).toEqual(["Example Street 1", "12345 Example City", "Germany"]);
    expect(operator.email).toBe("hello@example.com");
  });
});
